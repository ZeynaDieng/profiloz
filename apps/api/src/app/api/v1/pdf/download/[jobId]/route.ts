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

    // Élimine les caractères non-ASCII (comme les accents ou les émojis) pour l'attribut de repli standard de filename
    const asciiFilename = safeFilename
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '_')

    // Encodage conforme à la RFC 5987 pour supporter les émojis et caractères accentués dans Content-Disposition
    const encodedFilename = encodeURIComponent(safeFilename)
    const contentDisposition = `attachment; filename="${asciiFilename.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`

    let buffer: Buffer
    try {
      buffer = await pdfService.readPdf(job.storageKey)
    } catch {
      throw new AppError(404, 'Not Found', 'Le fichier PDF est introuvable ou a expiré')
    }
    const response = new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
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
