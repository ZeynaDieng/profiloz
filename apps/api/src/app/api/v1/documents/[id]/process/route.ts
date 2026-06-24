import { documentService } from '@/modules/document/document.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireGuestOrAuth } from '@/lib/request-context'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    await requireGuestOrAuth(request)
    const { id } = await params
    const ocrResult = await documentService.process(id)
    const response = jsonResponse({
      id: ocrResult.id,
      status: 'PARSED',
      parsedData: ocrResult.parsedData,
      confidence: ocrResult.confidence,
    }, 202)
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
