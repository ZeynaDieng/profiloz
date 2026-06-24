import { prisma } from '@/lib/prisma'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    await prisma.$queryRaw`SELECT 1`
    const response = jsonResponse({ status: 'ready', database: 'connected' })
    return withCors(response, origin)
  } catch {
    const response = problemResponse(new Error('Database unavailable'), 503)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
