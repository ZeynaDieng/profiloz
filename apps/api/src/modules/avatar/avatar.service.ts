import { randomUUID } from 'crypto'
import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_BYTES,
  isAvatarStorageKey,
  sanitizePhotoReference,
} from '@profiloz/shared'
import { AppError } from '@/lib/errors'
import { storageProvider } from '@/lib/storage'
import type { RequestContext } from '@/lib/request-context'

function avatarOwnerPrefix(ctx: RequestContext): string {
  if (ctx.userId) return ctx.userId
  if (ctx.guestSessionDbId) return `guest/${ctx.guestSessionDbId}`
  throw new AppError(401, 'Unauthorized', 'Session invité ou authentification requise')
}

function buildStorageKey(ctx: RequestContext): string {
  return `avatars/${avatarOwnerPrefix(ctx)}/${randomUUID()}.jpg`
}

function assertReadableKey(key: string, ctx: RequestContext) {
  if (!isAvatarStorageKey(key)) {
    throw new AppError(422, 'Validation Error', 'Clé avatar invalide')
  }

  const ownerPrefix = avatarOwnerPrefix(ctx)
  const expectedPrefix = `avatars/${ownerPrefix}/`
  if (!key.startsWith(expectedPrefix)) {
    throw new AppError(403, 'Forbidden', 'Accès refusé à cette photo')
  }
}

export class AvatarService {
  async upload(file: File, ctx: RequestContext) {
    if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_MIME_TYPES)[number])) {
      throw new AppError(422, 'Validation Error', 'Format non supporté. Utilisez JPG ou PNG.')
    }

    if (file.size > AVATAR_MAX_BYTES) {
      throw new AppError(413, 'Payload Too Large', 'Photo trop volumineuse (max 2 Mo)')
    }

    const storageKey = buildStorageKey(ctx)
    const buffer = Buffer.from(await file.arrayBuffer())
    await storageProvider.upload(buffer, storageKey, file.type === 'image/png' ? 'image/jpeg' : file.type)

    return {
      storageKey,
      url: `/api/v1/avatars/${storageKey.replace(/^avatars\//, '')}`,
    }
  }

  async readPublic(storageKey: string) {
    if (!isAvatarStorageKey(storageKey)) {
      throw new AppError(404, 'Not Found', 'Photo introuvable')
    }

    try {
      const buffer = await storageProvider.read(storageKey)
      const contentType = storageKey.endsWith('.png') ? 'image/png' : 'image/jpeg'
      return { buffer, contentType }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'ENOENT') {
        throw new AppError(404, 'Not Found', 'Photo introuvable')
      }
      throw error
    }
  }

  async remove(storageKey: string, ctx: RequestContext) {
    assertReadableKey(storageKey, ctx)
    await storageProvider.delete(storageKey)
  }

  sanitizeForResume(photoUrl?: string | null) {
    return sanitizePhotoReference(photoUrl)
  }
}

export const avatarService = new AvatarService()
