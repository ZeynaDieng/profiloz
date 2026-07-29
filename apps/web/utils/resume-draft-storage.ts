const LEGACY_DRAFT_KEY = 'profiloz:resume:draft'

export function getResumeDraftStorageKey(): string {
  if (typeof localStorage === 'undefined') return LEGACY_DRAFT_KEY

  const userRaw = localStorage.getItem('profiloz:user')
  const token = localStorage.getItem('profiloz:access-token')
  if (token && userRaw) {
    try {
      const user = JSON.parse(userRaw) as { id?: string }
      if (user.id) return `profiloz:resume:draft:user:${user.id}`
    } catch {
      // ignore malformed user payload
    }
  }

  const guestId = localStorage.getItem('profiloz:guest-session')
  if (guestId) return `profiloz:resume:draft:guest:${guestId}`

  return LEGACY_DRAFT_KEY
}

export function clearLegacyResumeDraft() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(LEGACY_DRAFT_KEY)
}

export function createScopedResumeDraftStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  return {
    getItem(_key: string) {
      if (typeof localStorage === 'undefined') return null
      return localStorage.getItem(getResumeDraftStorageKey())
    },
    setItem(_key: string, value: string) {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(getResumeDraftStorageKey(), value)
    },
    removeItem(_key: string) {
      if (typeof localStorage === 'undefined') return
      localStorage.removeItem(getResumeDraftStorageKey())
    },
  }
}
