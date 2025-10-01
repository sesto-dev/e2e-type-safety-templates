// src/main.ts
import 'dotenv/config'
import * as express from 'express'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import * as cookieParser from 'cookie-parser'
import * as session from 'express-session'

import { RedisStore } from 'connect-redis'
import { createClient } from 'redis'

import { AppModule } from './app.module'
import { setupSwagger } from './config/swagger.config'
import { OpenApiService } from './openapi/openapi.service'

async function bootstrap() {
  // Initialize and await redis client so the store is ready before we register session middleware.
  const redisClient = createClient({ url: process.env.REDIS_URL })
  try {
    await redisClient.connect()
    console.log('Redis connected')
  } catch (err) {
    console.error('Could not connect to Redis:', err)
    // Depending on your needs you may want to fail fast here. For now we log and continue (session store may fail).
  }

  const redisStore = new RedisStore({
    client: redisClient,
    // Optional: prefix: 'sess:',
  })

  const app = await NestFactory.create(AppModule)

  // If your app sits behind a proxy (e.g., Heroku, GCP, AWS ALB), enable trust proxy
  if (
    process.env.TRUST_PROXY === '1' ||
    process.env.NODE_ENV === 'production'
  ) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1)
  }

  // Parse cookies so our guards/controllers can read access_token/refresh_token.
  app.use(cookieParser())

  // Session is required to store Google PKCE state/code_verifier between redirects.
  app.use(
    (session as any)({
      store: redisStore,
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || 'dev_session_secret_change_me',
      name: process.env.SESSION_NAME || 'nest_session',
      cookie: {
        httpOnly: true,
        // Only set secure in production (browsers will ignore secure cookies on http://localhost).
        secure: process.env.NODE_ENV === 'production',
        // sameSite none is required for cross-site redirects (frontend -> api -> google -> api),
        // but sameSite:'none' requires secure:true. So use 'lax' in dev and 'none' in prod.
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        // Optional: only set domain if provided. Don't set it in dev (localhost) or you'll break cookie matching.
        domain: process.env.COOKIE_DOMAIN || undefined,
        maxAge: parseInt(
          process.env.SESSION_MAX_AGE || `${1000 * 60 * 60 * 24}`,
          10
        ), // ms
      },
    })
  )

  // Allow cross-origin requests from your frontend(s) and allow cookies.
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  })

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  const document = setupSwagger(app)
  try {
    const openApiService = app.get(OpenApiService)
    openApiService.setDocument(document)
  } catch (err) {
    console.warn('OpenApiService not available to set document', err)
  }

  const port = parseInt(process.env.PORT || '3000', 10)
  await app.listen(port)
  console.log(`Nest application listening on http://localhost:${port}`)
}

bootstrap()
