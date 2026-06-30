import { z } from 'zod'

const organizationTypeSchema = z.enum([
  'COMPANY',
  'SCHOOL',
  'UNIVERSITY',
  'RH_AGENCY',
  'TRAINING_CENTER',
  'OTHER',
])

const orgRoleSchema = z.enum(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'])

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  type: organizationTypeSchema.optional(),
})

export const inviteOrganizationMemberSchema = z.object({
  email: z.string().trim().email(),
  role: orgRoleSchema.default('MEMBER'),
})

export const updateOrganizationMemberSchema = z.object({
  role: orgRoleSchema,
})
