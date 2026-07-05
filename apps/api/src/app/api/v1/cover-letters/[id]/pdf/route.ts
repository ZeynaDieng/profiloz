import { coverLetterService } from '@/modules/cover-letter/cover-letter.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { assertPdfRateLimit } from '@/lib/pdf/rate-limit-pdf'
import { getRequestContext, requireAuth } from '@/lib/request-context'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    await requireAuth(request)
    const ctx = await getRequestContext(request)
    assertPdfRateLimit(request, ctx)
    const { id } = await params
    const result = await coverLetterService.generatePdf(id, {
      userId: ctx.userId,
      guestSessionDbId: ctx.guestSessionDbId,
    })
    const response = jsonResponse(result)
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
