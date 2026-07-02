/**
 * Types du moteur d'extraction (import CV).
 *
 * Le pipeline d'extraction produit, en plus des données structurées
 * (`Partial<ResumeSnapshot>`), des métadonnées : un score de confiance par
 * information et une liste « à vérifier » regroupant tout ce qui n'a pas pu
 * être classé avec certitude (principe : ne jamais perdre d'information).
 */

/** Catégories de sections reconnues par le moteur. */
export type ExtractionSectionKind =
  | 'profile'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'interests'
  | 'certifications'
  | 'references'
  | 'contact'
  | 'unknown'

/** Une information non classée avec certitude, à confirmer par l'utilisateur. */
export interface ExtractionReviewItem {
  id: string
  /** Texte d'origine, conservé tel quel. */
  text: string
  /** Pourquoi cette information demande une vérification. */
  reason: string
  /** Section vers laquelle elle pourrait être déplacée (suggestion). */
  suggestedSection?: ExtractionSectionKind
  confidence: number
}

/** Scores de confiance (0 → 1) par information extraite. */
export interface ExtractionConfidence {
  personalInfo?: Partial<
    Record<'fullName' | 'email' | 'phone' | 'location' | 'jobTitle' | 'linkedinUrl' | 'websiteUrl', number>
  >
  summary?: number
  /** Un score par expérience (même ordre que `experiences`). */
  experiences?: number[]
  educations?: number[]
  skills?: number[]
  languages?: number[]
  certifications?: number[]
  interests?: number[]
  /** Score global de l'extraction. */
  overall: number
}

/** Métadonnées d'extraction jointes aux données structurées. */
export interface ExtractionMeta {
  confidence: ExtractionConfidence
  review: ExtractionReviewItem[]
  detectedSections: ExtractionSectionKind[]
  /** Moteur ayant produit le résultat (préparation intégration LLM). */
  engine: 'heuristic' | 'heuristic+llm'
  /** Avertissements non bloquants (OCR partiel, colonnes ambiguës…). */
  warnings?: string[]
  /** Erreurs rencontrées mais contournées (import tolérant). */
  errors?: string[]
  /** Import partiel : l'utilisateur doit compléter manuellement. */
  partialImport?: boolean
  /** Confiance OCR brute (0→1) — scans et photos. */
  ocrConfidence?: number
}

/** Seuil en dessous duquel l'interface doit demander confirmation. */
export const EXTRACTION_LOW_CONFIDENCE = 0.75
