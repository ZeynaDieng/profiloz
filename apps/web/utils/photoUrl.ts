import { isAvatarStorageKey, isBase64PhotoUrl } from '@profiloz/shared'

export function resolvePhotoUrl(photoUrl: string | undefined, apiBaseUrl: string): string | undefined {
  if (!photoUrl?.trim()) return undefined

  const trimmed = photoUrl.trim()
  if (isBase64PhotoUrl(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  if (isAvatarStorageKey(trimmed)) {
    const relativePath = trimmed.replace(/^avatars\//, '')
    const base = apiBaseUrl.replace(/\/$/, '')
    return `${base}/avatars/${relativePath}`
  }

  return trimmed
}

export function stripLegacyBase64Photo(photoUrl?: string | null): string | undefined {
  if (!photoUrl?.trim() || isBase64PhotoUrl(photoUrl)) return undefined
  return photoUrl.trim()
}

export async function convertImageFileToJpegBlob(file: File, maxSize = 800, quality = 0.88): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas unavailable')

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Conversion JPEG impossible'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      quality,
    )
  })
}
