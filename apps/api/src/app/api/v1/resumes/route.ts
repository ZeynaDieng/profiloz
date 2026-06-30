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
        id: r.id,
        title: r.title,
        status: r.status,
        templateSlug: r.templateSlug,
        completeness: r.completeness,
        fullName: r.fullName,
        jobTitle: r.jobTitle,
        updatedAt: r.updatedAt.toISOString(),
        organizationId: r.organizationId,
        isShared: Boolean(r.organizationId && r.userId !== userId),
        authorName: [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ').trim() || r.user?.email,
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
