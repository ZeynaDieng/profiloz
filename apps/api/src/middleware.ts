import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { applyCorsHeaders, createCorsHeaders } from '@/lib/cors'

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')

  // Preflight OPTIONS : répondre immédiatement 204 avec en-têtes CORS transmis directement
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: createCorsHeaders(origin),
    })
  }

  const response = NextResponse.next()
  return applyCorsHeaders(response, origin)
}

export const config = {
  matcher: '/api/v1/:path*',
}
