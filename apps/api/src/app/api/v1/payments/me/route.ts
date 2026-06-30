import { paymentService } from '@/modules/payment/payment.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireGuestOrAuth } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await requireGuestOrAuth(request)
    const result = await paymentService.getEntitlements({
      userId: ctx.userId,
      guestSessionDbId: ctx.guestSessionDbId,
    })
    return withCors(
      jsonResponse({
        creditsBalance: result.creditsBalance,
        unlimitedUntil: result.unlimitedUntil ? result.unlimitedUntil.toISOString() : null,
        unlimitedActive: result.unlimitedActive,
        activePlanSlug: result.activePlanSlug,
        features: result.features,
      }),
      origin,
    )
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
