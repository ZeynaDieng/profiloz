import { z } from 'zod'

const organizationTypeSchema = z.enum([
  'COMPANY',
  'SCHOOL',
  'UNIVERSITY',
  'RH_AGENCY',
  'TRAINING_CENTER',
  'OTHER',
])

export const adminUpdateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  type: organizationTypeSchema.optional(),
  unlimitedUntil: z.string().datetime().nullable().optional(),
  subscriptionPlanSlug: z.enum(['illimite', 'business']).nullable().optional(),
})

export const adminUpdateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  creditsBalance: z.number().int().min(0).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  unlimitedUntil: z.string().datetime().nullable().optional(),
  subscriptionPlanSlug: z.enum(['dossier_unique', 'pack_10', 'illimite', 'business']).nullable().optional(),
})

export const adminUpdateTemplateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
})

export const adminUpdateEmailTemplateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  subject: z.string().trim().min(2).max(200).optional(),
  bodyHtml: z.string().trim().min(1).max(50000).optional(),
  bodyText: z.string().trim().max(50000).nullable().optional(),
  isActive: z.boolean().optional(),
})

export const adminUpdatePlatformSettingsSchema = z.object({
  branding: z.object({
    appName: z.string().trim().min(2).max(80).optional(),
    logoUrl: z.string().trim().max(500).optional(),
  }).optional(),
  seo: z.object({
    title: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().min(2).max(320).optional(),
  }).optional(),
  letterTemplates: z.array(z.object({
    slug: z.string().trim().min(1).max(80),
    isActive: z.boolean(),
  })).optional(),
})

export const adminUpdatePlanSchema = z.object({
  priceXof: z.number().int().min(0).max(9999999).optional(),
  active: z.boolean().optional(),
  description: z.string().trim().max(500).optional(),
})

export const adminSendNotificationSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(5000),
  audience: z.enum(['all', 'business', 'premium']),
})
