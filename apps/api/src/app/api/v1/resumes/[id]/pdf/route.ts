import type { ResumeSnapshot } from '@profiloz/shared'
import { sanitizePhotoReference } from '@profiloz/shared'
import { paymentService } from '@/modules/payment/payment.service'
import { pdfService } from '@/modules/pdf/pdf.service'
import { resumeService } from '@/modules/resume/resume.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { assertPdfRateLimit } from '@/lib/pdf/rate-limit-pdf'
import { getRequestContext, requireAuth } from '@/lib/request-context'

type Params = { params: Promise<{ id: string }> }

function sanitizeSnapshot(snapshot: ResumeSnapshot): ResumeSnapshot {
  return {
    ...snapshot,
    personalInfo: {
      ...snapshot.personalInfo,
      photoUrl: sanitizePhotoReference(snapshot.personalInfo.photoUrl),
    },
  }
}

/**
 * Télécharge le CV seul d'un dossier enregistré.
 * Soumis au même paywall que le dossier complet : débloquer le dossier
 * (1 crédit) autorise ensuite CV seul ET dossier complet sans reconsommer.
 */
export async function POST(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const ctx = await getRequestContext(request)
    assertPdfRateLimit(request, ctx)
    const { id } = await params

    await paymentService.unlockResume(
      { userId: ctx.userId, guestSessionDbId: ctx.guestSessionDbId },
      id,
    )

    const snapshot = sanitizeSnapshot(await resumeService.get(id, userId))
    const result = await pdfService.generateFromSnapshot(snapshot, undefined, { userId })

    const response = jsonResponse(
      {
        jobId: result.jobId,
        status: 'completed',
        downloadUrl: `/pdf/download/${result.jobId}`,
        expiresAt: result.expiresAt.toISOString(),
      },
      202,
    )
    return withCors(response, origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
