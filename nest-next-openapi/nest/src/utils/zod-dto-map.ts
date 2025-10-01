// src/utils/zod-dto-map.ts
import { createZodDto } from '@anatine/zod-nestjs'
/**
 * Import the generated zod schemas produced by prisma-zod-generator.
 * Adjust the import path/names depending on your generator output.
 *
 * Example: prisma-zod-generator often emits something like:
 *   src/generated/zod/models/ticket.ts
 *   src/generated/zod/index.ts
 */
import * as zodGenerated from '../generated/zod/schemas' // adjust path

// Example: pick the schemas you need
export const TicketZ = zodGenerated.TicketModelSchema
export const TicketMessageZ = zodGenerated.TicketMessageModelSchema
export const UserZ = zodGenerated.TicketModelSchema

export const TicketDto = createZodDto(TicketZ)
export const TicketMessageDto = createZodDto(TicketMessageZ)
export const UserDto = createZodDto(UserZ)

// export a list for easy registration
export const AllDtos = [TicketDto, TicketMessageDto, UserDto]
