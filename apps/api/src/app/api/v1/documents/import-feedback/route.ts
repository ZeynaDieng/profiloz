import { importFeedbackService } from '@/modules/import-feedback/import-feedback.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireGuestOrAuth } from '@/lib/request-context'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await requireGuestOrAuth(request)
    const body = await request.json().catch(() => ({}))
    const feedback = await importFeedbackService.record(body, ctx)
    return withCors(jsonResponse({ id: feedback?.id, recorded: true }, 201), origin)
  } catch (error) {
    console.warn('⚠️ [import-feedback] Échec d’enregistrement du feedback:', error instanceof Error ? error.message : error)
    return withCors(jsonResponse({ recorded: false, error: 'Feedback non enregistré' }, 200), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
