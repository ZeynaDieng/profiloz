import { normalizeResumeSnapshotForPdf, toPdfGenerationError } from '@/lib/pdf/normalize-resume-snapshot'
import { paymentService } from '@/modules/payment/payment.service'
import { pdfService } from '@/modules/pdf/pdf.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { assertPdfRateLimit } from '@/lib/pdf/rate-limit-pdf'
import { requireGuestOrAuth } from '@/lib/request-context'
import { sendEmailTemplate } from '@/lib/email/mail.service'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await requireGuestOrAuth(request)
    assertPdfRateLimit(request, ctx)
    const body = await request.json()
    const snapshot = normalizeResumeSnapshotForPdf(body.snapshot)
    const resumeId = typeof body.resumeId === 'string' ? body.resumeId : undefined
    const owner = { userId: ctx.userId, guestSessionDbId: ctx.guestSessionDbId, resumeId }

    // 1 dossier = CV + lettre : débloquer immédiatement au premier téléchargement
    // (pas après génération PDF), pour que le 2e document du duo reste gratuit.
    if (owner.userId && resumeId) {
      await paymentService.unlockResume(owner, resumeId)
    } else {
      await paymentService.consumeSnapshotDownload(owner, 'cv')
    }

    const result = await pdfService.startSnapshotPdfJob(snapshot, ctx.guestSessionDbId, {
      userId: ctx.userId,
      guestSessionDbId: ctx.guestSessionDbId,
    }, owner)

    // Envoi de l'e-mail de téléchargement pour les invités
    try {
      const targetEmail = ctx.userId ? undefined : snapshot.personalInfo.email?.trim()
      const targetFirstName = ctx.userId ? 'Client' : (snapshot.personalInfo.fullName?.trim() || 'Client')

      if (targetEmail) {
        const publicAppUrl = process.env.PUBLIC_APP_URL || 'https://profiloz.com'
        const downloadUrl = `${publicAppUrl}/api/v1/pdf/download/${result.jobId}?filename=${encodeURIComponent(snapshot.title || 'CV')}.pdf`
        const dashboardUrl = `${publicAppUrl}/creer`
        
        void sendEmailTemplate('document_download', targetEmail, {
          firstName: targetFirstName,
          documentType: 'CV',
          downloadUrl,
          dashboardUrl,
        }).catch((err) => console.warn('[mail] document_download guest failed:', err))
      }
    } catch (mailErr) {
      console.warn('[mail] document_download guest error:', mailErr)
    }

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
