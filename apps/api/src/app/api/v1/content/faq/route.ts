import { cmsService } from '@/modules/cms/cms.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const locale = new URL(request.url).searchParams.get('locale') ?? 'fr-FR'
    const data = await cmsService.listFaqItems(locale, false)
    return withCors(jsonResponse({ data }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
