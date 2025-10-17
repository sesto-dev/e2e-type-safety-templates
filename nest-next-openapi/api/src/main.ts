// src/main.ts
// If you use the helper to patch Swagger to understand Zod -> OpenAPI, import boot before everything else:
import '@wahyubucil/nestjs-zod-openapi/boot'
import { patchNestjsSwagger } from '@wahyubucil/nestjs-zod-openapi'

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))

  const config = new DocumentBuilder()
    .setTitle('OpenAPI Schema')
    .setDescription('Detailed API documentation')
    .setVersion('1.0.0')
    .addCookieAuth('refresh_token')
    .build()

  // patch Swagger to consume Zod metadata (optional but useful)
  patchNestjsSwagger()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)
  app.getHttpAdapter().get('/openapi.json', (req, res) => res.json(document))

  await app.listen(process.env.PORT || 3000)
}
bootstrap()
