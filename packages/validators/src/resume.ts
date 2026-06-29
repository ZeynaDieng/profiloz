import { z } from 'zod'
import { MSG, TEMPLATE_SLUGS } from '@profiloz/shared'
import './error-map.js'

const templateSlugSchema = z.enum(TEMPLATE_SLUGS)
const requiredString = (max: number) =>
  z.string().trim().min(1, MSG.validation.requiredAlt).max(max, MSG.validation.maxChars(max))

function emptyToUndefined(val: unknown) {
  if (val === '' || val === null || val === undefined) return undefined
  return val
}

function normalizeUrl(val: unknown) {
  const cleaned = emptyToUndefined(val)
  if (typeof cleaned !== 'string') return cleaned
  const trimmed = cleaned.trim()
  if (!trimmed) return undefined
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

const optionalEmailSchema = z.preprocess(emptyToUndefined, z.string().email().optional())
const optionalUrlSchema = z.preprocess(normalizeUrl, z.string().url().optional())

export const personalInfoSchema = z.object({
  fullName: z.preprocess(emptyToUndefined, z.string().trim().min(1, MSG.validation.name).max(200).optional()),
  email: optionalEmailSchema,
  phone: z.preprocess(emptyToUndefined, z.string().max(50).optional()),
  location: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  jobTitle: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  linkedinUrl: optionalUrlSchema,
  websiteUrl: optionalUrlSchema,
  photoUrl: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(512)
      .refine((val) => !val.startsWith('data:'), {
        message: MSG.photo.base64Rejected,
      })
      .optional(),
  ),
})

export const experienceSchema = z.object({
  company: requiredString(200),
  position: requiredString(200),
  location: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(5000).optional(),
  skillsUsed: z.array(z.string().max(100)).max(30).optional(),
  sortOrder: z.number().int().default(0),
})

export const educationSchema = z.object({
  institution: requiredString(200),
  degree: requiredString(200),
  field: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().default(0),
})

export const skillSchema = z.object({
  name: requiredString(100),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  category: z.string().max(100).optional(),
  sortOrder: z.number().int().default(0),
})

export const createResumeSchema = z.object({
  title: z.string().trim().min(1, 'Titre requis').max(200).default('Mon CV'),
  templateSlug: templateSlugSchema.default('PROFESSIONNEL'),
  personalInfo: personalInfoSchema.optional(),
})

export const updateResumeSchema = z.object({
  title: z.string().trim().min(1, 'Titre requis').max(200).optional(),
  templateSlug: templateSlugSchema.optional(),
  templateConfig: z
    .object({
      accentColor: z.string().optional(),
      margins: z.number().optional(),
      lineHeight: z.number().optional(),
      typography: z.string().optional(),
    })
    .optional(),
  personalInfo: personalInfoSchema.optional(),
  summary: z.string().max(5000).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
})

export const renameResumeSchema = z.object({
  title: z.string().trim().min(1, 'Titre requis').max(200),
})

export const migrateResumeSchema = z.object({
  guestSessionId: z.string().uuid(),
  resumeSnapshot: z.record(z.unknown()),
})

export const mergeImportSchema = z.object({
  ocrResultId: z.string().min(1, 'Document requis'),
  mergeStrategy: z.enum(['replace', 'append', 'merge']).default('merge'),
})

const snapshotDateSchema = z.string().max(50).optional()

export const saveResumeSnapshotSchema = z.object({
  title: z.string().trim().min(1, 'Titre requis').max(200),
  templateSlug: templateSlugSchema,
  templateConfig: z
    .object({
      accentColor: z.string().optional(),
      margins: z.number().optional(),
      lineHeight: z.number().optional(),
      typography: z.string().optional(),
    })
    .default({}),
  personalInfo: personalInfoSchema.default({}),
  summary: z.string().max(5000).optional(),
  experiences: z
    .array(
      z.object({
        company: requiredString(200),
        position: requiredString(200),
        location: z.string().max(200).optional(),
        country: z.string().max(100).optional(),
        startDate: snapshotDateSchema,
        endDate: snapshotDateSchema,
        isCurrent: z.boolean().optional(),
        description: z.string().max(5000).optional(),
        skillsUsed: z.array(z.string().max(100)).max(30).optional(),
      }),
    )
    .default([]),
  educations: z
    .array(
      z.object({
        institution: requiredString(200),
        degree: requiredString(200),
        field: z.string().max(200).optional(),
        location: z.string().max(200).optional(),
        startDate: snapshotDateSchema,
        endDate: snapshotDateSchema,
        description: z.string().max(2000).optional(),
      }),
    )
    .default([]),
  skills: z
    .array(
      z.object({
        name: requiredString(100),
        level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
        category: z.string().max(100).optional(),
      }),
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: requiredString(200),
        issuer: z.string().max(200).optional(),
        issueDate: snapshotDateSchema,
        expiryDate: snapshotDateSchema,
        credentialId: z.string().max(200).optional(),
      }),
    )
    .default([]),
  interests: z.array(z.object({ name: requiredString(100) })).default([]),
  languages: z
    .array(
      z.object({
        name: requiredString(100),
        level: z.enum(['BASIC', 'CONVERSATIONAL', 'PROFESSIONAL', 'NATIVE']).optional(),
      }),
    )
    .default([]),
})

export type CreateResumeInput = z.infer<typeof createResumeSchema>
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>
export type SaveResumeSnapshotInput = z.infer<typeof saveResumeSnapshotSchema>
