// src/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { JwtModule } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { JwtCookieGuard } from './guards/jwt-cookie.guard'

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}), // we call signAsync with secrets from env
  ],
  providers: [AuthService, PrismaService, JwtCookieGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtCookieGuard], // <-- IMPORTANT: export them
})
export class AuthModule {}
