import { prisma } from '@/lib/prisma'
import type { NotificationAudience } from '@prisma/client'

export async function resolveNotificationRecipients(audience: NotificationAudience) {
  const now = new Date()

  if (audience === 'ALL') {
    return prisma.user.findMany({
      where: { suspendedAt: null, role: 'USER' },
      select: { id: true },
    })
  }

  if (audience === 'BUSINESS') {
    const members = await prisma.organizationMember.findMany({
      where: {
        organization: {
          subscriptionPlanSlug: 'business',
          unlimitedUntil: { gt: now },
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    })
    return members.map((m) => ({ id: m.userId }))
  }

  return prisma.user.findMany({
    where: {
      suspendedAt: null,
      OR: [
        { unlimitedUntil: { gt: now } },
        { subscriptionPlanSlug: { in: ['illimite', 'business'] } },
      ],
    },
    select: { id: true },
  })
}

export async function deliverUserNotifications(userIds: string[], title: string, body: string) {
  if (userIds.length === 0) return 0

  const chunkSize = 500
  let created = 0

  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize)
    const result = await prisma.userNotification.createMany({
      data: chunk.map((userId) => ({ userId, title, body })),
    })
    created += result.count
  }

  return created
}

export async function listUserNotifications(userId: string, limit = 30) {
  const rows = await prisma.userNotification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }))
}

export async function countUnreadNotifications(userId: string) {
  return prisma.userNotification.count({ where: { userId, readAt: null } })
}

export async function markNotificationRead(userId: string, id: string) {
  const existing = await prisma.userNotification.findFirst({ where: { id, userId } })
  if (!existing) throw new Error('NOTIFICATION_NOT_FOUND')
  return prisma.userNotification.update({
    where: { id },
    data: { readAt: new Date() },
  })
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.userNotification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
}
