import { cmsService } from '@/modules/cms/cms.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requirePlatformAdmin } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const locale = new URL(request.url).searchParams.get('locale') ?? 'fr-FR'
    const data = await cmsService.listFaqItems(locale, true)
    return withCors(jsonResponse({ data }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const actorId = await requirePlatformAdmin(request)
    const item = await cmsService.createFaqItem(await request.json(), actorId)
    return withCors(jsonResponse({ item }, 201), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
