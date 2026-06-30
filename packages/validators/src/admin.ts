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
