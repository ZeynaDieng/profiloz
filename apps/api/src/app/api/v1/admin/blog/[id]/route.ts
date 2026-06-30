import { cmsService } from '@/modules/cms/cms.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requirePlatformAdmin } from '@/lib/request-context'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const { id } = await params
    const post = await cmsService.getBlogPost(id)
    return withCors(jsonResponse({ post }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const actorId = await requirePlatformAdmin(request)
    const { id } = await params
    const post = await cmsService.updateBlogPost(id, await request.json(), actorId)
    return withCors(jsonResponse({ post }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const actorId = await requirePlatformAdmin(request)
    const { id } = await params
    const result = await cmsService.deleteBlogPost(id, actorId)
    return withCors(jsonResponse(result), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
