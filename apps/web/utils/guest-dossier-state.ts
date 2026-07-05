import { loadLastDownloadContext } from '~/utils/last-download-context'

const STORAGE_KEY = 'profiloz:guest-dossier'
const GUEST_SESSION_KEY = 'profiloz:guest-session'

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

export function getPaidGuestSessionId(): string | null {
  return readStorage()?.guestSessionId ?? null
}

export function isPaidGuestDossierActive(): boolean {
  const state = readStorage()
  return Boolean(state?.paidAt && state.guestSessionId)
}

/** Force la session invité liée au paiement (ne jamais la remplacer par un autre brouillon). */
export function pinPaidGuestSession(guestSessionId?: string | null): string | null {
  const id = guestSessionId ?? readStorage()?.guestSessionId
  if (!id || typeof localStorage === 'undefined') return null
  localStorage.setItem(GUEST_SESSION_KEY, id)
  return id
}

export function initGuestDossier(
  guestSessionId: string,
  origin: GuestDossierOrigin,
  options?: { freshPayment?: boolean },
): GuestDossierState {
  const existing = readStorage()

  if (options?.freshPayment) {
    if (
      existing?.paidAt
      && existing.guestSessionId === guestSessionId
      && !isGuestDossierComplete(existing)
    ) {
      if (!existing.origin) existing.origin = origin
      writeStorage(existing)
      pinPaidGuestSession(guestSessionId)
      return existing
    }

    const state: GuestDossierState = {
      guestSessionId,
      origin,
      cvDownloaded: false,
      letterDownloaded: false,
      paidAt: new Date().toISOString(),
    }
    pinPaidGuestSession(guestSessionId)
    writeStorage(state)
    return state
  }

  if (existing?.paidAt && existing.guestSessionId !== guestSessionId) {
    const state: GuestDossierState = {
      guestSessionId,
      origin,
      cvDownloaded: false,
      letterDownloaded: false,
      paidAt: new Date().toISOString(),
    }
    pinPaidGuestSession(guestSessionId)
    writeStorage(state)
    return state
  }

  if (existing?.paidAt) {
    pinPaidGuestSession(existing.guestSessionId)
    if (!existing.origin) existing.origin = origin
    writeStorage(existing)
    return existing
  }

  if (existing?.guestSessionId === guestSessionId) {
    if (!existing.origin) existing.origin = origin
    writeStorage(existing)
    pinPaidGuestSession(guestSessionId)
    return existing
  }

  const state: GuestDossierState = {
    guestSessionId,
    origin,
    cvDownloaded: false,
    letterDownloaded: false,
    paidAt: new Date().toISOString(),
  }
  pinPaidGuestSession(guestSessionId)
  writeStorage(state)
  return state
}

export function markGuestDossierDownload(kind: 'cv' | 'letter'): GuestDossierState | null {
  const state = readStorage()
  if (!state) return null
  pinPaidGuestSession(state.guestSessionId)
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

  if (state.origin === 'letter') {
    if (!state.letterDownloaded) return 'letter'
    if (!state.cvDownloaded) return 'cv'
    return null
  }

  if (!state.cvDownloaded) return 'cv'
  if (!state.letterDownloaded) return 'letter'
  return null
}

export function restorePaidGuestSession(): string | null {
  const state = readStorage()
  if (!state?.guestSessionId) return null
  return pinPaidGuestSession(state.guestSessionId)
}

export function reconcileGuestDossierFlags(hasLetterContent: boolean): GuestDossierState | null {
  const state = readStorage()
  if (!state?.paidAt) return state

  if (state.letterDownloaded && !hasLetterContent && state.origin === 'cv' && !state.cvDownloaded) {
    state.letterDownloaded = false
    writeStorage(state)
    return state
  }

  if (state.letterDownloaded && !hasLetterContent && state.origin === 'cv' && state.cvDownloaded) {
    const lastKind = loadLastDownloadContext()?.kind
    if (lastKind !== 'letter') {
      state.letterDownloaded = false
      writeStorage(state)
    }
  }

  return state
}

export function resetGuestDossierCycleFlags(): GuestDossierState | null {
  const state = readStorage()
  if (!state?.paidAt) return state
  state.cvDownloaded = false
  state.letterDownloaded = false
  writeStorage(state)
  return state
}

export function clearGuestDossierState() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
