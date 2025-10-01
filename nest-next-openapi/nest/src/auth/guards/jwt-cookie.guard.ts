// src/auth/guards/jwt-cookie.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthService } from '../auth.service'

@Injectable()
export class JwtCookieGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest()
    const header = req.headers.authorization
    let token: string | undefined
    if (header && header.startsWith('Bearer ')) {
      token = header.split(' ')[1]
    } else {
      token = req.cookies?.access_token
    }
    if (!token) {
      throw new UnauthorizedException('No access token')
    }
    const payload = await this.authService.verifyAccessToken(token)
    if (!payload) throw new UnauthorizedException('Invalid token')
    req.user = payload // attach payload (includes sub)
    return true
  }
}
