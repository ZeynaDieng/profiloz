import { coverLetterService } from '@/modules/cover-letter/cover-letter.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireAuth } from '@/lib/request-context'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const userId = await requireAuth(request)
    const { id } = await params
    const result = await coverLetterService.generatePdf(id, userId)
    const response = jsonResponse(result)
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
