import { paymentService } from '@/modules/payment/payment.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireGuestOrAuth } from '@/lib/request-context'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await requireGuestOrAuth(request)
    await paymentService.resetDossierCycle({
      userId: ctx.userId,
      guestSessionDbId: ctx.guestSessionDbId,
    })
    const entitlements = await paymentService.getEntitlements({
      userId: ctx.userId,
      guestSessionDbId: ctx.guestSessionDbId,
    })
    return withCors(
      jsonResponse({
        creditsBalance: entitlements.creditsBalance,
        unlimitedUntil: entitlements.unlimitedUntil ? entitlements.unlimitedUntil.toISOString() : null,
        unlimitedActive: entitlements.unlimitedActive,
        activePlanSlug: entitlements.activePlanSlug,
        features: entitlements.features,
        canDownloadSnapshot: entitlements.canDownloadSnapshot,
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
