#!/usr/bin/env ts-node

process.env.GENERATE_OPENAPI = 'true' // optional: used by services to skip external init

process.on('unhandledRejection', (reason, promise) => {
  console.error('⛔ Unhandled Rejection at:', promise, 'reason:', reason)
  // show stack if available
  if (reason && (reason as any).stack) console.error((reason as any).stack)
  process.exitCode = 1
})

process.on('uncaughtException', (err) => {
  console.error('⛔ Uncaught Exception:', err && (err.stack || err))
  process.exitCode = 1
})

import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { writeFileSync } from 'fs'
import { join } from 'path'

import { AllDtos } from '../utils/zod-dto-map'
import { AppModule } from '../app.module'

async function generateOpenApi() {
  console.log('🚀 Starting OpenAPI generation...')

  try {
    console.log('🔧 Initializing OpenAPI try and catch...')
    // Create a temporary app instance
    const app = await NestFactory.create(AppModule, { logger: false })

    console.log('🛠 Setting up OpenAPI document...')

    // Create OpenAPI document
    const config = new DocumentBuilder()
      .setTitle('Nest-Next-OpenAPI-Template API')
      .setDescription('The Nest-Next-OpenAPI-Template API documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth'
      )
      .addCookieAuth('access_token', {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'Access token stored in HTTP-only cookie',
      })
      .addTag('auth', 'Authentication endpoints')
      .build()

    const document = SwaggerModule.createDocument(app, config, {
      extraModels: AllDtos,
    })

    document.components = document.components || { schemas: {} }

    // Write to file
    const outputPath = join(process.cwd(), 'openapi.json')
    writeFileSync(outputPath, JSON.stringify(document, null, 2))

    console.log(`✅ OpenAPI spec generated successfully at: ${outputPath}`)
    console.log(
      `📊 Found ${Object.keys(document.paths || {}).length} endpoints`
    )

    // Close the app
    await app.close()

    process.exit(0)
  } catch (error) {
    console.error('❌ Error generating OpenAPI spec:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  generateOpenApi()
}

export { generateOpenApi }
