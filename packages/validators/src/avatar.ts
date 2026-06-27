import { z } from 'zod'
import { AVATAR_ALLOWED_MIME_TYPES, AVATAR_MAX_BYTES } from '@profiloz/shared'

export const avatarUploadSchema = z.object({
  mimeType: z.enum(AVATAR_ALLOWED_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(AVATAR_MAX_BYTES),
})

export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>
