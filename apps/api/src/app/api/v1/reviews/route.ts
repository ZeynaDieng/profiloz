import { reviewService } from '@/modules/review/review.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { getRequestContext } from '@/lib/request-context'

/** Avis du client connecté ou de la session invité, et s'il peut en déposer un (paiement confirmé). */
export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await getRequestContext(request)
    return withCors(jsonResponse(await reviewService.getMine(ctx)), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await getRequestContext(request)
    const review = await reviewService.submit(ctx, await request.json())
    return withCors(jsonResponse({ review }, 201), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
