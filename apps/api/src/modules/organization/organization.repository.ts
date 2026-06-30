import type { OrgRole, OrganizationType } from '@profiloz/shared'
import { prisma } from '@/lib/prisma'

const organizationWithMembersInclude = {
  members: {
    orderBy: { joinedAt: 'asc' as const },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
} as const

export class OrganizationRepository {
  findMembershipByUserId(userId: string) {
    return prisma.organizationMember.findFirst({
      where: { userId },
      include: {
        organization: {
          include: organizationWithMembersInclude,
        },
      },
    })
  }

  findMember(organizationId: string, userId: string) {
    return prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    })
  }

  findOrganizationById(id: string) {
    return prisma.organization.findUnique({
      where: { id },
      include: organizationWithMembersInclude,
    })
  }

  createOrganization(input: {
    name: string
    type: OrganizationType
    ownerUserId: string
    unlimitedUntil?: Date
    subscriptionPlanSlug?: string
  }) {
    return prisma.organization.create({
      data: {
        name: input.name,
        type: input.type,
        unlimitedUntil: input.unlimitedUntil,
        subscriptionPlanSlug: input.subscriptionPlanSlug,
        members: {
          create: {
            userId: input.ownerUserId,
            role: 'OWNER',
          },
        },
      },
      include: organizationWithMembersInclude,
    })
  }

  updateOrganization(id: string, data: { name?: string; type?: OrganizationType }) {
    return prisma.organization.update({
      where: { id },
      data,
      include: organizationWithMembersInclude,
    })
  }

  extendBusinessSubscription(id: string, unlimitedUntil: Date) {
    return prisma.organization.update({
      where: { id },
      data: {
        unlimitedUntil,
        subscriptionPlanSlug: 'business',
      },
    })
  }

  addMember(organizationId: string, userId: string, role: OrgRole) {
    return prisma.organizationMember.create({
      data: { organizationId, userId, role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }

  updateMemberRole(organizationId: string, userId: string, role: OrgRole) {
    return prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId, userId } },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }

  removeMember(organizationId: string, userId: string) {
    return prisma.organizationMember.delete({
      where: { organizationId_userId: { organizationId, userId } },
    })
  }

  countOwners(organizationId: string) {
    return prisma.organizationMember.count({
      where: { organizationId, role: 'OWNER' },
    })
  }
}

export const organizationRepository = new OrganizationRepository()
