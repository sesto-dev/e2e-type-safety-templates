// src/openapi/openapi.module.ts
import { Module } from '@nestjs/common'
import { OpenApiService } from './openapi.service'
import { OpenApiController } from './openapi.controller'

@Module({
  imports: [],
  providers: [OpenApiService],
  controllers: [OpenApiController],
})
export class OpenApiModule {}
