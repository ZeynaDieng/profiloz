import { adminService } from '@/modules/admin/admin.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requirePlatformAdmin } from '@/lib/request-context'

type Params = { params: Promise<{ id: string; userId: string }> }

export async function DELETE(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const { id, userId } = await params
    const organization = await adminService.removeMember(id, userId)
    return withCors(jsonResponse({ organization }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
