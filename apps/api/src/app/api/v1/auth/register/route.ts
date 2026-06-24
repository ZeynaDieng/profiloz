import { loginSchema, registerSchema } from '@profiloz/validators'
import { authService } from '@/modules/auth/auth.service'
import { AppError, handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const body = registerSchema.parse(await request.json())
    const result = await authService.register(body)
    const response = jsonResponse(result, 201)
    return withCors(response, origin)
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      const response = problemResponse(
        new AppError(409, 'Conflict', 'Un compte existe déjà avec cet email'),
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
