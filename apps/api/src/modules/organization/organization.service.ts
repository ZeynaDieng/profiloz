import {
  canEditOrganization,
  canManageMembers,
  type OrgRole,
  type OrganizationType,
} from '@profiloz/shared'
import {
  inviteOrganizationMemberSchema,
  updateOrganizationMemberSchema,
  updateOrganizationSchema,
} from '@profiloz/validators'
import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { organizationRepository } from './organization.repository'

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isUnlimitedActive(unlimitedUntil: Date | null | undefined): boolean {
  return Boolean(unlimitedUntil && unlimitedUntil.getTime() > Date.now())
}

function formatMemberName(user: {
  firstName: string | null
  lastName: string | null
  email: string
}) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return full || user.email
}

function toOrganizationDto(org: NonNullable<Awaited<ReturnType<typeof organizationRepository.findOrganizationById>>>) {
  return {
    id: org.id,
    name: org.name,
    type: org.type,
    unlimitedUntil: org.unlimitedUntil?.toISOString() ?? null,
    subscriptionPlanSlug: org.subscriptionPlanSlug,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
    members: org.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      name: formatMemberName(member.user),
      email: member.user.email,
    })),
  }
}

export class OrganizationService {
  async getMembershipContext(userId: string) {
    return organizationRepository.findMembershipByUserId(userId)
  }

  async getActiveOrganizationId(userId: string): Promise<string | null> {
    const membership = await organizationRepository.findMembershipByUserId(userId)
    if (!membership) return null
    if (!isUnlimitedActive(membership.organization.unlimitedUntil)) return null
    if (membership.organization.subscriptionPlanSlug !== 'business') return null
    return membership.organizationId
  }

  async getMyOrganization(userId: string) {
    const membership = await organizationRepository.findMembershipByUserId(userId)
    if (!membership) {
      throw new AppError(
        404,
        'Not Found',
        "Aucune organisation active. L'offre Business est requise.",
      )
    }
    if (!isUnlimitedActive(membership.organization.unlimitedUntil)) {
      throw new AppError(402, 'Payment Required', "L'abonnement Business de votre organisation a expiré.")
    }
    return {
      organization: toOrganizationDto(membership.organization),
      myRole: membership.role,
    }
  }

  async updateOrganization(userId: string, body: unknown) {
    const membership = await this.requireMembership(userId)
    if (!canEditOrganization(membership.role)) {
      throw new AppError(403, 'Forbidden', 'Seuls le propriétaire et les administrateurs peuvent modifier l’organisation.')
    }

    const input = updateOrganizationSchema.parse(body)
    const updated = await organizationRepository.updateOrganization(membership.organizationId, input)
    return toOrganizationDto(updated)
  }

  async inviteMember(actorUserId: string, body: unknown) {
    const membership = await this.requireMembership(actorUserId)
    if (!canManageMembers(membership.role)) {
      throw new AppError(403, 'Forbidden', 'Vous ne pouvez pas gérer les membres de cette organisation.')
    }

    const input = inviteOrganizationMemberSchema.parse(body)
    if (input.role === 'OWNER' && membership.role !== 'OWNER') {
      throw new AppError(403, 'Forbidden', 'Seul le propriétaire peut nommer un autre propriétaire.')
    }

    const invitedUser = await prisma.user.findFirst({
      where: { email: { equals: input.email, mode: 'insensitive' } },
    })
    if (!invitedUser) {
      throw new AppError(
        404,
        'Not Found',
        'Aucun compte Profilo’Z trouvé avec cet e-mail. Invitez la personne à créer un compte, puis réessayez.',
      )
    }

    const existing = await organizationRepository.findMember(membership.organizationId, invitedUser.id)
    if (existing) {
      throw new AppError(409, 'Conflict', 'Cette personne fait déjà partie de votre organisation.')
    }

    const member = await organizationRepository.addMember(
      membership.organizationId,
      invitedUser.id,
      input.role as OrgRole,
    )

    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      name: formatMemberName(member.user),
      email: member.user.email,
    }
  }

  async updateMemberRole(actorUserId: string, targetUserId: string, body: unknown) {
    const membership = await this.requireMembership(actorUserId)
    if (!canManageMembers(membership.role)) {
      throw new AppError(403, 'Forbidden', 'Vous ne pouvez pas gérer les membres de cette organisation.')
    }

    const input = updateOrganizationMemberSchema.parse(body)
    if (input.role === 'OWNER' && membership.role !== 'OWNER') {
      throw new AppError(403, 'Forbidden', 'Seul le propriétaire peut promouvoir un propriétaire.')
    }

    const target = await organizationRepository.findMember(membership.organizationId, targetUserId)
    if (!target) throw new AppError(404, 'Not Found', 'Membre introuvable.')
    if (target.role === 'OWNER' && membership.role !== 'OWNER') {
      throw new AppError(403, 'Forbidden', 'Vous ne pouvez pas modifier le propriétaire.')
    }
    if (target.role === 'OWNER' && input.role !== 'OWNER') {
      const owners = await organizationRepository.countOwners(membership.organizationId)
      if (owners <= 1) {
        throw new AppError(400, 'Bad Request', 'L’organisation doit conserver au moins un propriétaire.')
      }
    }

    const updated = await organizationRepository.updateMemberRole(
      membership.organizationId,
      targetUserId,
      input.role as OrgRole,
    )

    return {
      id: updated.id,
      userId: updated.userId,
      role: updated.role,
      joinedAt: updated.joinedAt.toISOString(),
      name: formatMemberName(updated.user),
      email: updated.user.email,
    }
  }

  async removeMember(actorUserId: string, targetUserId: string) {
    const membership = await this.requireMembership(actorUserId)
    if (!canManageMembers(membership.role)) {
      throw new AppError(403, 'Forbidden', 'Vous ne pouvez pas gérer les membres de cette organisation.')
    }

    const target = await organizationRepository.findMember(membership.organizationId, targetUserId)
    if (!target) throw new AppError(404, 'Not Found', 'Membre introuvable.')
    if (target.role === 'OWNER') {
      throw new AppError(403, 'Forbidden', 'Le propriétaire ne peut pas être retiré.')
    }
    if (targetUserId === actorUserId) {
      throw new AppError(400, 'Bad Request', 'Utilisez un administrateur pour vous retirer de l’organisation.')
    }

    await organizationRepository.removeMember(membership.organizationId, targetUserId)
  }

  async ensureBusinessOrganization(userId: string, durationDays: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true, unlimitedUntil: true },
    })
    if (!user) return null

    const membership = await organizationRepository.findMembershipByUserId(userId)
    const start = isUnlimitedActive(user.unlimitedUntil) ? user.unlimitedUntil! : new Date()
    const unlimitedUntil = addDays(start, durationDays)

    if (membership) {
      await organizationRepository.extendBusinessSubscription(membership.organizationId, unlimitedUntil)
      return membership.organizationId
    }

    const label = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    const fallback = user.email.split('@')[0] ?? 'Mon'
    const org = await organizationRepository.createOrganization({
      name: `${label || fallback} — Organisation`,
      type: 'OTHER',
      ownerUserId: userId,
      unlimitedUntil,
      subscriptionPlanSlug: 'business',
    })

    await prisma.resume.updateMany({
      where: { userId, organizationId: null },
      data: { organizationId: org.id },
    })
    await prisma.document.updateMany({
      where: { userId, organizationId: null },
      data: { organizationId: org.id },
    })
    await prisma.coverLetter.updateMany({
      where: { userId, organizationId: null },
      data: { organizationId: org.id },
    })

    return org.id
  }

  async assertResumeAccess(userId: string, resumeId: string) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, status: { not: 'ARCHIVED' } },
      select: { id: true, userId: true, organizationId: true },
    })
    if (!resume) throw new AppError(404, 'Not Found', 'Dossier introuvable')
    if (resume.userId === userId) return resume

    if (resume.organizationId) {
      const member = await organizationRepository.findMember(resume.organizationId, userId)
      if (member) return resume
    }

    throw new AppError(403, 'Forbidden', 'Vous n’avez pas accès à ce dossier.')
  }

  private async requireMembership(userId: string) {
    const membership = await organizationRepository.findMembershipByUserId(userId)
    if (!membership) {
      throw new AppError(404, 'Not Found', 'Organisation introuvable.')
    }
    if (!isUnlimitedActive(membership.organization.unlimitedUntil)) {
      throw new AppError(402, 'Payment Required', "L'abonnement Business de votre organisation a expiré.")
    }
    return membership
  }
}

export const organizationService = new OrganizationService()
