import { buildCoverLetterTitle } from '@profiloz/shared'
import { paymentService } from '@/modules/payment/payment.service'
import { pdfService, type CoverLetterPdfInput } from '@/modules/pdf/pdf.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { assertPdfRateLimit } from '@/lib/pdf/rate-limit-pdf'
import { requireGuestOrAuth } from '@/lib/request-context'

const COVER_LETTER_TEMPLATE_SLUGS = ['CLASSIQUE', 'MODERNE', 'ACCENT', 'PROFESSIONNEL', 'CREATIF'] as const

function normalizeCoverLetterTemplateSlug(value?: string): (typeof COVER_LETTER_TEMPLATE_SLUGS)[number] {
  const upper = value?.toUpperCase()
  if (upper && (COVER_LETTER_TEMPLATE_SLUGS as readonly string[]).includes(upper)) {
    return upper as (typeof COVER_LETTER_TEMPLATE_SLUGS)[number]
  }
  return 'CLASSIQUE'
}

function parseAccentColor(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : null
}

function toPdfInput(snapshot: Record<string, unknown>): CoverLetterPdfInput {
  const content = typeof snapshot.content === 'string' ? snapshot.content.trim() : ''
  if (!content) {
    throw new Error('Le contenu de la lettre est obligatoire.')
  }

  const templateSlug = normalizeCoverLetterTemplateSlug(
    typeof snapshot.templateSlug === 'string' ? snapshot.templateSlug : undefined,
  )
  const senderName = typeof snapshot.senderName === 'string' ? snapshot.senderName : null

  return {
    templateSlug,
    title: buildCoverLetterTitle(senderName),
    senderName,
    senderEmail: typeof snapshot.senderEmail === 'string' ? snapshot.senderEmail : null,
    senderPhone: typeof snapshot.senderPhone === 'string' ? snapshot.senderPhone : null,
    senderLocation: typeof snapshot.senderLocation === 'string' ? snapshot.senderLocation : null,
    companyName: typeof snapshot.companyName === 'string' ? snapshot.companyName : null,
    companyAddress: typeof snapshot.companyAddress === 'string' ? snapshot.companyAddress : null,
    position: typeof snapshot.position === 'string' ? snapshot.position : null,
    recruiterName: typeof snapshot.recruiterName === 'string' ? snapshot.recruiterName : null,
    content,
    closingText: typeof snapshot.closingText === 'string' ? snapshot.closingText : null,
    accentColor: parseAccentColor(snapshot.accentColor),
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await requireGuestOrAuth(request)
    assertPdfRateLimit(request, ctx)
    const body = await request.json()
    const letter = toPdfInput((body.snapshot ?? {}) as Record<string, unknown>)
    const resumeId = typeof body.resumeId === 'string' ? body.resumeId : undefined
    const owner = { userId: ctx.userId, guestSessionDbId: ctx.guestSessionDbId, resumeId }

    if (owner.userId && resumeId) {
      await paymentService.unlockResume(owner, resumeId)
    } else {
      await paymentService.assertSnapshotDownload(owner)
    }

    const result = await pdfService.startCoverLetterPdfJob(letter, {
      userId: ctx.userId,
      guestSessionDbId: ctx.guestSessionDbId,
    }, owner)

    const response = jsonResponse(
      {
        jobId: result.jobId,
        status: result.status,
        downloadUrl:
          result.status === 'completed' ? `/pdf/download/${result.jobId}` : null,
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
