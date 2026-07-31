const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
]

export function getAllowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (process.env.NODE_ENV === 'development') {
    return [...new Set([...fromEnv, ...DEFAULT_DEV_ORIGINS])]
  }

  return fromEnv
}

export function resolveCorsOrigin(origin: string | null | undefined): string {
  if (origin && origin !== '*') {
    return origin
  }
  return process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://profiloz.com'
}

export function createCorsHeaders(origin: string | null | undefined): Headers {
  const allowedOrigin = resolveCorsOrigin(origin)
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', allowedOrigin)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
  headers.set(
    'Access-Control-Allow-Headers',
    '*, Content-Type, Authorization, X-Guest-Session-Id, x-guest-session-id, X-Requested-With',
  )
  headers.set('Access-Control-Max-Age', '86400')
  return headers
}

export function applyCorsHeaders(response: Response, origin: string | null | undefined): Response {
  const allowedOrigin = resolveCorsOrigin(origin)

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    '*, Content-Type, Authorization, X-Guest-Session-Id, x-guest-session-id, X-Requested-With',
  )
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}
