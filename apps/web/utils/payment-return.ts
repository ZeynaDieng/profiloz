import { getCoverLetterDraftStorageKey } from '~/utils/cover-letter-draft-storage'
import { getResumeDraftStorageKey } from '~/utils/resume-draft-storage'

const RETURN_KEY = 'profiloz:payment-return-to'
const REF_KEY = 'profiloz:payment-ref'

export function savePaymentReturnTo(path: string) {
  if (typeof sessionStorage === 'undefined') return
  if (!path.startsWith('/') || path.startsWith('//')) return
  sessionStorage.setItem(RETURN_KEY, path)
}

export function peekPaymentReturnTo(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem(RETURN_KEY)
}

export function consumePaymentReturnTo(): string | null {
  const value = peekPaymentReturnTo()
  if (value) sessionStorage.removeItem(RETURN_KEY)
  return value
}

export function resolvePaymentReturnTo(queryReturnTo: unknown): string | null {
  if (typeof queryReturnTo === 'string' && queryReturnTo.startsWith('/') && !queryReturnTo.startsWith('//')) {
    consumePaymentReturnTo()
    return queryReturnTo
  }
  return consumePaymentReturnTo()
}

export function savePaymentRef(ref: string) {
  if (typeof sessionStorage === 'undefined') return
  if (!ref.startsWith('pz_')) return
  sessionStorage.setItem(REF_KEY, ref)
}

export function resolvePaymentRef(queryRef: unknown): string | null {
  if (typeof queryRef === 'string' && queryRef.startsWith('pz_')) {
    sessionStorage.removeItem(REF_KEY)
    return queryRef
  }
  if (typeof sessionStorage === 'undefined') return null
  const stored = sessionStorage.getItem(REF_KEY)
  if (stored) sessionStorage.removeItem(REF_KEY)
  return stored
}

export function isGuestPdfReturnPath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path
  return pathname === '/creer/editeur' || pathname === '/creer/lettre/editeur'
}

export function isLetterReturnPath(path: string): boolean {
  return (path.split('?')[0] ?? path) === '/creer/lettre/editeur'
}

/** Devine la cible PDF si returnTo a été perdu (PayTech / changement de domaine). */
export function guessGuestPdfReturnPath(): string {
  if (typeof localStorage === 'undefined') return '/creer/editeur'

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('profiloz:cover-letter:draft:')) continue
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as { current?: { content?: string; senderName?: string } | null }
      if (parsed.current?.content?.trim() || parsed.current?.senderName?.trim()) {
        return '/creer/lettre/editeur'
      }
    } catch {
      // ignore
    }
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('profiloz:resume:draft:')) continue
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as {
        current?: { personalInfo?: { fullName?: string }; content?: string } | null
      }
      if (parsed.current?.personalInfo?.fullName?.trim()) {
        return '/creer/editeur'
      }
    } catch {
      // ignore
    }
  }

  const letterRaw = localStorage.getItem(getCoverLetterDraftStorageKey())
  if (letterRaw) {
    try {
      const parsed = JSON.parse(letterRaw) as { current?: { content?: string; senderName?: string } | null }
      if (parsed.current?.content?.trim() || parsed.current?.senderName?.trim()) {
        return '/creer/lettre/editeur'
      }
    } catch {
      // ignore
    }
  }

  const resumeRaw = localStorage.getItem(getResumeDraftStorageKey())
  if (resumeRaw) {
    try {
      const parsed = JSON.parse(resumeRaw) as {
        current?: { personalInfo?: { fullName?: string }; content?: string } | null
      }
      if (parsed.current?.personalInfo?.fullName?.trim()) {
        return '/creer/editeur'
      }
    } catch {
      // ignore
    }
  }

  return '/creer/editeur'
}
