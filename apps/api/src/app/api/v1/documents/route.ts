import { paymentService } from '@/modules/payment/payment.service'
import { documentService } from '@/modules/document/document.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { getRequestContext, requireAuth } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const ctx = await getRequestContext(request)
    await paymentService.assertFeature({ userId, guestSessionDbId: ctx.guestSessionDbId }, 'historique')
    const documents = await documentService.listForUser(userId)
    const response = jsonResponse({
      data: documents.map((d) => ({
        id: d.id,
        type: d.type,
        status: d.status,
        originalName: d.originalName,
        sizeBytes: d.sizeBytes,
        createdAt: d.createdAt.toISOString(),
      })),
    })
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
