import { AppError, handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { storageProvider } from '@/lib/storage'

type Params = { params: Promise<{ renderId: string }> }

export async function GET(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const { renderId } = await params
    if (!/^[a-f0-9-]{36}$/i.test(renderId)) {
      throw new AppError(404, 'Not Found', 'Données introuvables')
    }

    const key = `pdf-render/${renderId}.json`
    let raw: Buffer
    try {
      raw = await storageProvider.read(key)
    } catch {
      throw new AppError(404, 'Not Found', 'Données introuvables')
    }

    const snapshot = JSON.parse(raw.toString('utf-8'))
    const response = jsonResponse(snapshot)
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
