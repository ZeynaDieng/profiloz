import { normalizeResumeSnapshotForPdf, toPdfGenerationError } from '@/lib/pdf/normalize-resume-snapshot'
import { paymentService } from '@/modules/payment/payment.service'
import { pdfService } from '@/modules/pdf/pdf.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { assertPdfRateLimit } from '@/lib/pdf/rate-limit-pdf'
import { requireGuestOrAuth } from '@/lib/request-context'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await requireGuestOrAuth(request)
    assertPdfRateLimit(request, ctx)
    const body = await request.json()
    const snapshot = normalizeResumeSnapshotForPdf(body.snapshot)
    const resumeId = typeof body.resumeId === 'string' ? body.resumeId : undefined
    const owner = { userId: ctx.userId, guestSessionDbId: ctx.guestSessionDbId, resumeId }

    if (owner.userId && resumeId) {
      await paymentService.unlockResume(owner, resumeId)
    } else {
      await paymentService.assertSnapshotDownload(owner)
    }

    const result = await pdfService.startSnapshotPdfJob(snapshot, ctx.guestSessionDbId, {
      userId: ctx.userId,
      guestSessionDbId: ctx.guestSessionDbId,
    }, owner)

    const response = jsonResponse({
      jobId: result.jobId,
      status: result.status,
      downloadUrl:
        result.status === 'completed' ? `/pdf/download/${result.jobId}` : null,
      expiresAt: result.expiresAt.toISOString(),
    }, 202)
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(toPdfGenerationError(error))
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
