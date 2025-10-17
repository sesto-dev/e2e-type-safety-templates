// src/app.module.ts
import { Module } from '@nestjs/common'
import { APP_PIPE } from '@nestjs/core'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaService } from './prisma/prisma.service'
import { TodosController } from './todos/todos.controller'

// Zod validation pipe from nestjs-zod
import { ZodValidationPipe } from 'nestjs-zod'

@Module({
  imports: [],
  controllers: [AppController, TodosController],
  providers: [
    AppService,
    PrismaService,
    // register global ZodValidationPipe so createZodDto DTOs are validated automatically
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
