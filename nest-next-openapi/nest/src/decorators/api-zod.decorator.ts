import { applyDecorators, Type } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ZodSchema } from 'zod'
import { createOpenApiDto, createResponseDto, createPaginatedResponseDto } from '../utils/openapi.util'

/**
 * Decorator for API endpoints that automatically generates OpenAPI documentation from Zod schemas
 */
export function ApiZodEndpoint(options: {
  summary?: string
  description?: string
  tags?: string[]
  body?: ZodSchema
  response?: ZodSchema
  responses?: Array<{
    status: number
    description?: string
    schema?: ZodSchema
  }>
  params?: Array<{
    name: string
    description?: string
    required?: boolean
    type?: any
  }>
  queries?: Array<{
    name: string
    description?: string
    required?: boolean
    type?: any
  }>
  isPaginated?: boolean
}) {
  const decorators: any[] = []

  // Add operation metadata
  if (options.summary || options.description) {
    decorators.push(
      ApiOperation({
        summary: options.summary,
        description: options.description,
        tags: options.tags,
      })
    )
  }

  // Add body schema
  if (options.body) {
    const BodyDto = createOpenApiDto(options.body)
    decorators.push(ApiBody({ type: BodyDto }))
  }

  // Add parameter decorators
  if (options.params) {
    options.params.forEach(param => {
      decorators.push(
        ApiParam({
          name: param.name,
          description: param.description,
          required: param.required ?? true,
          type: param.type,
        })
      )
    })
  }

  // Add query parameter decorators
  if (options.queries) {
    options.queries.forEach(query => {
      decorators.push(
        ApiQuery({
          name: query.name,
          description: query.description,
          required: query.required ?? false,
          type: query.type,
        })
      )
    })
  }

  // Add response schemas
  if (options.responses) {
    options.responses.forEach(response => {
      if (response.schema) {
        const ResponseDto = createOpenApiDto(response.schema)
        decorators.push(
          ApiResponse({
            status: response.status,
            description: response.description,
            type: ResponseDto,
          })
        )
      } else {
        decorators.push(
          ApiResponse({
            status: response.status,
            description: response.description,
          })
        )
      }
    })
  } else if (options.response) {
    // Single response schema
    const ResponseDto = options.isPaginated 
      ? createPaginatedResponseDto(options.response)
      : createResponseDto(options.response)
    
    decorators.push(
      ApiResponse({
        status: 200,
        description: 'Successful response',
        type: ResponseDto,
      })
    )
  }

  return applyDecorators(...decorators)
}

/**
 * Decorator for CRUD operations with automatic OpenAPI generation
 */
export function ApiCrudEndpoint(options: {
  entity: string
  operation: 'create' | 'read' | 'update' | 'delete' | 'list'
  createSchema?: ZodSchema
  updateSchema?: ZodSchema
  responseSchema?: ZodSchema
  tags?: string[]
}) {
  const { entity, operation, createSchema, updateSchema, responseSchema, tags = [] } = options

  const operationConfigs = {
    create: {
      summary: `Create ${entity}`,
      description: `Create a new ${entity.toLowerCase()}`,
      body: createSchema,
      response: responseSchema,
      responses: [
        { status: 201, description: `${entity} created successfully`, schema: responseSchema },
        { status: 400, description: 'Invalid input data' },
        { status: 409, description: 'Conflict - resource already exists' },
      ],
    },
    read: {
      summary: `Get ${entity}`,
      description: `Get a ${entity.toLowerCase()} by ID`,
      response: responseSchema,
      params: [
        { name: 'id', description: `${entity} ID`, type: String },
      ],
      responses: [
        { status: 200, description: `${entity} found`, schema: responseSchema },
        { status: 404, description: `${entity} not found` },
      ],
    },
    update: {
      summary: `Update ${entity}`,
      description: `Update an existing ${entity.toLowerCase()}`,
      body: updateSchema,
      response: responseSchema,
      params: [
        { name: 'id', description: `${entity} ID`, type: String },
      ],
      responses: [
        { status: 200, description: `${entity} updated successfully`, schema: responseSchema },
        { status: 400, description: 'Invalid input data' },
        { status: 404, description: `${entity} not found` },
      ],
    },
    delete: {
      summary: `Delete ${entity}`,
      description: `Delete a ${entity.toLowerCase()}`,
      params: [
        { name: 'id', description: `${entity} ID`, type: String },
      ],
      responses: [
        { status: 204, description: `${entity} deleted successfully` },
        { status: 404, description: `${entity} not found` },
      ],
    },
    list: {
      summary: `List ${entity}s`,
      description: `Get a list of ${entity.toLowerCase()}s`,
      response: responseSchema,
      isPaginated: true,
      queries: [
        { name: 'page', description: 'Page number', type: Number, required: false },
        { name: 'limit', description: 'Items per page', type: Number, required: false },
        { name: 'search', description: 'Search term', type: String, required: false },
      ],
      responses: [
        { status: 200, description: 'List of items', schema: responseSchema },
      ],
    },
  }

  const config = operationConfigs[operation]
  return ApiZodEndpoint({
    ...config,
    tags: [...tags, entity],
  })
}
