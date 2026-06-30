import { z } from 'zod'

export const adminFaqItemSchema = z.object({
  question: z.string().trim().min(3).max(500),
  answer: z.string().trim().min(3).max(10000),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  locale: z.string().trim().min(2).max(10).optional(),
  isActive: z.boolean().optional(),
})

export const adminFaqReorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().trim().min(1),
    sortOrder: z.number().int().min(0),
  })).min(1),
})

export const adminLandingSectionSchema = z.object({
  content: z.record(z.unknown()),
  isActive: z.boolean().optional(),
})

export const adminBlogPostSchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(2).max(200),
  excerpt: z.string().trim().max(500).nullable().optional(),
  content: z.string().trim().min(1).max(100000),
  coverMediaId: z.string().trim().nullable().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  seoTitle: z.string().trim().max(160).nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
})

export const adminUpdateBlogPostSchema = adminBlogPostSchema.partial().omit({ slug: true })

export const adminCreateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(['COMPANY', 'SCHOOL', 'UNIVERSITY', 'RH_AGENCY', 'TRAINING_CENTER', 'OTHER']),
  ownerUserId: z.string().trim().min(1),
  unlimitedUntil: z.string().datetime().nullable().optional(),
  subscriptionPlanSlug: z.enum(['illimite', 'business']).nullable().optional(),
})

export const adminUpdateResumeSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
})

export const adminUpdateCoverLetterSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().min(1).max(50000).optional(),
})

export const adminUpdatePaymentSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELED']).optional(),
  note: z.string().trim().max(500).optional(),
})

export const adminMediaUpdateSchema = z.object({
  alt: z.string().trim().max(300).nullable().optional(),
  folderId: z.string().trim().nullable().optional(),
})
