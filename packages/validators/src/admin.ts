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
