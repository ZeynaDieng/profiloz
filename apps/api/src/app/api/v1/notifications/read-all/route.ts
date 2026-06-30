import { markAllNotificationsRead } from '@/modules/notification/notification.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireAuth } from '@/lib/request-context'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    await markAllNotificationsRead(userId)
    return withCors(jsonResponse({ ok: true }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
