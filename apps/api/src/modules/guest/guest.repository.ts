import { GUEST_SESSION_TTL_DAYS } from '@profiloz/shared'
import { prisma } from '@/lib/prisma'

function buildGuestSessionExpiry(): Date {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + GUEST_SESSION_TTL_DAYS)
  return expiresAt
}

export class GuestSessionRepository {
  async findBySessionId(sessionId: string) {
    return prisma.guestSession.findUnique({ where: { sessionId } })
  }

  async create(sessionId: string) {
    return prisma.guestSession.create({
      data: { sessionId, expiresAt: buildGuestSessionExpiry() },
    })
  }

  /** Crée ou prolonge une session invité (atomique — évite les 500 sur requêtes parallèles). */
  async upsert(sessionId: string) {
    const existing = await this.findBySessionId(sessionId)
    if (existing && existing.expiresAt >= new Date()) {
      return existing
    }

    const expiresAt = buildGuestSessionExpiry()

    return prisma.guestSession.upsert({
      where: { sessionId },
      create: { sessionId, expiresAt },
      update: { expiresAt },
    })
  }
}

export const guestSessionRepository = new GuestSessionRepository()
