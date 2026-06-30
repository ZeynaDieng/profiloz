import { mediaService } from '@/modules/media/media.service'
import { handleOptions, jsonResponse, problemResponse, withCors } from '@/lib/errors'
import { requirePlatformAdmin } from '@/lib/request-context'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    await requirePlatformAdmin(request)
    const { searchParams } = new URL(request.url)
    const result = await mediaService.listAssets(searchParams)
    return withCors(jsonResponse(result), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const actorId = await requirePlatformAdmin(request)
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) throw new Error('Fichier requis')
    const folderId = formData.get('folderId')
    const asset = await mediaService.upload(
      file,
      actorId,
      typeof folderId === 'string' && folderId ? folderId : null,
    )
    return withCors(jsonResponse({ asset }, 201), origin)
  } catch (error) {
    return withCors(problemResponse(error as Error), origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
