const STORAGE_KEY = 'profiloz:guest-dossier'

export type GuestDossierOrigin = 'cv' | 'letter'

export type GuestDossierState = {
  guestSessionId: string
  origin: GuestDossierOrigin
  cvDownloaded: boolean
  letterDownloaded: boolean
  paidAt: string
}

function readStorage(): GuestDossierState | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as GuestDossierState
  } catch {
    return null
  }
}

function writeStorage(state: GuestDossierState) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function loadGuestDossierState(): GuestDossierState | null {
  return readStorage()
}

export function initGuestDossier(guestSessionId: string, origin: GuestDossierOrigin): GuestDossierState {
  const existing = readStorage()
  if (existing?.guestSessionId === guestSessionId) {
    if (!existing.origin) existing.origin = origin
    writeStorage(existing)
    return existing
  }

  const state: GuestDossierState = {
    guestSessionId,
    origin,
    cvDownloaded: false,
    letterDownloaded: false,
    paidAt: new Date().toISOString(),
  }
  writeStorage(state)
  return state
}

export function markGuestDossierDownload(kind: 'cv' | 'letter'): GuestDossierState | null {
  const state = readStorage()
  if (!state) return null
  if (kind === 'cv') state.cvDownloaded = true
  else state.letterDownloaded = true
  writeStorage(state)
  return state
}

export function isGuestDossierComplete(state: GuestDossierState | null = readStorage()): boolean {
  if (!state) return false
  return state.cvDownloaded && state.letterDownloaded
}

/** Prochain document inclus à proposer, ou null si le dossier est terminé. */
export function nextIncludedDocument(
  state: GuestDossierState | null = readStorage(),
): 'cv' | 'letter' | null {
  if (!state || isGuestDossierComplete(state)) return null
  if (!state.letterDownloaded) return 'letter'
  if (!state.cvDownloaded) return 'cv'
  return null
}

export function restorePaidGuestSession(): string | null {
  const state = readStorage()
  if (!state?.guestSessionId || typeof localStorage === 'undefined') return null
  localStorage.setItem('profiloz:guest-session', state.guestSessionId)
  return state.guestSessionId
}

export function clearGuestDossierState() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
