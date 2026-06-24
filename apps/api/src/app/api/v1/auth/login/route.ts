import { loginSchema } from '@profiloz/validators'
import { authService } from '@/modules/auth/auth.service'
import { AppError, handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const body = loginSchema.parse(await request.json())
    const result = await authService.login(body)
    const response = jsonResponse(result)
    return withCors(response, origin)
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      const response = problemResponse(
        new AppError(401, 'Unauthorized', 'Email ou mot de passe incorrect'),
      )
      return withCors(response, origin)
    }
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
