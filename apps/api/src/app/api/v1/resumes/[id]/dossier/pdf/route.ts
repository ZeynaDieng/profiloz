import type { ResumeSnapshot } from '@profiloz/shared'
import { sanitizePhotoReference } from '@profiloz/shared'
import { coverLetterService } from '@/modules/cover-letter/cover-letter.service'
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

export async function POST(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const ctx = await getRequestContext(request)
    assertPdfRateLimit(request, ctx)
    const { id } = await params

    // Paywall : débloque le dossier (consomme 1 crédit si nécessaire, sinon 402).
    // Un dossier déjà débloqué se télécharge sans reconsommer de crédit.
    await paymentService.unlockResume({ userId }, id)

    const snapshot = sanitizeSnapshot(await resumeService.get(id, userId))
    const letters = await coverLetterService.listPdfInputsByResume(id, userId)

    const result = await pdfService.generateDossierPdf(snapshot, letters, { userId, resumeId: id })

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
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
