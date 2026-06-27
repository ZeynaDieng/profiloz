import { avatarService } from '@/modules/avatar/avatar.service'
import { handleOptions, problemResponse, withCors } from '@/lib/errors'
import { requireGuestOrAuth } from '@/lib/request-context'

type Params = { params: Promise<{ path: string[] }> }

export async function GET(_request: Request, { params }: Params) {
  const origin = _request.headers.get('origin')
  try {
    const { path } = await params
    const storageKey = `avatars/${path.join('/')}`
    const { buffer, contentType } = await avatarService.readPublic(storageKey)
    const response = new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
    return withCors(response, origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = request.headers.get('origin')
  try {
    const ctx = await requireGuestOrAuth(request)
    const { path } = await params
    const storageKey = `avatars/${path.join('/')}`
    await avatarService.remove(storageKey, ctx)
    return withCors(new Response(null, { status: 204 }), origin)
  } catch (error) {
    const response = problemResponse(error as Error)
    return withCors(response, origin)
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}
