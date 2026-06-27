import type { CoverLetterSnapshot, CoverLetterTemplateSlug } from '~/types/cover-letter'
import { DEFAULT_LETTER_CONTENT } from './registry'

export function buildCoverLetterDemoSnapshot(slug: CoverLetterTemplateSlug): CoverLetterSnapshot {
  return {
    templateSlug: slug,
    senderName: 'Kiné Baba DIENG',
    senderLocation: 'Ouakam – Dakar',
    senderPhone: '77 585 30 32',
    senderEmail: 'diengdkine@gmail.com',
    companyName: 'Acme Sénégal',
    companyAddress: 'Immeuble Horizon, Plateau – Dakar',
    position: 'Comptable',
    recruiterName: 'Marie Dupont',
    content: DEFAULT_LETTER_CONTENT,
  }
}
