// src/utils/cookie.util.ts
import { Response } from 'express'

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  options: {
    cookieDomain?: string
    accessTtlSeconds?: number
    refreshTtlSeconds?: number
    secure?: boolean
  }
) {
  const {
    cookieDomain,
    accessTtlSeconds = 60 * 15,
    refreshTtlSeconds = 60 * 60 * 24 * 30,
    secure = false,
  } = options

  const accessExpires = new Date(Date.now() + accessTtlSeconds * 1000)
  const refreshExpires = new Date(Date.now() + refreshTtlSeconds * 1000)

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    expires: accessExpires,
    domain: cookieDomain,
    path: '/',
  })

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    expires: refreshExpires,
    domain: cookieDomain,
    path: '/',
  })

  return res
}
