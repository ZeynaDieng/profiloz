import { AppError } from '@/lib/errors'
import { checkRateLimit } from '@/lib/rate-limit'
import type { RequestContext } from '@/lib/request-context'

const AI_LIMIT_GUEST = Number(process.env.AI_RATE_LIMIT_GUEST ?? 20)
const AI_LIMIT_USER = Number(process.env.AI_RATE_LIMIT_USER ?? 50)
const AI_WINDOW_MS = Number(process.env.AI_RATE_WINDOW_MS ?? 60 * 60 * 1000)

function clientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim()
  return request.headers.get('x-real-ip') ?? undefined
}

export function rateLimitAiKey(request: Request, ctx: RequestContext): string {
  if (ctx.userId) return `user:${ctx.userId}`
  if (ctx.guestSessionId) return `guest:${ctx.guestSessionId}`
  const ip = clientIp(request)
  return ip ? `ip:${ip}` : 'anonymous'
}

export function assertAiRateLimit(request: Request, ctx: RequestContext) {
  const limit = ctx.userId ? AI_LIMIT_USER : AI_LIMIT_GUEST
  const result = checkRateLimit(`ai:${rateLimitAiKey(request, ctx)}`, {
    limit,
    windowMs: AI_WINDOW_MS,
  })

  if (!result.allowed) {
    throw new AppError(
      429,
      'Too Many Requests',
      `Limite de génération IA atteinte (${limit} requêtes/heure). Veuillez patienter quelques minutes.`,
    )
  }

  return result
}
