import { adminService } from '@/modules/admin/admin.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requirePlatformAdmin } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const data = await adminService.listNotifications()
    return withCors(jsonResponse({ data }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const actorId = await requirePlatformAdmin(request)
    const body = await request.json()
    const notification = await adminService.sendNotification(body, actorId)
    return withCors(jsonResponse({ notification }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
