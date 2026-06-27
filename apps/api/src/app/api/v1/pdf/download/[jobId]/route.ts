import { pdfService } from '@/modules/pdf/pdf.service'
import { AppError, handleOptions, problemResponse, withCors } from '@/lib/errors'

type Params = { params: Promise<{ jobId: string }> }

export async function GET(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const { jobId } = await params
    const job = await pdfService.getJob(jobId)
    if (!job?.storageKey || job.status !== 'completed') {
      throw new AppError(404, 'Not Found', 'PDF introuvable')
    }

    const filenameParam = new URL(request.url).searchParams.get('filename')
    const filename = filenameParam ? decodeURIComponent(filenameParam) : 'cv Profiloz.pdf'
    const safeFilename = filename.replace(/[/\\:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim() || 'cv Profiloz.pdf'

    const buffer = await pdfService.readPdf(job.storageKey)
    const response = new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename.replace(/"/g, '')}"`,
      },
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
