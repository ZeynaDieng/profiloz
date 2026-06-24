import './error-map.js'
import { z } from 'zod'

function emptyToUndefined(val: unknown) {
  if (val === '' || val === null || val === undefined) return undefined
  return val
}

export const registerSchema = z.object({
  email: z.string().min(1, 'E-mail requis').email('Format e-mail invalide'),
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre'),
  guestSessionId: z.preprocess(emptyToUndefined, z.string().uuid('Identifiant invité invalide').optional()),
  resumeSnapshot: z.record(z.unknown()).optional(),
})

export const loginSchema = z.object({
  email: z.string().min(1, 'E-mail requis').email('Format e-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Jeton requis'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
