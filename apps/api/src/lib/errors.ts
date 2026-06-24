import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail?: string,
    public errors?: Array<{ field: string; message: string }>,
  ) {
    super(detail ?? title)
  }
}

export function problemResponse(error: AppError | ZodError | Error, status = 500) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        type: 'https://profiloz.fr/errors/validation',
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
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        type: `https://profiloz.fr/errors/${error.status}`,
        title: error.title,
        status: error.status,
        detail: error.detail,
        errors: error.errors,
      },
      { status: error.status },
    )
  }

  console.error(error)
  return NextResponse.json(
    {
      type: 'https://profiloz.fr/errors/internal',
      title: 'Internal Server Error',
      status,
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
    },
    { status },
  )
}

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function withCors(response: NextResponse | Response, origin?: string | null) {
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const matchedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

  if (origin === matchedOrigin || !origin) {
    response.headers.set('Access-Control-Allow-Origin', matchedOrigin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Guest-Session-Id',
    )
  }
  return response
}

export function handleOptions(request: Request) {
  const origin = request.headers.get('origin')
  const response = new NextResponse(null, { status: 204 })
  return withCors(response, origin)
}
