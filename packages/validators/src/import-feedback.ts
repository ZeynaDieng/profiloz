import { z } from 'zod'

const looseRecord = z.record(z.unknown())

export const importFeedbackSchema = z.object({
  documentId: z.string().optional(),
  fileName: z.string().max(512).optional(),
  mimeType: z.string().max(128).optional(),
  templateSlug: z.string().max(64).optional(),
  overallConfidence: z.number().min(0).max(1).optional(),
  originalParsed: looseRecord,
  correctedData: looseRecord,
})

export type ImportFeedbackInput = z.infer<typeof importFeedbackSchema>
