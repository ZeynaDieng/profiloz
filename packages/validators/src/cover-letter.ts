import { z } from 'zod'
import './error-map.js'

export const COVER_LETTER_TEMPLATE_IDS = [
  'CLASSIQUE',
  'MODERNE',
  'ACCENT',
  'PROFESSIONNEL',
  'CREATIF',
] as const

const templateIdSchema = z.enum(COVER_LETTER_TEMPLATE_IDS).default('CLASSIQUE')

const optionalText = (max: number) => z.string().max(max).nullish()

const accentColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide')
  .nullish()

const coverLetterFields = {
  resumeId: z.string().nullish(),
  title: z.string().trim().min(1, 'Titre requis').max(200).default('Lettre de motivation'),
  senderName: optionalText(200),
  senderEmail: optionalText(200),
  senderPhone: optionalText(50),
  senderLocation: optionalText(200),
  companyName: optionalText(200),
  companyAddress: optionalText(500),
  position: optionalText(200),
  recruiterName: optionalText(200),
  content: z.string().trim().min(1, 'Contenu requis').max(10000),
  closingText: optionalText(500),
  templateId: templateIdSchema,
  accentColor: accentColorSchema,
}

export const createCoverLetterSchema = z.object(coverLetterFields)

export const updateCoverLetterSchema = createCoverLetterSchema.partial()

export type CreateCoverLetterInput = z.infer<typeof createCoverLetterSchema>
export type UpdateCoverLetterInput = z.infer<typeof updateCoverLetterSchema>
