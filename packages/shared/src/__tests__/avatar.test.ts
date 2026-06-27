import { describe, expect, it } from 'vitest'
import { isAvatarStorageKey, isBase64PhotoUrl, sanitizePhotoReference } from '../avatar.js'

describe('avatar storage helpers', () => {
  it('identifie une clé avatar utilisateur', () => {
    expect(isAvatarStorageKey('avatars/clxyz123abc/uuid-1234.jpg')).toBe(true)
  })

  it('identifie une clé avatar invité', () => {
    expect(isAvatarStorageKey('avatars/guest/clxyz123abc/uuid-1234.jpg')).toBe(true)
  })

  it('rejette le base64 et les chemins invalides', () => {
    expect(isBase64PhotoUrl('data:image/png;base64,abc')).toBe(true)
    expect(isAvatarStorageKey('data:image/png;base64,abc')).toBe(false)
    expect(isAvatarStorageKey('uploads/user/file.pdf')).toBe(false)
    expect(isAvatarStorageKey('avatars/../secret.jpg')).toBe(false)
  })

  it('sanitize supprime le base64 et conserve la clé', () => {
    expect(sanitizePhotoReference('data:image/jpeg;base64,abc')).toBeUndefined()
    expect(sanitizePhotoReference('avatars/user123/abc.jpg')).toBe('avatars/user123/abc.jpg')
    expect(sanitizePhotoReference('https://example.com/a.jpg')).toBe('https://example.com/a.jpg')
  })
})
