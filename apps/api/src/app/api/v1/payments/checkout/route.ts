import { paymentService } from '@/modules/payment/payment.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireGuestOrAuth } from '@/lib/request-context'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await requireGuestOrAuth(request)
    const body = (await request.json().catch(() => ({}))) as { planSlug?: string }
    const planSlug = String(body.planSlug ?? '')
    const result = await paymentService.createCheckout(
      { userId: ctx.userId, guestSessionDbId: ctx.guestSessionDbId },
      planSlug,
    )
    return withCors(jsonResponse(result), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
