import type { ResumeSnapshot } from '@profiloz/shared'
import { sanitizePhotoReference } from '@profiloz/shared'
import { paymentService } from '@/modules/payment/payment.service'
import { pdfService } from '@/modules/pdf/pdf.service'
import { resumeService } from '@/modules/resume/resume.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { assertPdfRateLimit } from '@/lib/pdf/rate-limit-pdf'
import { getRequestContext, requireAuth } from '@/lib/request-context'
import { sendEmailTemplate } from '@/lib/email/mail.service'
import { pdfCacheService } from '@/lib/redis/pdf-cache'
import { prisma } from '@/lib/prisma'

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

    // Envoi asynchrone de l'e-mail avec anti-spam Redis (1h)
    try {
      const cacheKey = `mail_sent:resume:${id}`
      const alreadySent = await pdfCacheService.getRaw(cacheKey)
      if (!alreadySent) {
        let targetEmail: string | undefined
        let targetFirstName = 'Client'

        if (userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, firstName: true },
          })
          if (user?.email) {
            targetEmail = user.email
            targetFirstName = user.firstName ?? user.email.split('@')[0] ?? 'Client'
          }
        }

        if (!targetEmail && snapshot.personalInfo.email?.trim()) {
          targetEmail = snapshot.personalInfo.email.trim()
          targetFirstName = snapshot.personalInfo.fullName?.trim() || 'Client'
        }

        if (targetEmail) {
          const publicAppUrl = process.env.PUBLIC_APP_URL || 'https://profiloz.com'
          const downloadUrl = `${publicAppUrl}/api/v1/pdf/download/${result.jobId}?filename=${encodeURIComponent(snapshot.title || 'CV')}.pdf`
          const dashboardUrl = `${publicAppUrl}/creer`
          
          void sendEmailTemplate('document_download', targetEmail, {
            firstName: targetFirstName,
            documentType: 'CV',
            downloadUrl,
            dashboardUrl,
          }).catch((err) => console.warn('[mail] document_download failed:', err))
          
          await pdfCacheService.setRaw(cacheKey, 'true', 3600)
        }
      }
    } catch (mailErr) {
      console.warn('[mail] document_download error:', mailErr)
    }

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
