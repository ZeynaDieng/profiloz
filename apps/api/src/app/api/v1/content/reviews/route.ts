import { reviewService } from '@/modules/review/review.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

/** Avis validés et chiffres réels, pour l'accueil. */
export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    return withCors(jsonResponse(await reviewService.getPublic()), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
