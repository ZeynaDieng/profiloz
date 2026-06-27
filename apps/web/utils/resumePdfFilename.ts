import type { ResumeSnapshot } from '@profiloz/shared'

export function buildResumePdfFilename(snapshot: Pick<ResumeSnapshot, 'personalInfo'>): string {
  const rawName = snapshot.personalInfo.fullName?.trim() || 'Profiloz'
  const safeName = rawName
    .replace(/[/\\:*?"<>|]/g, ' ')
    .replace(/[-–—_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return `cv ${safeName}.pdf`
}

export function encodeContentDispositionFilename(filename: string): string {
  return encodeURIComponent(filename)
}
