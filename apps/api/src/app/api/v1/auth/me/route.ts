import { authService } from '@/modules/auth/auth.service'
import { AppError, handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireAuth } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const user = await authService.me(userId)
    return withCors(jsonResponse({ user }), origin)
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return withCors(problemResponse(new AppError(404, 'Not Found', 'Utilisateur introuvable')), origin)
    }
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
