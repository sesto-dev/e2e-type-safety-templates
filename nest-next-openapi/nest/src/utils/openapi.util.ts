import { ZodSchema, ZodType } from 'zod'
import { createZodDto } from '@anatine/zod-nestjs'
import { ApiProperty } from '@nestjs/swagger'
import { zodToJsonSchema } from 'zod-to-json-schema'

/**
 * Convert a Zod schema to OpenAPI schema
 */
export function zodToOpenApiSchema(zodSchema: ZodSchema): any {
  try {
    return zodToJsonSchema(zodSchema, {
      target: 'openApi3',
      strictUnions: true,
      dateStrategy: 'string',
    })
  } catch (error) {
    console.warn('Failed to convert Zod schema to OpenAPI:', error)
    return {}
  }
}

/**
 * Create a DTO class from a Zod schema with OpenAPI decorators
 */
export function createOpenApiDto<T extends ZodType>(zodSchema: T) {
  try {
    const DtoClass = createZodDto(zodSchema)

    // Get the OpenAPI schema
    const openApiSchema = zodToOpenApiSchema(zodSchema)

    // Apply ApiProperty decorators to the DTO class
    if (openApiSchema.properties) {
      Object.entries(openApiSchema.properties).forEach(
        ([key, value]: [string, any]) => {
          const descriptor = Object.getOwnPropertyDescriptor(
            DtoClass.prototype,
            key
          )
          if (descriptor) {
            ApiProperty({
              description: value.description,
              type: mapJsonSchemaTypeToNestType(value.type),
              required: openApiSchema.required?.includes(key),
              example: value.examples?.[0] || value.example,
              enum: value.enum,
              format: value.format,
            })(DtoClass.prototype, key)
          }
        }
      )
    }

    return DtoClass
  } catch (error) {
    console.warn('Failed to create OpenAPI DTO:', error)
    // Fallback to basic Zod DTO
    return createZodDto(zodSchema)
  }
}

/**
 * Map JSON Schema types to NestJS types
 */
function mapJsonSchemaTypeToNestType(type: string | string[]): any {
  if (Array.isArray(type)) {
    return type.map(mapJsonSchemaTypeToNestType)
  }

  switch (type) {
    case 'string':
      return String
    case 'number':
    case 'integer':
      return Number
    case 'boolean':
      return Boolean
    case 'array':
      return Array
    case 'object':
      return Object
    default:
      return String
  }
}

/**
 * Create response DTO with OpenAPI metadata
 */
export function createResponseDto<T extends ZodType>(
  zodSchema: T,
  description?: string
) {
  const DtoClass = createOpenApiDto(zodSchema)

  // Add class-level metadata
  if (description) {
    // Apply description to the class itself
    Object.defineProperty(DtoClass, 'description', { value: description })
  }

  return DtoClass
}

/**
 * Utility to create paginated response DTOs
 */
export function createPaginatedResponseDto<T extends ZodType>(itemSchema: T) {
  const ItemDto = createOpenApiDto(itemSchema)

  class PaginatedResponseDto {
    @ApiProperty({ type: [ItemDto] })
    data: InstanceType<typeof ItemDto>[]

    @ApiProperty({ description: 'Total number of items' })
    total: number

    @ApiProperty({ description: 'Current page number' })
    page: number

    @ApiProperty({ description: 'Number of items per page' })
    limit: number

    @ApiProperty({ description: 'Total number of pages' })
    totalPages: number
  }

  return PaginatedResponseDto
}
