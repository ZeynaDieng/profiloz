import { documentService } from '@/modules/document/document.service'
import { AppError, handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireGuestOrAuth } from '@/lib/request-context'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    await requireGuestOrAuth(request)
    const { id } = await params
    const doc = await documentService.getById(id)
    if (!doc?.ocrResult) throw new AppError(404, 'Not Found', 'Résultat OCR introuvable')

    const response = jsonResponse({
      rawText: doc.ocrResult.rawText,
      parsedData: doc.ocrResult.parsedData,
      confidence: doc.ocrResult.confidence,
      provider: doc.ocrResult.provider,
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
