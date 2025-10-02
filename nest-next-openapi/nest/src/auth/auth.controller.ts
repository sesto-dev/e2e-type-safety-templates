// src/auth/auth.controller.ts

import 'dotenv/config' // <<-- loads .env into process.env
import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Response, Request } from 'express'
import axios from 'axios'
import * as crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'

import { AuthService } from './auth.service'
import { setAuthCookies } from '../utils/cookie.util'
import { JwtCookieGuard } from './guards/jwt-cookie.guard'
import { PrismaService } from '../prisma/prisma.service'
import { ApiZodEndpoint } from '../decorators/api-zod.decorator'
import { ZodBody } from '../decorators/zod-body.decorator'
import {
  OTPRequestSchema,
  OTPVerifySchema,
  LogoutSchema,
  UserMeResponseSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
} from './dto/auth.dto'
import type { User } from '@prisma/client'
import { UserResultSchema } from '~/generated/zod/schemas'

interface ExtendedRequest extends Request {
  user?: Partial<User> | { sub?: string; [k: string]: any } | null
  session: any
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(
    private auth: AuthService,
    private prisma: PrismaService
  ) {}

  @Post('otp/send')
  @ApiZodEndpoint({
    summary: 'Send OTP',
    description: "Send a one-time password to the user's email",
    tags: ['auth'],
    body: OTPRequestSchema,
    responses: [
      {
        status: 200,
        description: 'OTP sent successfully',
        schema: SuccessResponseSchema,
      },
      {
        status: 400,
        description: 'Invalid email format',
        schema: ErrorResponseSchema,
      },
    ],
  })
  async sendOtp(@ZodBody(OTPRequestSchema) dto: any) {
    await this.auth.sendOtp(dto.email)
    return { detail: 'OTP sent' }
  }

  @Post('otp/verify')
  @ApiZodEndpoint({
    summary: 'Verify OTP',
    description: 'Verify the one-time password and authenticate the user',
    tags: ['auth'],
    body: OTPVerifySchema,
    responses: [
      {
        status: 200,
        description: 'OTP verified successfully',
        schema: SuccessResponseSchema,
      },
      {
        status: 400,
        description: 'Invalid OTP code',
        schema: ErrorResponseSchema,
      },
    ],
  })
  async verifyOtp(
    @ZodBody(OTPVerifySchema) dto: any,
    @Res({ passthrough: true }) res: Response,
    @Req() req: ExtendedRequest
  ) {
    const ip = req.ip
    const ua = req.headers['user-agent']
    const tokens = await this.auth.verifyOtp(
      dto.email,
      dto.code,
      process.env.COOKIE_DOMAIN,
      ip,
      ua
    )
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, {
      cookieDomain: process.env.COOKIE_DOMAIN,
      accessTtlSeconds: tokens.accessTtlSeconds,
      refreshTtlSeconds: tokens.refreshTtlSeconds,
      secure: process.env.NODE_ENV === 'production',
    })
    return { detail: 'OTP verified' }
  }

  @Post('logout')
  @UseGuards(JwtCookieGuard)
  @HttpCode(HttpStatus.RESET_CONTENT)
  @ApiZodEndpoint({
    summary: 'Logout',
    description: 'Logout the current user and clear authentication cookies',
    tags: ['auth'],
    responses: [
      { status: 204, description: 'Logout successful' },
      { status: 401, description: 'Unauthorized', schema: ErrorResponseSchema },
    ],
  })
  async logout(
    @Req() req: ExtendedRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refresh_token
    await this.auth.logout(refreshToken)
    res.clearCookie('access_token', {
      domain: process.env.COOKIE_DOMAIN,
      path: '/',
    })
    res.clearCookie('refresh_token', {
      domain: process.env.COOKIE_DOMAIN,
      path: '/',
    })
    return res
  }

  @Post('token/refresh')
  async refresh(
    @Req() req: ExtendedRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const oldRefresh = req.cookies?.refresh_token
    if (!oldRefresh) {
      return res
        .status(401)
        .json({ detail: 'Refresh token not found in cookies' })
    }

    const tokens = await this.auth.rotateRefreshToken(oldRefresh)
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, {
      cookieDomain: process.env.COOKIE_DOMAIN,
      accessTtlSeconds: tokens.accessTtlSeconds,
      refreshTtlSeconds: tokens.refreshTtlSeconds,
      secure: process.env.NODE_ENV === 'production',
    })
    return { detail: 'Token refreshed' }
  }

  @Get('me')
  @UseGuards(JwtCookieGuard)
  @ApiZodEndpoint({
    summary: 'Get current user',
    description: 'Get information about the currently authenticated user',
    tags: ['auth'],
    responses: [
      {
        status: 200,
        description: 'User information',
        schema: UserResultSchema.pick({
          id: true,
          email: true,
          name: true,
          birthday: true,
          avatar: true,
          phone: true,
          is_email_verified: true,
        }),
      },
      { status: 401, description: 'Unauthorized', schema: ErrorResponseSchema },
    ],
  })
  async me(@Req() req: ExtendedRequest) {
    const userId = req.user?.id
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        birthday: true,
        avatar: true,
        phone: true,
        is_email_verified: true,
      },
    })

    return user
  }

  // Google OAuth init (PKCE + state) — store values in session
  @Get('google')
  async googleInit(@Req() req: ExtendedRequest, @Res() res: Response) {
    try {
      // generate state + PKCE code verifier
      const state = crypto.randomBytes(24).toString('base64url')
      const codeVerifier = crypto.randomBytes(32).toString('base64url')

      // store in session
      req.session = req.session || {}
      req.session.google_oauth_state = state
      req.session.google_code_verifier = codeVerifier

      // compute code challenge (SHA256, base64url)
      const hash = crypto.createHash('sha256').update(codeVerifier).digest()
      const codeChallengeB64Url = Buffer.from(hash).toString('base64url')

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
        scope: 'openid email profile',
        state,
        code_challenge: codeChallengeB64Url,
        code_challenge_method: 'S256',
        prompt: 'select_account',
      })

      // ensure session is saved before redirecting
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) {
            this.logger.error(
              'Failed to save session before Google redirect',
              err
            )
            return reject(
              new Error(err instanceof Error ? err.message : String(err))
            )
          }
          resolve()
        })
      })

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
      return res.redirect(authUrl)
    } catch (err) {
      this.logger.error('googleInit error', err)
      return res.status(500).send('Internal server error')
    }
  }

  // ------------------------------------------------------------
  // Google OAuth callback — exchange code, verify id_token, upsert user
  // ------------------------------------------------------------
  @Get('google/callback')
  async googleCallback(@Req() req: ExtendedRequest, @Res() res: Response) {
    try {
      console.log('JWT secret key is:')
      console.log(process.env.JWT_SECRET_KEY)
      this.logger.debug('Google callback hit')

      const code = typeof req.query?.code === 'string' ? req.query.code : ''
      const state = typeof req.query?.state === 'string' ? req.query.state : ''

      if (!code || !state) {
        this.logger.warn('Missing code or state in callback query', {
          code: !!code,
          state: !!state,
        })
        return res.status(400).json({ detail: 'Missing code or state' })
      }

      const storedState = req.session?.google_oauth_state
      const codeVerifier = req.session?.google_code_verifier

      if (!storedState || !codeVerifier) {
        this.logger.warn(
          'No PKCE/state found in session; session may be missing or expired'
        )
        return res.status(400).json({ detail: 'Session expired or missing' })
      }

      if (storedState !== state) {
        this.logger.warn('Invalid OAuth state', { storedState, state })
        return res.status(400).json({ detail: 'Invalid state' })
      }

      // Exchange authorization code for tokens (we keep axios but validate id_token using google-auth-library)
      const tokenUrl = 'https://oauth2.googleapis.com/token'
      const params = new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      })

      const tokenResponse = await axios.post(tokenUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10_000,
      })

      if (tokenResponse.status !== 200) {
        this.logger.error('Token exchange failed', {
          status: tokenResponse.status,
          data: tokenResponse.data,
        })
        return res
          .status(400)
          .json({ detail: 'Failed to get tokens from Google' })
      }

      const idToken = tokenResponse.data?.id_token
      if (!idToken) {
        this.logger.error('id_token missing from token response', {
          data: tokenResponse.data,
        })
        return res.status(400).json({ detail: 'Missing id_token' })
      }

      // Verify id_token server-side with google-auth-library (more robust than tokeninfo endpoint)
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID as string
      )
      const ticket = await oauth2Client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID as string,
      })
      const idInfo = ticket.getPayload()
      if (!idInfo || !idInfo.email) {
        this.logger.error('Invalid id_token payload', { payload: idInfo })
        return res.status(400).json({ detail: 'Invalid id_token payload' })
      }

      // Upsert user and issue tokens
      const ip = req.ip
      const ua = String(req.headers['user-agent'] || '')
      const tokens = await this.auth.handleGoogleIdToken(idInfo, ip, ua)

      // Set auth cookies
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken, {
        cookieDomain: process.env.COOKIE_DOMAIN,
        accessTtlSeconds: tokens.accessTtlSeconds,
        refreshTtlSeconds: tokens.refreshTtlSeconds,
        secure: process.env.NODE_ENV === 'production',
      })

      // Clear session PKCE/state
      delete req.session.google_oauth_state
      delete req.session.google_code_verifier
      // best-effort save (don't block response on save failure)
      req.session.save?.((err: any) => {
        if (err)
          this.logger.warn(
            'Failed to save session after clearing google oauth keys',
            err
          )
      })

      const redirectUrl = process.env.GOOGLE_REDIRECT_DASHBOARD_URI || '/'
      return res.redirect(redirectUrl)
    } catch (err) {
      this.logger.error('googleCallback error', err)
      // Safety: remove PKCE/state to avoid replay attempts
      try {
        delete req.session.google_oauth_state
        delete req.session.google_code_verifier
      } catch (e) {
        /* ignore */
      }
      return res.status(500).json({ detail: 'Internal server error' })
    }
  }
}
