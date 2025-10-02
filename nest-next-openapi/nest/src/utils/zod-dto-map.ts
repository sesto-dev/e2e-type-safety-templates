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
export const UserZ = zodGenerated.UserModelSchema

export const UserDto = createZodDto(UserZ)

// export a list for easy registration
export const AllDtos = [UserDto]
