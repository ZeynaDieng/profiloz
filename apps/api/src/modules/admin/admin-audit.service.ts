import { prisma } from '@/lib/prisma'

export async function logAdminAction(input: {
  actorId: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, unknown>
}) {
  return prisma.adminAuditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: (input.metadata ?? undefined) as never,
    },
  })
}

export async function listAdminAuditLogs(limit = 30) {
  return prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      actor: { select: { email: true, firstName: true, lastName: true } },
    },
  })
}
