import type { ExtractionMeta, ExtractionSectionKind, ResumeSnapshot } from '@profiloz/shared'
import { normalizeLines, parseResumeText } from '../ocr.parser'
import { splitBlocks } from './blocks'
import { buildConfidence } from './confidence'
import { augmentContact } from './extractors/contact'
import { extractEducations } from './extractors/education'
import { extractExperiences } from './extractors/experience'
import { extractLanguages } from './extractors/languages'
import { extractSkills } from './extractors/skills'
import { type LlmEnhancer, noopLlmEnhancer } from './llm'
import { computeReviewItems } from './review'
import { classifyHeading } from './sections'

export type ResumeExtraction = Partial<ResumeSnapshot> & { _extraction: ExtractionMeta }

export interface ResumePipelineOptions {
  /** Enhancer IA optionnel (désactivé par défaut). */
  llm?: LlmEnhancer
}

function detectSections(lines: string[]): ExtractionSectionKind[] {
  const found = new Set<ExtractionSectionKind>()
  for (const line of lines) {
    const kind = classifyHeading(line)
    if (kind) found.add(kind)
  }
  return [...found]
}

/**
 * Pipeline d'extraction CV en étapes indépendantes :
 *
 *   1. Nettoyage du texte           → `normalizeLines`
 *   2. Détection des sections       → `classifyHeading` / parser
 *   3. Extraction par section       → `parseResumeText` (heuristiques)
 *   4. Vérification / confiance      → `buildConfidence`
 *   5. Capture « à vérifier »        → `computeReviewItems` (jamais perdre d'info)
 *   6. Amélioration IA (optionnelle) → `LlmEnhancer`
 *
 * Chaque étape est remplaçable indépendamment (préparation intégration LLM).
 */
export async function runResumePipeline(
  rawText: string,
  options: ResumePipelineOptions = {},
): Promise<ResumeExtraction> {
  const llm = options.llm ?? noopLlmEnhancer

  // 1. Nettoyage
  const lines = normalizeLines(rawText)

  // 2. Détection des sections (découpage en blocs)
  const { blocks } = splitBlocks(lines)
  const detectedSections = detectSections(lines)

  // 3. Extraction : base heuristique, puis extracteurs dédiés par section.
  const data = parseResumeText(rawText)

  // Expériences : un bloc de section isolé fait autorité. Il est scopé par les
  // titres de section, donc il ne « bave » pas sur les autres sections —
  // contrairement à la base heuristique qui sur-segmente sur tout le document.
  // On ne retombe sur la base que si aucun bloc « expérience » n'a été détecté.
  const experienceBlock = blocks.find((block) => block.kind === 'experience')
  if (experienceBlock) {
    const experiences = extractExperiences(experienceBlock.lines)
    if (experiences.length) data.experiences = experiences
  }

  // Formations : même principe — le bloc isolé fait autorité.
  const educationBlock = blocks.find((block) => block.kind === 'education')
  if (educationBlock) {
    const educations = extractEducations(educationBlock.lines)
    if (educations.length) data.educations = educations
  }

  // Compétences : recalcul propre depuis le(s) bloc(s) dédié(s) (Hard/Soft),
  // ce qui évite qu'une compétence dérive vers une autre section.
  const skillBlocks = blocks.filter((block) => block.kind === 'skills')
  if (skillBlocks.length) {
    const skills = extractSkills(skillBlocks)
    if (skills.length) data.skills = skills
  }

  // Langues : dictionnaire + détection de niveau.
  const languageBlock = blocks.find((block) => block.kind === 'languages')
  if (languageBlock) {
    const languages = extractLanguages(languageBlock.lines)
    if (languages.length) data.languages = languages
  }

  // Coordonnées : enrichissement (LinkedIn, GitHub, site/portfolio).
  data.personalInfo = augmentContact(data.personalInfo ?? {}, rawText)

  // 4. Confiance
  const confidence = buildConfidence(data)

  // 5. À vérifier
  const review = computeReviewItems(lines, data)

  let meta: ExtractionMeta = { confidence, review, detectedSections, engine: 'heuristic' }

  // 6. Amélioration IA optionnelle (tolérante aux pannes)
  if (llm !== noopLlmEnhancer) {
    try {
      const enhanced = await llm.enhance({ rawText, lines, data, meta })
      return {
        ...enhanced.data,
        _extraction: { ...enhanced.meta, engine: 'heuristic+llm' },
      }
    } catch {
      meta = { ...meta, engine: 'heuristic' }
    }
  }

  return { ...data, _extraction: meta }
}

export { type LlmEnhancer, noopLlmEnhancer } from './llm'
export { classifyHeading, guessSectionForContent } from './sections'
