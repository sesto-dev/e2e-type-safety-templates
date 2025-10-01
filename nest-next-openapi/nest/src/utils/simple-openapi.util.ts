import { ZodSchema, ZodType } from 'zod'
import { createZodDto as createZodDtoFromNest } from '@anatine/zod-nestjs'
import { ApiProperty } from '@nestjs/swagger'

/**
 * Simple utility to create DTOs from Zod schemas
 */
export function createZodDto(schema: ZodSchema) {
  return createZodDtoFromNest(schema as any)
}

/**
 * Create a response DTO with description
 */
export function createResponseDto<T extends ZodType>(zodSchema: T, description?: string) {
  const DtoClass = createZodDto(zodSchema)
  
  if (description) {
    Object.defineProperty(DtoClass, 'description', { value: description })
  }
  
  return DtoClass
}

/**
 * Utility to create paginated response DTOs
 */
export function createPaginatedResponseDto<T extends ZodType>(itemSchema: T) {
  const ItemDto = createZodDto(itemSchema)
  
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
