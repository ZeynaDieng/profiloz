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

function isValidResumeDraftPayload(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw)
    const cur = parsed?.current || (parsed?.personalInfo ? parsed : null)
    return Boolean(
      cur &&
        (cur.personalInfo?.fullName ||
          cur.experiences?.length ||
          cur.educations?.length ||
          cur.summary),
    )
  } catch {
    return false
  }
}

export function findMostRecentResumeDraft(): string | null {
  if (typeof localStorage === 'undefined') return null

  // 1. Essayer d'abord la clé primaire actuelle
  const primaryKey = getResumeDraftStorageKey()
  const primaryData = localStorage.getItem(primaryKey)
  if (primaryData && isValidResumeDraftPayload(primaryData)) {
    return primaryData
  }

  // 2. Essayer la clé legacy
  const legacyData = localStorage.getItem(LEGACY_DRAFT_KEY)
  if (legacyData && isValidResumeDraftPayload(legacyData)) {
    localStorage.setItem(primaryKey, legacyData)
    return legacyData
  }

  // 3. Rechercher toutes les clés 'profiloz:resume:draft' pour récupérer le dernier brouillon existant
  let newestData: string | null = null
  let newestTime = 0

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith('profiloz:resume:draft')) continue
    const raw = localStorage.getItem(k)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw)
      const cur = parsed?.current || (parsed?.personalInfo ? parsed : null)
      if (
        cur &&
        (cur.personalInfo?.fullName ||
          cur.experiences?.length ||
          cur.educations?.length ||
          cur.summary)
      ) {
        const lastMod = cur.metadata?.lastModified
          ? new Date(cur.metadata.lastModified).getTime()
          : 0
        if (lastMod >= newestTime) {
          newestTime = lastMod
          newestData = raw
        }
      }
    } catch {
      // ignorer les clés invalides
    }
  }

  if (newestData) {
    localStorage.setItem(primaryKey, newestData)
    return newestData
  }

  return primaryData || null
}

export function createScopedResumeDraftStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  return {
    getItem(_key: string) {
      if (typeof localStorage === 'undefined') return null
      return findMostRecentResumeDraft()
    },
    setItem(_key: string, value: string) {
      if (typeof localStorage === 'undefined') return
      const primaryKey = getResumeDraftStorageKey()
      localStorage.setItem(primaryKey, value)
      localStorage.setItem(LEGACY_DRAFT_KEY, value) // sauvegarde de secours permanente
    },
    removeItem(_key: string) {
      if (typeof localStorage === 'undefined') return
      localStorage.removeItem(getResumeDraftStorageKey())
    },
  }
}
