import { cmsService } from '@/modules/cms/cms.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requirePlatformAdmin } from '@/lib/request-context'

type Params = { params: Promise<{ key: string }> }

export async function GET(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const { key } = await params
    const locale = new URL(request.url).searchParams.get('locale') ?? 'fr-FR'
    const section = await cmsService.getLandingSection(key, locale)
    return withCors(jsonResponse({ section }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const actorId = await requirePlatformAdmin(request)
    const { key } = await params
    const locale = new URL(request.url).searchParams.get('locale') ?? 'fr-FR'
    const section = await cmsService.updateLandingSection(key, await request.json(), actorId, locale)
    return withCors(jsonResponse({ section }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
