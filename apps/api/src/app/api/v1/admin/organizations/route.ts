import { adminService } from '@/modules/admin/admin.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requirePlatformAdmin } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const data = await adminService.listOrganizations()
    return withCors(jsonResponse({ data, meta: { total: data.length } }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
