import type { OrganizationType } from '@profiloz/shared'
import { adminUpdateOrganizationSchema } from '@profiloz/validators'
import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { organizationRepository } from '@/modules/organization/organization.repository'

function formatMemberName(user: {
  firstName: string | null
  lastName: string | null
  email: string
}) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return full || user.email
}

function isSubscriptionActive(unlimitedUntil: Date | null | undefined) {
  return Boolean(unlimitedUntil && unlimitedUntil.getTime() > Date.now())
}

function toAdminOrganizationDto(
  org: NonNullable<Awaited<ReturnType<typeof organizationRepository.findOrganizationById>>>,
  counts: { resumes: number; documents: number; letters: number },
) {
  return {
    id: org.id,
    name: org.name,
    type: org.type,
    unlimitedUntil: org.unlimitedUntil?.toISOString() ?? null,
    subscriptionPlanSlug: org.subscriptionPlanSlug,
    subscriptionActive: isSubscriptionActive(org.unlimitedUntil),
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
    memberCount: org.members.length,
    resumeCount: counts.resumes,
    documentCount: counts.documents,
    letterCount: counts.letters,
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

export class AdminService {
  async getStats() {
    const [organizations, users, paidPayments, activeSubscriptions] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.payment.count({ where: { status: 'PAID' } }),
      prisma.organization.count({
        where: { unlimitedUntil: { gt: new Date() }, subscriptionPlanSlug: 'business' },
      }),
    ])

    return {
      organizations,
      users,
      paidPayments,
      activeBusinessOrganizations: activeSubscriptions,
    }
  }

  async listOrganizations() {
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          select: { id: true, role: true },
        },
        _count: {
          select: {
            resumes: true,
            documents: true,
            coverLetters: true,
          },
        },
      },
    })

    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      type: org.type,
      unlimitedUntil: org.unlimitedUntil?.toISOString() ?? null,
      subscriptionPlanSlug: org.subscriptionPlanSlug,
      subscriptionActive: isSubscriptionActive(org.unlimitedUntil),
      createdAt: org.createdAt.toISOString(),
      memberCount: org.members.length,
      resumeCount: org._count.resumes,
      documentCount: org._count.documents,
      letterCount: org._count.coverLetters,
    }))
  }

  async getOrganization(id: string) {
    const org = await organizationRepository.findOrganizationById(id)
    if (!org) throw new AppError(404, 'Not Found', 'Organisation introuvable')

    const [resumes, documents, letters] = await Promise.all([
      prisma.resume.count({ where: { organizationId: id } }),
      prisma.document.count({ where: { organizationId: id } }),
      prisma.coverLetter.count({ where: { organizationId: id } }),
    ])

    return toAdminOrganizationDto(org, {
      resumes,
      documents,
      letters,
    })
  }

  async updateOrganization(id: string, body: unknown) {
    const input = adminUpdateOrganizationSchema.parse(body)
    const existing = await organizationRepository.findOrganizationById(id)
    if (!existing) throw new AppError(404, 'Not Found', 'Organisation introuvable')

    const data: {
      name?: string
      type?: OrganizationType
      unlimitedUntil?: Date | null
      subscriptionPlanSlug?: string | null
    } = {}

    if (input.name !== undefined) data.name = input.name
    if (input.type !== undefined) data.type = input.type
    if (input.unlimitedUntil !== undefined) {
      data.unlimitedUntil = input.unlimitedUntil ? new Date(input.unlimitedUntil) : null
    }
    if (input.subscriptionPlanSlug !== undefined) {
      data.subscriptionPlanSlug = input.subscriptionPlanSlug
    }

    await prisma.organization.update({ where: { id }, data })
    return this.getOrganization(id)
  }

  async removeMember(organizationId: string, userId: string) {
    const org = await organizationRepository.findOrganizationById(organizationId)
    if (!org) throw new AppError(404, 'Not Found', 'Organisation introuvable')

    const member = await organizationRepository.findMember(organizationId, userId)
    if (!member) throw new AppError(404, 'Not Found', 'Membre introuvable')
    if (member.role === 'OWNER') {
      throw new AppError(400, 'Bad Request', 'Impossible de retirer le propriétaire de l’organisation.')
    }

    await organizationRepository.removeMember(organizationId, userId)
    return this.getOrganization(organizationId)
  }
}

export const adminService = new AdminService()
