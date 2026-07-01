import type { ResumeSnapshot } from '@profiloz/shared'
import { getCoverLetterDraftStorageKey } from '~/utils/cover-letter-draft-storage'
import { getResumeDraftStorageKey } from '~/utils/resume-draft-storage'
import {
  getPaidGuestSessionId,
  isPaidGuestDossierActive,
  pinPaidGuestSession,
} from '~/utils/guest-dossier-state'
import type { CoverLetterDraft } from '~/stores/cover-letter.store'

const GUEST_SESSION_KEY = 'profiloz:guest-session'
const RESUME_GUEST_PREFIX = 'profiloz:resume:draft:guest:'
const LETTER_GUEST_PREFIX = 'profiloz:cover-letter:draft:guest:'

function extractGuestId(key: string, prefix: string): string | null {
  if (!key.startsWith(prefix)) return null
  const id = key.slice(prefix.length)
  return id.length > 0 ? id : null
}

function parseResumeDraft(raw: string): ResumeSnapshot | null {
  try {
    const persisted = JSON.parse(raw) as { current?: ResumeSnapshot | null }
    if (persisted.current?.personalInfo?.fullName?.trim()) return persisted.current
  } catch {
    // ignore
  }
  return null
}

function parseLetterDraft(raw: string): CoverLetterDraft | null {
  try {
    const persisted = JSON.parse(raw) as { current?: CoverLetterDraft | null }
    if (persisted.current?.content?.trim() || persisted.current?.senderName?.trim()) {
      return persisted.current
    }
  } catch {
    // ignore
  }
  return null
}

function maybeSetGuestSessionId(guestId: string): void {
  if (isPaidGuestDossierActive()) {
    pinPaidGuestSession()
    return
  }
  localStorage.setItem(GUEST_SESSION_KEY, guestId)
}

/** Repointe profiloz:guest-session vers le brouillon le plus récent en localStorage. */
export function alignGuestSessionFromStoredDrafts(): string | null {
  if (typeof localStorage === 'undefined') return null
  if (isPaidGuestDossierActive()) {
    return pinPaidGuestSession()
  }

  let bestGuestId: string | null = null
  let bestScore = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue

    const guestId =
      extractGuestId(key, RESUME_GUEST_PREFIX) ?? extractGuestId(key, LETTER_GUEST_PREFIX)
    if (!guestId) continue

    const raw = localStorage.getItem(key)
    if (!raw) continue

    let score = 0
    if (key.startsWith(RESUME_GUEST_PREFIX)) {
      const draft = parseResumeDraft(raw)
      if (draft) score = 10 + (draft.personalInfo.fullName?.length ?? 0)
    } else if (key.startsWith(LETTER_GUEST_PREFIX)) {
      const draft = parseLetterDraft(raw)
      if (draft) score = 8 + (draft.content?.length ?? 0)
    }

    if (score > bestScore) {
      bestScore = score
      bestGuestId = guestId
    }
  }

  if (bestGuestId) {
    maybeSetGuestSessionId(bestGuestId)
  }

  return bestGuestId
}

export function findResumeSnapshotInStorage(): ResumeSnapshot | null {
  if (typeof localStorage === 'undefined') return null

  const paidId = getPaidGuestSessionId()
  if (paidId) {
    const paidKey = `${RESUME_GUEST_PREFIX}${paidId}`
    const paidRaw = localStorage.getItem(paidKey)
    if (paidRaw) {
      const draft = parseResumeDraft(paidRaw)
      if (draft) {
        pinPaidGuestSession(paidId)
        return draft
      }
    }
  }

  const currentKey = getResumeDraftStorageKey()
  const currentRaw = localStorage.getItem(currentKey)
  if (currentRaw) {
    const draft = parseResumeDraft(currentRaw)
    if (draft) return draft
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(RESUME_GUEST_PREFIX)) continue
    const raw = localStorage.getItem(key)
    if (!raw) continue
    const draft = parseResumeDraft(raw)
    if (draft) {
      const guestId = extractGuestId(key, RESUME_GUEST_PREFIX)
      if (guestId) maybeSetGuestSessionId(guestId)
      return draft
    }
  }

  return null
}

export function findCoverLetterDraftInStorage(): CoverLetterDraft | null {
  if (typeof localStorage === 'undefined') return null

  const paidId = getPaidGuestSessionId()
  if (paidId) {
    const paidKey = `${LETTER_GUEST_PREFIX}${paidId}`
    const paidRaw = localStorage.getItem(paidKey)
    if (paidRaw) {
      const draft = parseLetterDraft(paidRaw)
      if (draft) {
        pinPaidGuestSession(paidId)
        return draft
      }
    }
  }

  const currentKey = getCoverLetterDraftStorageKey()
  const currentRaw = localStorage.getItem(currentKey)
  if (currentRaw) {
    const draft = parseLetterDraft(currentRaw)
    if (draft) return draft
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(LETTER_GUEST_PREFIX)) continue
    const raw = localStorage.getItem(key)
    if (!raw) continue
    const draft = parseLetterDraft(raw)
    if (draft) {
      const guestId = extractGuestId(key, LETTER_GUEST_PREFIX)
      if (guestId) maybeSetGuestSessionId(guestId)
      return draft
    }
  }

  return null
}
