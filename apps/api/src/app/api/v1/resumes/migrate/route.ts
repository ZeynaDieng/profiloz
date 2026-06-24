import { resumeService } from '@/modules/resume/resume.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireAuth } from '@/lib/request-context'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const body = await request.json()
    const result = await resumeService.migrate(userId, body)
    const response = jsonResponse(result, 201)
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
