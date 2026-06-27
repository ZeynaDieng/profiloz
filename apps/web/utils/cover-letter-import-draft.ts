import type { CoverLetterImportData } from '@profiloz/shared'

const DRAFT_KEY = 'profiloz:cover-letter:import-draft'

export function saveCoverLetterImportDraft(data: CoverLetterImportData) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data))
}

export function consumeCoverLetterImportDraft(): CoverLetterImportData | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  sessionStorage.removeItem(DRAFT_KEY)
  try {
    return JSON.parse(raw) as CoverLetterImportData
  } catch {
    return null
  }
}
