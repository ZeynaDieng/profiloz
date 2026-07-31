import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { applyCorsHeaders } from '@/lib/cors'

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')

  // Preflight OPTIONS : répondre immédiatement 204 avec en-têtes CORS
  if (request.method === 'OPTIONS') {
    const preflightRes = new NextResponse(null, { status: 204 })
    return applyCorsHeaders(preflightRes, origin)
  }

  const response = NextResponse.next()
  return applyCorsHeaders(response, origin)
}

export const config = {
  matcher: '/api/v1/:path*',
}
