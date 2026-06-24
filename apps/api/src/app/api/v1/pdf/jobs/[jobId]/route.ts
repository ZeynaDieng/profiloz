import { pdfService } from '@/modules/pdf/pdf.service'
import { AppError, handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'

type Params = { params: Promise<{ jobId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const origin = _request.headers.get('origin')
  try {
    const { jobId } = await params
    const job = await pdfService.getJob(jobId)
    if (!job) throw new AppError(404, 'Not Found', 'Job PDF introuvable')

    const response = jsonResponse({
      id: job.id,
      status: job.status,
      downloadUrl: job.storageKey ? `/pdf/download/${job.id}` : null,
      expiresAt: job.expiresAt?.toISOString(),
    })
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
