import { z } from 'zod'
import './error-map.js'

export const createCoverLetterSchema = z.object({
  resumeId: z.string().optional(),
  title: z.string().trim().min(1, 'Titre requis').max(200).default('Lettre de motivation'),
  companyName: z.string().max(200).optional(),
  position: z.string().max(200).optional(),
  recruiterName: z.string().max(200).optional(),
  content: z.string().trim().min(1, 'Contenu requis').max(10000),
  templateId: z.string().max(50).default('classic'),
})

export const updateCoverLetterSchema = createCoverLetterSchema.partial()

export type CreateCoverLetterInput = z.infer<typeof createCoverLetterSchema>
export type UpdateCoverLetterInput = z.infer<typeof updateCoverLetterSchema>
