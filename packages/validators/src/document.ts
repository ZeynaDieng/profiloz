import { z } from 'zod'

export const documentTypeSchema = z.enum(['CV', 'DIPLOMA', 'CERTIFICATE', 'COVER_LETTER'])

export const uploadDocumentSchema = z.object({
  type: documentTypeSchema,
})

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>
