import { adminService } from '@/modules/admin/admin.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requirePlatformAdmin } from '@/lib/request-context'

type Params = { params: Promise<{ slug: string }> }

export async function GET(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const { slug } = await params
    const template = await adminService.getEmailTemplate(slug)
    return withCors(jsonResponse({ template }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const actorId = await requirePlatformAdmin(request)
    const { slug } = await params
    const body = await request.json()
    const template = await adminService.updateEmailTemplate(slug, body, actorId)
    return withCors(jsonResponse({ template }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
