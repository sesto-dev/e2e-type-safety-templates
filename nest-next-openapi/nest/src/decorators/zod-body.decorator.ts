import { createParamDecorator, ExecutionContext, UsePipes } from '@nestjs/common'
import { ZodSchema } from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation.pipe'

/**
 * Decorator to validate request body with Zod schema
 */
export function ZodBody(schema: ZodSchema) {
  return createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest()
      return request.body
    },
    [UsePipes(new ZodValidationPipe(schema))]
  )()
}

/**
 * Decorator to validate query parameters with Zod schema
 */
export function ZodQuery(schema: ZodSchema) {
  return createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest()
      return request.query
    },
    [UsePipes(new ZodValidationPipe(schema))]
  )()
}

/**
 * Decorator to validate route parameters with Zod schema
 */
export function ZodParam(schema: ZodSchema) {
  return createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest()
      return request.params
    },
    [UsePipes(new ZodValidationPipe(schema))]
  )()
}
