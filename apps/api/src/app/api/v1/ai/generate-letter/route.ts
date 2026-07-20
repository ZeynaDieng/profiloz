import { aiService } from '@/modules/ai/ai.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
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
