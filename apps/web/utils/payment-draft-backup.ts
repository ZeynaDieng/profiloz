import type { ResumeSnapshot } from '@profiloz/shared'
import type { CoverLetterDraft } from '~/stores/cover-letter.store'
import { isLetterReturnPath } from '~/utils/payment-return'
import { findCoverLetterDraftInStorage, findResumeSnapshotInStorage } from '~/utils/guest-draft-sync'

const BACKUP_KEY = 'profiloz:payment-draft-backup'
const GUEST_KEY = 'profiloz:payment-guest-session'

type PaymentDraftBackup =
  | { kind: 'resume'; snapshot: ResumeSnapshot; guestSessionId: string | null; savedAt: string }
  | { kind: 'letter'; draft: CoverLetterDraft; guestSessionId: string | null; savedAt: string }

function writeSession(key: string, value: string) {
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value)
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
}

function readSession(key: string): string | null {
  if (typeof sessionStorage !== 'undefined') {
    const fromSession = sessionStorage.getItem(key)
    if (fromSession) return fromSession
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key)
  }
  return null
}

function removeSession(key: string) {
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key)
  if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
}

/** Priorité au store Pinia (dernières modifs en mémoire), puis localStorage. */
function resolveResumeSnapshotForBackup(): ResumeSnapshot | null {
  if (import.meta.client) {
    try {
      const resumeStore = useResumeStore()
      if (resumeStore.current?.personalInfo.fullName?.trim()) {
        return {
          ...resumeStore.current,
          templateConfig: { ...resumeStore.current.templateConfig },
        }
      }
    } catch {
      // Pinia indisponible (SSR ou contexte hors composant)
    }
  }
  return findResumeSnapshotInStorage()
}

function resolveLetterDraftForBackup(): CoverLetterDraft | null {
  if (import.meta.client) {
    try {
      const coverLetterStore = useCoverLetterStore()
      const draft = coverLetterStore.current
      if (draft?.content?.trim() || draft?.senderName?.trim()) {
        return { ...draft }
      }
    } catch {
      // ignore
    }
  }
  return findCoverLetterDraftInStorage()
}

export function savePaymentGuestSession(guestSessionId: string | null) {
  if (!guestSessionId) return
  writeSession(GUEST_KEY, guestSessionId)
}

export function peekPaymentGuestSession(): string | null {
  return readSession(GUEST_KEY)
}

export function consumePaymentGuestSession(): string | null {
  const value = peekPaymentGuestSession()
  if (value) removeSession(GUEST_KEY)
  return value
}

export function savePaymentDraftBackup(returnTo?: string | null) {
  const guestSessionId =
    typeof localStorage !== 'undefined' ? localStorage.getItem('profiloz:guest-session') : null

  if (returnTo && isLetterReturnPath(returnTo)) {
    const draft = resolveLetterDraftForBackup()
    if (!draft) return

    const backup: PaymentDraftBackup = {
      kind: 'letter',
      draft,
      guestSessionId,
      savedAt: new Date().toISOString(),
    }
    writeSession(BACKUP_KEY, JSON.stringify(backup))
    return
  }

  const snapshot = resolveResumeSnapshotForBackup()
  if (!snapshot) return

  const backup: PaymentDraftBackup = {
    kind: 'resume',
    snapshot,
    guestSessionId,
    savedAt: new Date().toISOString(),
  }
  writeSession(BACKUP_KEY, JSON.stringify(backup))
}

export function loadPaymentDraftBackup(): PaymentDraftBackup | null {
  const raw = readSession(BACKUP_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as PaymentDraftBackup
  } catch {
    return null
  }
}

export function clearPaymentDraftBackup() {
  removeSession(BACKUP_KEY)
  removeSession(GUEST_KEY)
}
