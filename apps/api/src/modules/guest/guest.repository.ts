import { Prisma } from '@prisma/client'
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
    const expiresAt = buildGuestSessionExpiry()

    try {
      return await prisma.guestSession.upsert({
        where: { sessionId },
        create: { sessionId, expiresAt },
        update: { expiresAt },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.findBySessionId(sessionId)
        if (existing) return existing
      }
      throw error
    }
  }
}

export const guestSessionRepository = new GuestSessionRepository()
