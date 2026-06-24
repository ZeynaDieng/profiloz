import { templateService } from '@/modules/template/template.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') ?? undefined
    const templates = await templateService.list(category)
    const response = jsonResponse({
      data: templates.map((t) => ({
        slug: t.slug,
        name: t.name,
        category: t.category,
        description: t.description,
        previewUrl: t.previewUrl,
        config: t.config,
      })),
    })
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
