import type { ResumeSnapshot } from '@profiloz/shared'
import type { CoverLetterDraft } from '~/stores/cover-letter.store'
import { isLetterReturnPath } from '~/utils/payment-return'
import { alignGuestSessionFromStoredDrafts, findCoverLetterDraftInStorage, findResumeSnapshotInStorage } from '~/utils/guest-draft-sync'

const BACKUP_KEY = 'profiloz:payment-draft-backup'
const GUEST_KEY = 'profiloz:payment-guest-session'

type PaymentDraftBackup =
  | { kind: 'resume'; snapshot: ResumeSnapshot; guestSessionId: string | null; savedAt: string }
  | { kind: 'letter'; draft: CoverLetterDraft; guestSessionId: string | null; savedAt: string }

export function savePaymentGuestSession(guestSessionId: string | null) {
  if (typeof sessionStorage === 'undefined' || !guestSessionId) return
  sessionStorage.setItem(GUEST_KEY, guestSessionId)
}

export function peekPaymentGuestSession(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem(GUEST_KEY)
}

export function consumePaymentGuestSession(): string | null {
  const value = peekPaymentGuestSession()
  if (value) sessionStorage.removeItem(GUEST_KEY)
  return value
}

export function savePaymentDraftBackup(returnTo?: string | null) {
  if (typeof sessionStorage === 'undefined') return

  alignGuestSessionFromStoredDrafts()

  const guestSessionId =
    typeof localStorage !== 'undefined' ? localStorage.getItem('profiloz:guest-session') : null

  if (returnTo && isLetterReturnPath(returnTo)) {
    const draft = findCoverLetterDraftInStorage()
    if (!draft) return

    const backup: PaymentDraftBackup = {
      kind: 'letter',
      draft,
      guestSessionId,
      savedAt: new Date().toISOString(),
    }
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
    return
  }

  const snapshot = findResumeSnapshotInStorage()
  if (!snapshot) return

  const backup: PaymentDraftBackup = {
    kind: 'resume',
    snapshot,
    guestSessionId,
    savedAt: new Date().toISOString(),
  }
  sessionStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
}

export function loadPaymentDraftBackup(): PaymentDraftBackup | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(BACKUP_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as PaymentDraftBackup
  } catch {
    return null
  }
}

export function clearPaymentDraftBackup() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(BACKUP_KEY)
  sessionStorage.removeItem(GUEST_KEY)
}
