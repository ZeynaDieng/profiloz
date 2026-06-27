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

export function resolveCorsOrigin(origin: string | null | undefined): string | null {
  const allowed = getAllowedOrigins()

  if (origin && allowed.includes(origin)) {
    return origin
  }

  if (process.env.NODE_ENV === 'development' && origin) {
    try {
      const url = new URL(origin)
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return origin
      }
    } catch {
      // ignore invalid origin
    }
  }

  return allowed[0] ?? null
}

export function applyCorsHeaders(response: Response, origin: string | null | undefined): Response {
  const allowedOrigin = resolveCorsOrigin(origin)
  if (!allowedOrigin) return response

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Guest-Session-Id',
  )
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}
