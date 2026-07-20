import { aiService } from '@/modules/ai/ai.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const body = await request.json()
    const text = body.text ?? ''
    const context = body.context ?? ''
    const enhanced = await aiService.enhanceText(text, context)
    return withCors(jsonResponse({ enhancedText: enhanced }), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
