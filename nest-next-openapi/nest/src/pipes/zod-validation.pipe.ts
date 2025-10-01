import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common'
import { ZodSchema, ZodError } from 'zod'

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value)
      return parsedValue
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }))
        
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errorMessages,
        })
      }
      throw new BadRequestException('Validation failed')
    }
  }
}

/**
 * Create a validation pipe for a specific Zod schema
 */
export function createZodValidationPipe<T extends ZodSchema>(schema: T) {
  return new ZodValidationPipe(schema)
}
