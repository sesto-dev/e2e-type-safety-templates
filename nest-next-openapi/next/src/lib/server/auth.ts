// app/lib/auth.ts
import jwt from 'jsonwebtoken'
import { promisify } from 'util'
import { cookies, headers } from 'next/headers'
import { User, Membership, Organization } from '@prisma/client'
import prisma from './prisma'

// Use promisified verify for async/await
const jwtVerify = promisify<string, jwt.Secret, any>(jwt.verify as any)

export type JwtPayload = {
  sub: string
  jti?: string
  iat?: number
  exp?: number
}

export type UserWithMembershipsAndOrganizations = User & {
  memberships: (Membership & {
    organization: Organization
  })[]
}

// ---------- Basic token helpers ----------

export async function getAccessTokenFromRequest(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    if (token) return token
    const hdrs = await headers()
    const auth = hdrs.get('authorization') || hdrs.get('Authorization')
    if (auth?.startsWith('Bearer ')) return auth.substring(7)
    return null
  } catch {
    return null
  }
}

export async function getRefreshTokenFromRequest(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('refreshToken')?.value
    if (token) return token
    const hdrs = await headers()
    // fallback: custom header
    const hdr = hdrs.get('x-refresh-token') || hdrs.get('X-Refresh-Token')
    return hdr ?? null
  } catch {
    return null
  }
}

export async function verifyAccessToken(): Promise<JwtPayload | null> {
  const token = await getAccessTokenFromRequest()
  if (!token) return null
  const secret = process.env.JWT_SECRET_KEY
  if (!secret) throw new Error('JWT_SECRET_KEY not configured')
  try {
    const payload = (await jwtVerify(token, secret)) as JwtPayload
    if (!payload?.sub) return null
    return payload
  } catch (err) {
    // invalid or expired
    return null
  }
}

export async function verifyRefreshToken(): Promise<JwtPayload | null> {
  const token = await getRefreshTokenFromRequest()
  if (!token) return null
  const secret = process.env.JWT_SECRET_KEY
  if (!secret) throw new Error('JWT_SECRET_KEY not configured')

  try {
    const payload = (await jwtVerify(token, secret)) as JwtPayload
    if (!payload?.sub) return null
    return payload
  } catch (error) {
    return null
  }
}

// ---------- Refresh flow helpers ----------

/**
 * Call your Nest backend refresh endpoint to rotate tokens.
 *
 * Assumptions:
 * - Your Nest backend exposes POST ${AUTH_BASE_URL}/auth/refresh
 *   which accepts either:
 *     - { refreshToken } in JSON body OR
 *     - reads HttpOnly cookie 'refreshToken' when request has cookie header
 *
 * - The backend response JSON on success is:
 *   { accessToken, refreshToken, accessTtlSeconds, refreshTtlSeconds }
 *
 * - AUTH_BASE_URL is set in process.env.AUTH_BASE_URL (e.g. "https://api.example.com")
 *
 * This helper will:
 * - call the backend,
 * - if it returns tokens, set them into server cookies (HttpOnly recommended at backend,
 *   but we set them here only if backend didn't set HttpOnly cookies).
 */
export async function refreshTokensWithBackend(): Promise<{
  accessToken: string
  refreshToken: string
} | null> {
  const refreshTokenFromRequest = await getRefreshTokenFromRequest()
  const base = process.env.AUTH_BASE_URL
  if (!base) throw new Error('AUTH_BASE_URL not set in environment')

  // try to send refresh token in body if available, otherwise rely on cookie-based backend flow
  const body: any = refreshTokenFromRequest
    ? { refreshToken: refreshTokenFromRequest }
    : null

  // Server-side fetch to your Nest backend
  const res = await fetch(`${base.replace(/\/$/, '')}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Credentials: if your backend sets HttpOnly cookies, you might need to forward cookies.
    // When calling from Next server, the runtime will not forward cookies automatically,
    // so either include the cookie value manually via header or send it in the body as above.
    body: body ? JSON.stringify(body) : null,
  })

  if (!res.ok) {
    return null
  }

  const data = await res.json().catch(() => null)
  if (!data || !data.accessToken || !data.refreshToken) return null

  // Persist tokens in cookies for subsequent server actions if you need to:
  // If your backend already sets HttpOnly cookies, you should NOT overwrite them here.
  // But it's common for server-to-server refresh to return tokens, and then we set
  // server cookies (NOT accessible client-side) for subsequent requests.
  try {
    const cookieStore = await cookies()

    // Set access token cookie — prefer short maxAge; mark HttpOnly and Secure at backend ideally.
    cookieStore.set({
      name: 'accessToken',
      value: data.accessToken,
      // note: these cookie options are available in Next server; adjust domain/path as needed
      maxAge: parseInt(process.env.ACCESS_TTL_SECONDS || '900'), // fallback 15m
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    cookieStore.set({
      name: 'refreshToken',
      value: data.refreshToken,
      maxAge: parseInt(
        process.env.REFRESH_TTL_SECONDS || `${60 * 60 * 24 * 30}`
      ), // fallback 30d
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  } catch {
    // If cookie setting isn't available in environment, that's okay — the backend may have set cookies already.
  }

  return { accessToken: data.accessToken, refreshToken: data.refreshToken }
}

/**
 * Try verify the access token. If invalid/expired, attempt backend refresh and re-verify.
 * Returns the valid JwtPayload and the actual accessToken used (which may be newly acquired), or null.
 */
export async function tryVerifyOrRefresh(): Promise<{
  payload: JwtPayload
  accessToken: string
} | null> {
  const accessToken = await getAccessTokenFromRequest()
  const verified = await verifyAccessToken()
  if (verified) return { payload: verified, accessToken: accessToken! }

  // access invalid/expired -> try refresh
  const refreshToken = await getRefreshTokenFromRequest()
  const refreshed = await refreshTokensWithBackend()
  if (!refreshed) return null

  // verify the newly issued access token
  const newlyVerified = await verifyRefreshToken()
  if (!newlyVerified) return null

  return { payload: newlyVerified, accessToken: refreshed.accessToken }
}

// ---------- DB helpers that use the above ----------

/**
 * Get current user, attempting refresh if access is expired.
 * Returns: { user } or null on unauthenticated.
 */
export async function getCurrentUser(): Promise<UserWithMembershipsAndOrganizations | null> {
  const verified = await tryVerifyOrRefresh()
  if (!verified) return null
  const userId = verified.payload.sub
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  })
  return user
}

/**
 * requireUser that throws if unauthenticated (use in server actions / server handlers).
 */
export async function requireUser(): Promise<UserWithMembershipsAndOrganizations> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireUserMemberOfThisOrganization(
  organizationId: string
) {
  const user = await requireUser()
  const isMember = user.memberships.some(
    (membership) => membership.organization.id === organizationId
  )

  if (!isMember) throw new Error('Unauthorized')

  return user
}

/**
 * call this to trigger logout locally and on backend.
 * Will call backend /auth/logout and clear cookies locally.
 */
export async function logout(): Promise<void> {
  const base = process.env.AUTH_BASE_URL
  if (!base) throw new Error('AUTH_BASE_URL not set')

  // call backend to revoke refresh token (backend should look up cookie or accept refreshToken in body)
  try {
    await fetch(`${base.replace(/\/$/, '')}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // optionally include refresh token in body
      body: JSON.stringify({ refreshToken: getRefreshTokenFromRequest() }),
    })
  } catch {
    // ignore
  }

  // clear cookies locally (server side)
  try {
    const cookieStore = await cookies()
    cookieStore.set({ name: 'accessToken', value: '', maxAge: 0, path: '/' })
    cookieStore.set({ name: 'refreshToken', value: '', maxAge: 0, path: '/' })
  } catch {
    // ignore if cookies() not available
  }
}
