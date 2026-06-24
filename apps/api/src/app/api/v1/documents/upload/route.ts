import { documentService } from '@/modules/document/document.service'
import { documentTypeSchema } from '@profiloz/validators'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requireGuestOrAuth } from '@/lib/request-context'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await requireGuestOrAuth(request)
    const formData = await request.formData()
    const file = formData.get('file')
    const type = formData.get('type')

    if (!(file instanceof File)) {
      throw new Error('Fichier requis')
    }

    const docType = documentTypeSchema.parse(String(type))
    const document = await documentService.upload(file, docType, ctx)
    const response = jsonResponse(
      {
        id: document.id,
        type: document.type,
        status: document.status,
        originalName: document.originalName,
        sizeBytes: document.sizeBytes,
      },
      201,
    )
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
