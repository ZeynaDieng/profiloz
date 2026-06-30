import { AppError } from '@/lib/errors'
import { ensurePlatformOwnerRole } from '@/lib/platform-admin'
import { authService } from '@/modules/auth/auth.service'
import { guestSessionRepository } from '@/modules/guest/guest.repository'
import { prisma } from '@/lib/prisma'

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

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { suspendedAt: true },
  })
  if (user?.suspendedAt) {
    throw new AppError(403, 'Forbidden', 'Ce compte est suspendu.')
  }

  return ctx.userId
}

export async function requireGuestOrAuth(request: Request): Promise<RequestContext> {
  const ctx = await getRequestContext(request)
  if (!ctx.userId && !ctx.guestSessionDbId) {
    throw new AppError(401, 'Unauthorized', 'Session invité ou authentification requise')
  }
  return ctx
}

export async function requirePlatformAdmin(request: Request): Promise<string> {
  const userId = await requireAuth(request)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  })
  if (!user) throw new AppError(401, 'Unauthorized', 'Authentification requise')

  await ensurePlatformOwnerRole(userId, user.email)

  const refreshed = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (refreshed?.role !== 'ADMIN') {
    throw new AppError(403, 'Forbidden', 'Accès réservé à l’administration Profilo’Z.')
  }
  return userId
}
