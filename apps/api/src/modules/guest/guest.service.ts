import { guestSessionRepository } from './guest.repository'

export class GuestSessionService {
  async initOrValidate(sessionId: string) {
    const session = await guestSessionRepository.upsert(sessionId)
    return {
      sessionId: session.sessionId,
      expiresAt: session.expiresAt.toISOString(),
    }
  }
}

export const guestSessionService = new GuestSessionService()
