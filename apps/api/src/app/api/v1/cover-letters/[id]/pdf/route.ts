import { coverLetterService } from '@/modules/cover-letter/cover-letter.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { assertPdfRateLimit } from '@/lib/pdf/rate-limit-pdf'
import { getRequestContext, requireAuth } from '@/lib/request-context'
import { sendEmailTemplate } from '@/lib/email/mail.service'
import { pdfCacheService } from '@/lib/redis/pdf-cache'
import { prisma } from '@/lib/prisma'

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

    // Envoi asynchrone de l'e-mail avec anti-spam Redis (1h)
    try {
      if (ctx.userId) {
        const cacheKey = `mail_sent:cover-letter:${id}`
        const alreadySent = await pdfCacheService.getRaw(cacheKey)
        if (!alreadySent) {
          const user = await prisma.user.findUnique({
            where: { id: ctx.userId },
            select: { email: true, firstName: true },
          })
          if (user?.email) {
            const publicAppUrl = process.env.PUBLIC_APP_URL || 'https://profiloz.com'
            const downloadUrl = `${publicAppUrl}/api/v1/pdf/download/${result.jobId}?filename=lettre_motivation_Profiloz.pdf`
            const dashboardUrl = `${publicAppUrl}/creer`
            
            void sendEmailTemplate('document_download', user.email, {
              firstName: user.firstName ?? user.email.split('@')[0] ?? 'Client',
              documentType: 'Lettre de motivation',
              downloadUrl,
              dashboardUrl,
            }).catch((err) => console.warn('[mail] document_download failed:', err))
            
            await pdfCacheService.setRaw(cacheKey, 'true', 3600)
          }
        }
      }
    } catch (mailErr) {
      console.warn('[mail] document_download error:', mailErr)
    }

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
