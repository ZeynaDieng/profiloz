import { GUEST_SESSION_TTL_DAYS } from '@profiloz/shared'
import { prisma } from '@/lib/prisma'

export class GuestSessionRepository {
  async findBySessionId(sessionId: string) {
    return prisma.guestSession.findUnique({ where: { sessionId } })
  }

  async create(sessionId: string) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + GUEST_SESSION_TTL_DAYS)

    return prisma.guestSession.create({
      data: { sessionId, expiresAt },
    })
  }

  async upsert(sessionId: string) {
    const existing = await this.findBySessionId(sessionId)
    if (existing) {
      if (existing.expiresAt < new Date()) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + GUEST_SESSION_TTL_DAYS)
        return prisma.guestSession.update({
          where: { id: existing.id },
          data: { expiresAt },
        })
      }
      return existing
    }
    return this.create(sessionId)
  }
}

export const guestSessionRepository = new GuestSessionRepository()
