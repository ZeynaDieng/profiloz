export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

export const AVATAR_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'] as const

export const AVATAR_STORAGE_PREFIX = 'avatars/'

export function isAvatarStorageKey(value: string): boolean {
  return (
    value.startsWith(AVATAR_STORAGE_PREFIX) &&
    !value.includes('..') &&
    /^avatars\/(?:guest\/[a-z0-9]+|[a-z0-9]+)\/[a-f0-9-]+\.jpe?g$/i.test(value)
  )
}

export function isBase64PhotoUrl(value?: string | null): boolean {
  return Boolean(value?.startsWith('data:image/'))
}

export function sanitizePhotoReference(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined
  const trimmed = value.trim()
  if (isBase64PhotoUrl(trimmed)) return undefined
  if (isAvatarStorageKey(trimmed)) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return undefined
}
