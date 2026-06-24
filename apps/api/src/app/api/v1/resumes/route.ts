import { resumeService } from '@/modules/resume/resume.service'
import { saveResumeSnapshotSchema } from '@profiloz/validators'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireAuth } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const resumes = await resumeService.list(userId)
    const response = jsonResponse({
      data: resumes.map((r) => ({
        ...r,
        updatedAt: r.updatedAt.toISOString(),
      })),
      meta: { total: resumes.length },
    })
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const body = saveResumeSnapshotSchema.parse(await request.json())
    const snapshot = await resumeService.create(userId, body)
    const response = jsonResponse(snapshot, 201)
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
