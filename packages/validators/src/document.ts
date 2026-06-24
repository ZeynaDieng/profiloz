import { z } from 'zod'

export const documentTypeSchema = z.enum(['CV', 'DIPLOMA', 'CERTIFICATE'])

export const uploadDocumentSchema = z.object({
  type: documentTypeSchema,
})

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>
