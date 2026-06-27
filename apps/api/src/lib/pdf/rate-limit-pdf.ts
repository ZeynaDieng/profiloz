import { AppError } from '@/lib/errors'
import { checkRateLimit } from '@/lib/rate-limit'
import type { RequestContext } from '@/lib/request-context'

const PDF_LIMIT = Number(process.env.PDF_RATE_LIMIT ?? 30)
const PDF_WINDOW_MS = Number(process.env.PDF_RATE_WINDOW_MS ?? 60 * 60 * 1000)

function clientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim()
  return request.headers.get('x-real-ip') ?? undefined
}

export function rateLimitKey(request: Request, ctx: RequestContext): string {
  if (ctx.userId) return `user:${ctx.userId}`
  if (ctx.guestSessionId) return `guest:${ctx.guestSessionId}`
  const ip = clientIp(request)
  return ip ? `ip:${ip}` : 'anonymous'
}

export function assertPdfRateLimit(request: Request, ctx: RequestContext) {
  const result = checkRateLimit(`pdf:${rateLimitKey(request, ctx)}`, {
    limit: PDF_LIMIT,
    windowMs: PDF_WINDOW_MS,
  })

  if (!result.allowed) {
    throw new AppError(
      429,
      'Too Many Requests',
      `Limite de génération PDF atteinte (${PDF_LIMIT}/h). Réessayez plus tard.`,
    )
  }

  return result
}
