import { adminService } from '@/modules/admin/admin.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requirePlatformAdmin } from '@/lib/request-context'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const { id } = await params
    const user = await adminService.getUser(id)
    return withCors(jsonResponse({ user }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const { id } = await params
    const body = await request.json()
    const user = await adminService.updateUser(id, body)
    return withCors(jsonResponse({ user }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const { id } = await params
    const result = await adminService.deleteUser(id)
    return withCors(jsonResponse(result), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
