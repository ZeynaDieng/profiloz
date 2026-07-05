import './error-map.js'
import { MSG } from '@profiloz/shared'
import { z } from 'zod'

function emptyToUndefined(val: unknown) {
  if (val === '' || val === null || val === undefined) return undefined
  return val
}

export const registerSchema = z.object({
  email: z.string().min(1, MSG.validation.requiredAlt).email(MSG.validation.email),
  password: z
    .string()
    .min(1, MSG.validation.requiredAlt)
    .min(8, MSG.validation.passwordMin)
    .regex(/[A-Z]/, MSG.validation.passwordUppercase)
    .regex(/[0-9]/, MSG.validation.passwordDigit),
  guestSessionId: z.preprocess(emptyToUndefined, z.string().uuid(MSG.validation.invalidData).optional()),
  resumeSnapshot: z.record(z.unknown()).optional(),
})

export const loginSchema = z.object({
  email: z.string().min(1, MSG.validation.requiredAlt).email(MSG.validation.email),
  password: z.string().min(1, MSG.validation.requiredAlt),
  guestSessionId: z.preprocess(emptyToUndefined, z.string().uuid(MSG.validation.invalidData).optional()),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, MSG.validation.required),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
