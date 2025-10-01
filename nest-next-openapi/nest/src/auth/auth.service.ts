// src/auth/auth.service.ts
import 'dotenv/config' // <<-- loads .env into process.env
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name)

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  // generate random 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // send OTP (replace with a real mailer)
  async sendOtp(email: string) {
    const otp = this.generateOTP()
    const user = await this.prisma.user.upsert({
      where: { email },
      update: { otp },
      create: { email, otp },
    })

    // TODO: integrate with your mailer or Celery equivalent. For now log.
    this.logger.log(`Sending OTP ${otp} to ${email}`)
    return { ok: true }
  }

  async verifyOtp(
    email: string,
    code: string,
    cookieDomain?: string,
    ip?: string,
    ua?: string
  ) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) throw new BadRequestException('User not found')
    if (!user.otp || user.otp !== code)
      throw new BadRequestException('Invalid OTP')

    // clear OTP, mark email verified
    await this.prisma.user.update({
      where: { email },
      data: { otp: '', is_email_verified: true },
    })

    // create refresh token record and JWTs
    return this.issueTokensForUser(user.id, cookieDomain, ip, ua)
  }

  // create signed access + refresh JWTs and persist refresh token record
  async issueTokensForUser(
    userId: string,
    cookieDomain?: string,
    ip?: string,
    ua?: string
  ) {
    const now = new Date()
    const refreshJti = uuidv4() // token id for database tracking
    const refreshExpiresSeconds = parseInt(
      process.env.REFRESH_TTL_SECONDS || `${60 * 60 * 24 * 30}`
    ) // default 30d
    const accessExpiresSeconds = parseInt(
      process.env.ACCESS_TTL_SECONDS || `${60 * 15}`
    ) // default 15m

    const refreshExp = Math.floor(
      (Date.now() + refreshExpiresSeconds * 1000) / 1000
    )
    const accessExp = Math.floor(
      (Date.now() + accessExpiresSeconds * 1000) / 1000
    )

    // Create DB refresh token record BEFORE signing token (helps idempotency)
    const refreshRecord = await this.prisma.refreshToken.create({
      data: {
        token: refreshJti,
        userId,
        expiresAt: new Date(Date.now() + refreshExpiresSeconds * 1000),
      },
    })

    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: process.env.JWT_SECRET_KEY,
        expiresIn: `${accessExpiresSeconds}s`,
      }
    )

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, jti: refreshJti },
      {
        secret: process.env.JWT_SECRET_KEY,
        expiresIn: `${refreshExpiresSeconds}s`,
      }
    )

    return {
      accessToken,
      refreshToken,
      accessTtlSeconds: accessExpiresSeconds,
      refreshTtlSeconds: refreshExpiresSeconds,
      refreshRecordId: refreshRecord.id,
    }
  }

  async verifyAccessToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET_KEY,
      })
      return payload
    } catch (e) {
      this.logger.debug('Access token verification failed', e?.message || e)
      return null
    }
  }

  async rotateRefreshToken(oldToken: string) {
    // Validate the old refresh token, ensure DB record exists and not revoked, then blacklist it and issue a new pair.
    try {
      const payload = await this.jwtService.verifyAsync(oldToken, {
        secret: process.env.JWT_SECRET_KEY,
      })
      const jti = payload.jti
      const userId = payload.sub

      if (!jti || !userId)
        throw new UnauthorizedException('Invalid refresh token payload')

      const existing = await this.prisma.refreshToken.findUnique({
        where: { token: jti },
      })
      if (!existing || existing.revoked)
        throw new UnauthorizedException('Refresh token revoked or not found')

      // revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { token: jti },
        data: { revoked: true },
      })

      // create new tokens
      return this.issueTokensForUser(userId)
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_SECRET_KEY,
      })
      const jti = payload.jti
      if (jti) {
        await this.prisma.refreshToken.updateMany({
          where: { token: jti },
          data: { revoked: true },
        })
      }
    } catch (e) {
      // ignore invalid token
    }
  }

  // Google OAuth: verify id_token server side and upsert user
  async handleGoogleIdToken(idInfo: any, ip?: string, ua?: string) {
    const email = idInfo.email
    const name = idInfo.name
    const avatar = idInfo.picture
    if (!email)
      throw new BadRequestException('Email not present in Google token')

    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: name || '',
        avatar: avatar || '',
        is_email_verified: true,
      },
      update: {
        name: { set: name || undefined },
        avatar: { set: avatar || undefined },
        is_email_verified: true,
      },
    })

    return this.issueTokensForUser(user.id)
  }
}
