import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common'

import { OpenApiModule } from './openapi/openapi.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { PrismaModule } from './prisma/prisma.module'
import { RequestLoggingMiddleware } from './middleware/request-logging.middleware'

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    OpenApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*')
  }
}
