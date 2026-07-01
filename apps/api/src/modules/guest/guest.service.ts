import { Prisma } from '@prisma/client'
import { AppError } from '@/lib/errors'
import { guestSessionRepository } from './guest.repository'

export class GuestSessionService {
  async initOrValidate(sessionId: string) {
    const trimmed = sessionId?.trim()
    if (!trimmed || trimmed.length > 128) {
      throw new AppError(400, 'Bad Request', 'Identifiant de session invité invalide')
    }

    try {
      const session = await guestSessionRepository.upsert(trimmed)
      return {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt.toISOString(),
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2021' || error.code === 'P2022') {
          throw new AppError(
            503,
            'Service Unavailable',
            'Base de données non à jour. Contactez le support ou relancez les migrations.',
          )
        }
        if (error.code === 'P1001' || error.code === 'P1002') {
          throw new AppError(503, 'Service Unavailable', 'Impossible de joindre la base de données.')
        }
        if (error.code === 'P2002') {
          const existing = await guestSessionRepository.findBySessionId(trimmed)
          if (existing) {
            return {
              sessionId: existing.sessionId,
              expiresAt: existing.expiresAt.toISOString(),
            }
          }
        }
      }
      throw error
    }
  }
}

export const guestSessionService = new GuestSessionService()
