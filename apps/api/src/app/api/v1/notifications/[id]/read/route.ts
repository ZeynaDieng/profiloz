import { markNotificationRead } from '@/modules/notification/notification.service'
import { AppError } from '@/lib/errors'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireAuth } from '@/lib/request-context'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const { id } = await params
    try {
      await markNotificationRead(userId, id)
    } catch {
      throw new AppError(404, 'Not Found', 'Notification introuvable')
    }
    return withCors(jsonResponse({ ok: true }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
