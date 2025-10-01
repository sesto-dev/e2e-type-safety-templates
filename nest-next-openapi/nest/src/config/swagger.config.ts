import 'dotenv/config' // <<-- loads .env into process.env
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { INestApplication } from '@nestjs/common'
import { writeFileSync } from 'fs'
import { join } from 'path'

export function setupSwagger(app: INestApplication) {
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
    .addTag('users', 'User management')
    .addTag('organizations', 'Organization management')
    .addTag('invitations', 'Invitations management')
    .addTag('memberships', 'Memberships management')
    .addTag('assessments', 'Assessment management')
    .addTag('payments', 'Payment processing')
    .addTag('notifications', 'Notification management')
    .addTag('referral', 'Referral management')
    .addTag('subscription', 'Subscription management')
    .addTag('files', 'File management')
    .addTag('tickets', 'Support tickets')
    .build()

  const document = SwaggerModule.createDocument(app, config)

  // Setup Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  })

  // Generate OpenAPI JSON file for frontend consumption
  const outputPath = join(process.cwd(), 'openapi.json')
  writeFileSync(outputPath, JSON.stringify(document, null, 2))

  console.log(
    `📚 Swagger documentation available at: http://localhost:${process.env.PORT || 3000}/api/docs`
  )
  console.log(`📄 OpenAPI spec generated at: ${outputPath}`)

  return document
}

/**
 * Generate OpenAPI spec without starting the server (for build scripts)
 */
export async function generateOpenApiSpec(
  app: INestApplication
): Promise<string> {
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
    .addTag('users', 'User management')
    .addTag('organizations', 'Organization management')
    .addTag('invitations', 'Invitations management')
    .addTag('memberships', 'Memberships management')
    .addTag('assessments', 'Assessment management')
    .addTag('payments', 'Payment processing')
    .addTag('notifications', 'Notification management')
    .addTag('referral', 'Referral management')
    .addTag('subscription', 'Subscription management')
    .addTag('files', 'File management')
    .addTag('tickets', 'Support tickets')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  return JSON.stringify(document, null, 2)
}
