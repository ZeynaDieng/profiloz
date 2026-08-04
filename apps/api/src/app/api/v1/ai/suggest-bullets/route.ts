import { aiService } from '@/modules/ai/ai.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { getRequestContext } from '@/lib/request-context'
import { assertAiRateLimit } from '@/lib/rate-limit-ai'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await getRequestContext(request)
    assertAiRateLimit(request, ctx)

    const body = await request.json()
    const jobTitle = body.jobTitle ?? ''
    const bullets = await aiService.suggestBullets(jobTitle)
    return withCors(jsonResponse({ bullets }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
