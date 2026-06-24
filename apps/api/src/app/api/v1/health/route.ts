import { prisma } from '@/lib/prisma'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  const response = jsonResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
  return withCors(response, origin)
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
