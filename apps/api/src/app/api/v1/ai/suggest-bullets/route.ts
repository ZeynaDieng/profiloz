import { aiService } from '@/modules/ai/ai.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
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
