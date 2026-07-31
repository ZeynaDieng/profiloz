import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { applyCorsHeaders } from '@/lib/cors'
import { resolvePublicAppUrl } from '@/lib/pdf/app-url'

function problemType(status: number | string): string {
  return `${resolvePublicAppUrl()}/errors/${status}`
}

export class AppError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail?: string,
    public errors?: Array<{ field: string; message: string }>,
  ) {
    super(detail ?? title)
    this.name = 'AppError'
  }
}

function isAppError(error: unknown): error is AppError {
  return (
    error instanceof AppError ||
    (typeof error === 'object' &&
      error !== null &&
      typeof (error as Record<string, unknown>).status === 'number' &&
      (typeof (error as Record<string, unknown>).title === 'string' || typeof (error as Record<string, unknown>).message === 'string'))
  )
}

export function problemResponse(error: AppError | ZodError | Error, status = 500, origin?: string | null) {
  let response: NextResponse
  if (error instanceof ZodError) {
    response = NextResponse.json(
      {
        type: problemType('validation'),
        title: 'Validation Error',
        status: 422,
        detail: 'Données invalides',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 422 },
    )
  } else if (isAppError(error)) {
    response = NextResponse.json(
      {
        type: problemType(error.status),
        title: error.title,
        status: error.status,
        detail: error.detail ?? error.message,
        errors: error.errors,
      },
      { status: error.status },
    )
  } else {
    console.error(error)
    response = NextResponse.json(
      {
        type: problemType('internal'),
        title: 'Internal Server Error',
        status,
        detail:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Une erreur inattendue est survenue. Réessayez dans quelques instants.',
      },
      { status },
    )
  }

  return applyCorsHeaders(response, origin)
}

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function withCors(response: NextResponse | Response, origin?: string | null) {
  return applyCorsHeaders(response, origin)
}

export function handleOptions(request: Request) {
  const origin = request.headers.get('origin')
  const response = new NextResponse(null, { status: 204 })
  return applyCorsHeaders(response, origin)
}
