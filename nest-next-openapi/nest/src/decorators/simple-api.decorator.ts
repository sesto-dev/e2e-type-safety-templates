import { applyDecorators, Type } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ZodSchema } from 'zod'

/**
 * Simple decorator for API endpoints with basic OpenAPI documentation
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
    decorators.push(ApiBody({ 
      description: 'Request body',
      schema: {
        type: 'object',
        properties: {},
      }
    }))
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
      decorators.push(
        ApiResponse({
          status: response.status,
          description: response.description,
        })
      )
    })
  } else if (options.response) {
    // Single response schema
    decorators.push(
      ApiResponse({
        status: 200,
        description: 'Successful response',
      })
    )
  }

  return applyDecorators(...decorators)
}

/**
 * Simple CRUD decorator
 */
export function ApiCrudEndpoint(options: {
  entity: string
  operation: 'create' | 'read' | 'update' | 'delete' | 'list'
  tags?: string[]
}) {
  const { entity, operation, tags = [] } = options

  const operationConfigs = {
    create: {
      summary: `Create ${entity}`,
      description: `Create a new ${entity.toLowerCase()}`,
      responses: [
        { status: 201, description: `${entity} created successfully` },
        { status: 400, description: 'Invalid input data' },
      ],
    },
    read: {
      summary: `Get ${entity}`,
      description: `Get a ${entity.toLowerCase()} by ID`,
      params: [
        { name: 'id', description: `${entity} ID`, type: String },
      ],
      responses: [
        { status: 200, description: `${entity} found` },
        { status: 404, description: `${entity} not found` },
      ],
    },
    update: {
      summary: `Update ${entity}`,
      description: `Update an existing ${entity.toLowerCase()}`,
      params: [
        { name: 'id', description: `${entity} ID`, type: String },
      ],
      responses: [
        { status: 200, description: `${entity} updated successfully` },
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
      queries: [
        { name: 'page', description: 'Page number', type: Number, required: false },
        { name: 'limit', description: 'Items per page', type: Number, required: false },
      ],
      responses: [
        { status: 200, description: 'List of items' },
      ],
    },
  }

  const config = operationConfigs[operation]
  return ApiZodEndpoint({
    ...config,
    tags: [...tags, entity],
  })
}
