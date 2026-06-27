import { checkPdfRenderReadiness } from '@/lib/pdf/pdf-readiness'
import { handleOptions, jsonResponse, withCors } from '@/lib/errors'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  const detailed = new URL(request.url).searchParams.get('detailed') === '1'

  const body: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  }

  if (detailed) {
    body.pdfRender = await checkPdfRenderReadiness()
  }

  const response = jsonResponse(body)
  return withCors(response, origin)
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
