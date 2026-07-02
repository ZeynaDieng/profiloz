import type { ExtractionMeta, ExtractionSectionKind, ResumeSnapshot } from '@profiloz/shared'
import { normalizeLines, parseDateRange, parseResumeText } from '../ocr.parser'
import { buildSalvagePool, splitBlocks } from './blocks'
import { buildConfidence } from './confidence'
import { augmentContact } from './extractors/contact'
import { extractEducations } from './extractors/education'
import { extractExperiences, extractSplitColumnExperiences } from './extractors/experience'
import { extractLanguages } from './extractors/languages'
import { extractSkills } from './extractors/skills'
import { smartMerge } from './merge'
import { type LlmEnhancer, noopLlmEnhancer } from './llm'
import { classifyHeading, guessSectionForContent } from './sections'
import { runConservativeImport, shouldUseConservativeParsing } from './conservative'

export type ResumeExtraction = Partial<ResumeSnapshot> & { _extraction: ExtractionMeta }

export interface ResumePipelineOptions {
  /** Enhancer IA optionnel (désactivé par défaut). */
  llm?: LlmEnhancer
  /** Confiance OCR (0→1) — active le mode conservateur si trop basse. */
  ocrConfidence?: number
}

function detectSections(lines: string[]): ExtractionSectionKind[] {
  const found = new Set<ExtractionSectionKind>()
  for (const line of lines) {
    const kind = classifyHeading(line)
    if (kind) found.add(kind)
  }
  return [...found]
}

function substantiveLines(lines: string[]): string[] {
  return lines.filter((line) => !classifyHeading(line) && line.trim())
}

function experienceBlockLooksContaminated(blockLines: string[]): boolean {
  if (blockLines.length < 2) return false
  let educationLike = 0
  for (const line of blockLines) {
    if (guessSectionForContent(line) === 'education') educationLike++
  }
  return educationLike / blockLines.length >= 0.25
}

function fallbackLooksContaminated(experiences: ReturnType<typeof extractExperiences>): boolean {
  return experiences.some((exp) =>
    /installation de r[ée]seaux|d[ée]tection et r[ée]paration|fran[çc]ais|anglais|wolof/i.test(
      `${exp.position ?? ''} ${exp.company ?? ''} ${exp.description ?? ''}`,
    ),
  )
}

function resolveExperiences(
  blockLines: string[],
  salvagePool: string[],
  fallback: ReturnType<typeof extractExperiences>,
): ReturnType<typeof extractExperiences> {
  const splitColumn = extractSplitColumnExperiences(salvagePool)
  if (splitColumn.length >= 2) return splitColumn

  const block = blockLines.length ? extractExperiences(blockLines) : []
  if (block.length && !experienceBlockLooksContaminated(blockLines)) return block

  if (fallback.length && !fallbackLooksContaminated(fallback)) return fallback
  if (splitColumn.length) return splitColumn
  return block
}

function resolveEducations(
  blockLines: string[],
  salvagePool: string[],
  fallback: ReturnType<typeof extractEducations>,
): ReturnType<typeof extractEducations> {
  const block = blockLines.length ? extractEducations(blockLines) : []
  if (block.length) return block

  const salvageEducations = extractEducations(
    salvagePool.filter((line) => guessSectionForContent(line) === 'education'),
  )
  if (salvageEducations.length) return salvageEducations

  return fallback
}

/**
 * Pipeline d'extraction CV en étapes indépendantes :
 *
 *   1. Nettoyage du texte           → `normalizeLines`
 *   2. Détection des sections       → `classifyHeading` / parser
 *   3. Extraction par section       → `parseResumeText` (heuristiques)
 *   4. Vérification / confiance      → `buildConfidence`
 *   5. Amélioration IA (optionnelle) → `LlmEnhancer`
 *
 * Chaque étape est remplaçable indépendamment (préparation intégration LLM).
 */
export async function runResumePipeline(
  rawText: string,
  options: ResumePipelineOptions = {},
): Promise<ResumeExtraction> {
  const llm = options.llm ?? noopLlmEnhancer
  const ocrConfidence = options.ocrConfidence

  if (shouldUseConservativeParsing(ocrConfidence ?? 1, rawText)) {
    return runConservativeImport(rawText, ocrConfidence ?? 0)
  }

  // 1. Nettoyage
  const lines = normalizeLines(rawText)

  // 2. Détection des sections (découpage en blocs)
  const { headerLines, orphanLines, blocks } = splitBlocks(lines)
  const detectedSections = detectSections(lines)
  const salvagePool = buildSalvagePool(headerLines, orphanLines)

  // 3. Extraction : base heuristique, puis extracteurs dédiés par section.
  const data = parseResumeText(rawText)

  const experienceBlock = blocks.find((block) => block.kind === 'experience')
  const experienceBlockLines = experienceBlock ? substantiveLines(experienceBlock.lines) : []
  const fallbackExperiences = (data.experiences ?? []) as ReturnType<typeof extractExperiences>

  const experiences = resolveExperiences(experienceBlockLines, salvagePool, fallbackExperiences)
  if (experiences.length) data.experiences = experiences

  const educationBlock = blocks.find((block) => block.kind === 'education')
  const educationBlockLines = educationBlock ? substantiveLines(educationBlock.lines) : []
  const fallbackEducations = (data.educations ?? []) as ReturnType<typeof extractEducations>
  const educations = resolveEducations(educationBlockLines, salvagePool, fallbackEducations)
  if (educations.length) data.educations = educations

  const skillBlocks = blocks.filter((block) => block.kind === 'skills')
  if (skillBlocks.length) {
    const cleanedBlocks = skillBlocks.map((block) => ({
      ...block,
      lines: block.lines.filter((line) => {
        const c = line.trim()
        if (!c) return false
        if (parseDateRange(c).startDate || parseDateRange(c).endDate) return false
        if (guessSectionForContent(c) === 'experience' || guessSectionForContent(c) === 'education') return false
        if (/^[A-ZÀ-Ÿ0-9][A-ZÀ-Ÿ0-9\s,'().-]{2,}$/.test(c) && !/[a-zà-ÿ]/.test(c.replace(/[^a-zA-ZÀ-ÿ]/g, ''))) return false
        return true
      }),
    }))
    const skillsContext = cleanedBlocks.flatMap((block) => block.lines).join('\n')
    const skills = extractSkills(cleanedBlocks, skillsContext)
    if (skills.length) data.skills = skills
  }

  const languageBlock = blocks.find((block) => block.kind === 'languages')
  if (languageBlock) {
    const languages = extractLanguages(languageBlock.lines)
    if (languages.length) data.languages = languages
  }

  const profileBlock = blocks.find((block) => block.kind === 'profile')
  if (profileBlock && !data.summary?.trim()) {
    const summaryText = substantiveLines(profileBlock.lines).join(' ').replace(/\s+/g, ' ').trim()
    if (summaryText.length >= 20 && summaryText.length <= 800) {
      data.summary = summaryText
    }
  }

  data.personalInfo = augmentContact(data.personalInfo ?? {}, rawText)

  const merged = smartMerge(data, rawText, {
    skipDictionarySkills: (ocrConfidence ?? 1) < 0.6,
  })

  const confidence = buildConfidence(merged)

  let meta: ExtractionMeta = {
    confidence,
    review: [],
    detectedSections,
    engine: 'heuristic',
    ocrConfidence,
  }

  if (llm !== noopLlmEnhancer) {
    try {
      const enhanced = await llm.enhance({ rawText, lines, data: merged, meta })
      return {
        ...enhanced.data,
        _extraction: { ...enhanced.meta, engine: 'heuristic+llm' },
      }
    } catch {
      meta = { ...meta, engine: 'heuristic' }
    }
  }

  return { ...merged, _extraction: meta }
}

export { type LlmEnhancer, noopLlmEnhancer } from './llm'
export { classifyHeading, guessSectionForContent } from './sections'
