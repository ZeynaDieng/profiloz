import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { applyCorsHeaders } from '@/lib/cors'

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), origin)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/v1/((?!documents/upload|avatars/upload).*)',
  ],
}
