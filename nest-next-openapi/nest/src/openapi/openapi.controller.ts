// src/openapi/openapi.controller.ts
import { Controller, Get, Header, Res } from '@nestjs/common'
import { OpenApiService } from './openapi.service'
import { Response } from 'express'

@Controller('api')
export class OpenApiController {
  constructor(private readonly openApiService: OpenApiService) {}

  @Get('openapi.json')
  @Header('Content-Type', 'application/json')
  getOpenApi(@Res() res: Response) {
    const doc = this.openApiService.getDocument()
    if (!doc) {
      return res.status(503).json({ error: 'OpenAPI spec not available' })
    }

    // Optional: set caching headers for production
    res.setHeader('Cache-Control', 'public, max-age=3600') // adjust as needed
    return res.status(200).send(doc) // doc is already a JSON object or string
  }
}
