import type { ResumeSnapshot } from '@profiloz/shared'
import { pdfService } from '@/modules/pdf/pdf.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireGuestOrAuth } from '@/lib/request-context'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await requireGuestOrAuth(request)
    const body = await request.json()
    const snapshot = body.snapshot as ResumeSnapshot

    const result = await pdfService.generateFromSnapshot(snapshot, ctx.guestSessionDbId)
    const response = jsonResponse({
      jobId: result.jobId,
      status: 'completed',
      downloadUrl: `/pdf/download/${result.jobId}`,
      expiresAt: result.expiresAt.toISOString(),
    }, 202)
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
