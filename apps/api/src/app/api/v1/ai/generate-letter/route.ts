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
    const result = await aiService.generateLetter({
      jobOfferText: body.jobOfferText ?? '',
      candidateInfo: body.candidateInfo ?? '',
      targetCompany: body.targetCompany ?? '',
      targetPosition: body.targetPosition ?? '',
    })
    return withCors(jsonResponse(result), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
