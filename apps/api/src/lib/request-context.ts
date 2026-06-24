import { AppError } from '@/lib/errors'
import { authService } from '@/modules/auth/auth.service'
import { guestSessionRepository } from '@/modules/guest/guest.repository'

export interface RequestContext {
  userId?: string
  guestSessionDbId?: string
  guestSessionId?: string
}

export async function getRequestContext(request: Request): Promise<RequestContext> {
  const ctx: RequestContext = {}
  const guestHeader = request.headers.get('x-guest-session-id')
  if (guestHeader) {
    const guest = await guestSessionRepository.findBySessionId(guestHeader)
    if (guest) {
      ctx.guestSessionDbId = guest.id
      ctx.guestSessionId = guest.sessionId
    }
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7)
      const payload = authService.verifyAccessToken(token)
      ctx.userId = payload.sub
    } catch {
      // Token expiré ou invalide — on ignore pour permettre le fallback session invité
    }
  }

  return ctx
}

export async function requireAuth(request: Request): Promise<string> {
  const ctx = await getRequestContext(request)
  if (!ctx.userId) throw new AppError(401, 'Unauthorized', 'Authentification requise')
  return ctx.userId
}

export async function requireGuestOrAuth(request: Request): Promise<RequestContext> {
  const ctx = await getRequestContext(request)
  if (!ctx.userId && !ctx.guestSessionDbId) {
    throw new AppError(401, 'Unauthorized', 'Session invité ou authentification requise')
  }
  return ctx
}
