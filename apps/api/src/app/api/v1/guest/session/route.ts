import { randomUUID } from 'crypto'
import { guestSessionService } from '@/modules/guest/guest.service'
import { AppError, handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    let sessionId = request.headers.get('x-guest-session-id')

    if (!sessionId) {
      const body = await request.json().catch(() => ({}))
      sessionId = typeof body.sessionId === 'string' ? body.sessionId : randomUUID()
    }

    const session = await guestSessionService.initOrValidate(sessionId!)
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
