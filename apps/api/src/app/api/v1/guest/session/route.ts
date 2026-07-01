import { randomUUID } from 'crypto'
import { guestSessionService } from '@/modules/guest/guest.service'
import { AppError, handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    let sessionId = request.headers.get('x-guest-session-id')?.trim() || ''

    if (!sessionId) {
      const body = await request.json().catch(() => ({}))
      if (typeof body.sessionId === 'string' && body.sessionId.trim()) {
        sessionId = body.sessionId.trim()
      } else {
        sessionId = randomUUID()
      }
    }

    const session = await guestSessionService.initOrValidate(sessionId)
    const response = jsonResponse(session, 201)
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
