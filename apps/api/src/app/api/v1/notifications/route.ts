import {
  countUnreadNotifications,
  listUserNotifications,
} from '@/modules/notification/notification.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireAuth } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const [data, unreadCount] = await Promise.all([
      listUserNotifications(userId),
      countUnreadNotifications(userId),
    ])
    return withCors(jsonResponse({ data, unreadCount }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
