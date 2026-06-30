import { mediaService } from '@/modules/media/media.service'
import { handleOptions, problemResponse, withCors } from '@/lib/errors'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { buffer, contentType, filename } = await mediaService.readAssetFile(id)
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    return problemResponse(error as Error)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
