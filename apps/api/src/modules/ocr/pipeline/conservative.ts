/**
 * Import conservateur : scan OCR trop faible pour un parsing structurel fiable.
 * Extrait uniquement les coordonnées — le reste est saisi manuellement dans le formulaire.
 */
import type { ExtractionMeta, ResumeSnapshot } from '@profiloz/shared'
import { parseResumeText } from '../ocr.parser'
import { augmentContact } from './extractors/contact'

type ResumeExtraction = Partial<ResumeSnapshot> & { _extraction: ExtractionMeta }

export const OCR_CONSERVATIVE_THRESHOLD = 0.45

export function shouldUseConservativeParsing(ocrConfidence: number, rawText: string): boolean {
  if (ocrConfidence < OCR_CONSERVATIVE_THRESHOLD) return true
  if (!rawText.trim()) return true
  return false
}

export function runConservativeImport(rawText: string, ocrConfidence: number): ResumeExtraction {
  const parsed = parseResumeText(rawText)
  const personalInfo = augmentContact(parsed.personalInfo ?? {}, rawText)

  const meta: ExtractionMeta = {
    confidence: {
      overall: Math.min(0.35, ocrConfidence),
      personalInfo: {
        fullName: personalInfo.fullName ? 0.55 : 0.15,
        email: personalInfo.email ? 0.7 : 0.1,
        phone: personalInfo.phone ? 0.6 : 0.1,
        location: personalInfo.location ? 0.45 : 0.1,
        jobTitle: personalInfo.jobTitle ? 0.4 : 0.1,
      },
    },
    review: [],
    detectedSections: [],
    engine: 'heuristic',
    partialImport: true,
    ocrConfidence,
    warnings: [
      'Qualité de scan insuffisante pour un préremplissage fiable.',
      'Seules vos coordonnées ont été extraites automatiquement.',
      'Complétez les sections manuellement dans le formulaire ci-dessous.',
    ],
  }

  const empty: Partial<ResumeSnapshot> = {
    personalInfo,
    summary: undefined,
    experiences: [],
    educations: [],
    skills: [],
    languages: [],
    certifications: [],
    interests: [],
  }

  return { ...empty, _extraction: meta }
}
