const LEGACY_DRAFT_KEY = 'profiloz:cover-letter:draft'

export function getCoverLetterDraftStorageKey(): string {
  if (typeof localStorage === 'undefined') return LEGACY_DRAFT_KEY

  const userRaw = localStorage.getItem('profiloz:user')
  const token = localStorage.getItem('profiloz:access-token')
  if (token && userRaw) {
    try {
      const user = JSON.parse(userRaw) as { id?: string }
      if (user.id) return `profiloz:cover-letter:draft:user:${user.id}`
    } catch {
      // ignore malformed user payload
    }
  }

  const guestId = localStorage.getItem('profiloz:guest-session')
  if (guestId) return `profiloz:cover-letter:draft:guest:${guestId}`

  return LEGACY_DRAFT_KEY
}

export function createScopedCoverLetterDraftStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  return {
    getItem(_key: string) {
      if (typeof localStorage === 'undefined') return null
      return localStorage.getItem(getCoverLetterDraftStorageKey())
    },
    setItem(_key: string, value: string) {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(getCoverLetterDraftStorageKey(), value)
    },
    removeItem(_key: string) {
      if (typeof localStorage === 'undefined') return
      localStorage.removeItem(getCoverLetterDraftStorageKey())
    },
  }
}
