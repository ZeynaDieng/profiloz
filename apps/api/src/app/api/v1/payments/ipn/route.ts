import { paymentService } from '@/modules/payment/payment.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

/**
 * Notification de paiement PayTech (IPN).
 * PayTech poste en `application/x-www-form-urlencoded` (parfois JSON).
 * Aucune auth applicative : l'authenticité est vérifiée via les hashes sha256
 * des clés API présents dans le payload.
 */
async function parsePayload(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await request.json().catch(() => ({}))) as Record<string, unknown>
  }
  const form = await request.formData()
  const obj: Record<string, unknown> = {}
  for (const [key, value] of form.entries()) obj[key] = value
  return obj
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const payload = await parsePayload(request)
    const result = await paymentService.handleIpn(payload)
    return withCors(jsonResponse(result), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
