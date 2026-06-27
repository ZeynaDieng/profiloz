import { buildCoverLetterTitle } from '@profiloz/shared'
import { encodeContentDispositionFilename } from '~/utils/resumePdfFilename'

export { buildCoverLetterTitle }

export function buildCoverLetterPdfFilename(senderName?: string | null): string {
  const rawName = senderName?.trim() || 'Profiloz'
  const safeName = rawName
    .replace(/[/\\:*?"<>|]/g, ' ')
    .replace(/[-–—_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return `lettre de motivation ${safeName}.pdf`
}
