import { ZodSchema } from 'zod'
import { ApiProperty } from '@nestjs/swagger'

/**
 * Basic utility to create DTOs from Zod schemas
 * This is a simplified version that works with the current setup
 */
export function createBasicDto(schema: ZodSchema) {
  class BasicDto {
    // This will be populated by the Zod validation pipe
  }
  
  return BasicDto
}

/**
 * Create a response DTO with description
 */
export function createResponseDto(description?: string) {
  class ResponseDto {
    @ApiProperty({ description: description || 'Response data' })
    data: any
  }
  
  return ResponseDto
}

/**
 * Utility to create paginated response DTOs
 */
export function createPaginatedResponseDto() {
  class PaginatedResponseDto {
    @ApiProperty({ description: 'Array of items' })
    data: any[]
    
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
