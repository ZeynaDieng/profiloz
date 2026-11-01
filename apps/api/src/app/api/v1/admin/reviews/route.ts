import { reviewService } from '@/modules/review/review.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requirePlatformAdmin } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    return withCors(jsonResponse(await reviewService.listForAdmin(new URL(request.url).searchParams)), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
