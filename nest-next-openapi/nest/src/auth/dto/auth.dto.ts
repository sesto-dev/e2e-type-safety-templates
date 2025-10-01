import { z } from 'zod'
import {
  createZodDto,
  createResponseDto,
} from '../../utils/simple-openapi.util'

// OTP Request Schema
export const OTPRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
})

// OTP Verify Schema
export const OTPVerifySchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().min(4, 'OTP code must be at least 4 characters'),
})

// Logout Schema
export const LogoutSchema = z.object({})

// User Response Schema (for /me endpoint)
export const UserMeResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  birthday: z.date().nullable(),
  avatar: z.string().nullable(),
  phone: z.string().nullable(),
  is_email_verified: z.boolean(),
  memberships: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['admin', 'member']),
      organization: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
      }),
    })
  ),
})

// Success Response Schema
export const SuccessResponseSchema = z.object({
  detail: z.string(),
})

// Error Response Schema
export const ErrorResponseSchema = z.object({
  detail: z.string(),
})

// Create DTOs
export const OTPRequestDto = createZodDto(OTPRequestSchema)
export const OTPVerifyDto = createZodDto(OTPVerifySchema)
export const LogoutDto = createZodDto(LogoutSchema)
export const UserMeResponseDto = createResponseDto(
  UserMeResponseSchema,
  'Current user information'
)
export const SuccessResponseDto = createResponseDto(
  SuccessResponseSchema,
  'Success response'
)
export const ErrorResponseDto = createResponseDto(
  ErrorResponseSchema,
  'Error response'
)
