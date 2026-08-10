import { adminService } from '@/modules/admin/admin.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requirePlatformAdmin } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const url = new URL(request.url)
    const daysParam = parseInt(url.searchParams.get('days') || '90', 10)
    const days = [7, 30, 90, 180, 365].includes(daysParam) ? daysParam : 90
    const analytics = await adminService.getAnalytics(days)
    return withCors(jsonResponse(analytics), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
