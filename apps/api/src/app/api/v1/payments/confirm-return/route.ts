import { paymentService } from '@/modules/payment/payment.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireGuestOrAuth } from '@/lib/request-context'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await requireGuestOrAuth(request)
    const body = (await request.json().catch(() => ({}))) as { ref?: string }
    const ref = String(body.ref ?? '').trim()
    if (!ref) throw new Error('Référence requise')

    const result = await paymentService.confirmReturn(
      { userId: ctx.userId, guestSessionDbId: ctx.guestSessionDbId },
      ref,
    )
    return withCors(jsonResponse(result), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
