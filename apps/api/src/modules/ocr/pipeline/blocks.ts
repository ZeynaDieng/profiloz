import type { ExtractionSectionKind } from '@profiloz/shared'
import { cleanLine, looksLikeExperienceTitle, parseDateRange } from '../ocr.parser'
import { classifyHeading, guessSectionForContent } from './sections'

export interface SectionBlock {
  kind: ExtractionSectionKind
  /** Titre d'origine du bloc (utile ex. distinguer Hard Skills / Soft Skills). */
  headerText: string
  /** Lignes de contenu du bloc (titre exclu). */
  lines: string[]
}

export interface SplitResult {
  /** Lignes situées avant la première section (nom, poste, coordonnées…). */
  headerLines: string[]
  /** Lignes non routables vers une colonne (expériences/formations en layout multi-colonnes). */
  orphanLines: string[]
  blocks: SectionBlock[]
}

const LANGUAGE_LINE_RE =
  /^(?:francais|français|anglais|english|wolof|espagnol|arabe|allemand|portugais|italien|chinois|bilingue)\b/i

const EMPLOYER_LINE_RE =
  /^(?:ind[ée]pendant|freelance|auto[\s-]?entrepreneur)$/i

function isMostlyUppercaseLine(line: string): boolean {
  const letters = line.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (letters.length < 3) return false
  const lower = (letters.match(/[a-zà-ÿ]/g) ?? []).length
  return lower / letters.length <= 0.2
}

/** Ligne ressemblant à une compétence (pas une langue, pas une date, pas un titre). */
function looksLikeSkillLine(line: string): boolean {
  const c = cleanLine(line)
  if (!c || c.length < 4 || c.length > 80) return false
  if (LANGUAGE_LINE_RE.test(c)) return false
  if (parseDateRange(c).startDate || parseDateRange(c).endDate) return false
  if (classifyHeading(c)) return false
  if (guessSectionForContent(c) === 'education' || guessSectionForContent(c) === 'experience') return false
  if (isMostlyUppercaseLine(c)) return false
  if (EMPLOYER_LINE_RE.test(c)) return false
  if (/^[\d\s().+-]+$/.test(c)) return false
  return true
}

/** Détecte « EXPÉRIENCE      FORMATION » sur une seule ligne (PDF 2 colonnes). */
function expandDualHeadingLine(line: string): Array<{ kind: ExtractionSectionKind; headerText: string }> | null {
  if (!/\s{2,}/.test(line)) return null
  const parts = line
    .split(/\s{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length < 2) return null

  const classified = parts.map((text) => ({ text, kind: classifyHeading(text) }))
  if (classified.some((entry) => !entry.kind)) return null
  if (new Set(classified.map((entry) => entry.kind)).size < 2) return null

  return classified.map((entry) => ({ kind: entry.kind!, headerText: entry.text }))
}

/** Route une ligne vers le bon bloc quand plusieurs en-têtes de colonnes se suivent. */
function routeMultiColumnLine(line: string, targets: SectionBlock[]): SectionBlock | null {
  const c = cleanLine(line)
  if (!c) return null

  const kinds = new Set(targets.map((block) => block.kind))

  if (LANGUAGE_LINE_RE.test(c) || /\b(?:lu|parlé|parle|écrit|ecrit|courant|maternelle|bilingue|technique|notions)\b/i.test(c)) {
    return targets.find((block) => block.kind === 'languages') ?? null
  }

  const dateInfo = parseDateRange(c)
  if (dateInfo.startDate || dateInfo.endDate || dateInfo.isCurrent) {
    const guessed = guessSectionForContent(c)
    if (kinds.has('education') && guessed === 'education') {
      return targets.find((block) => block.kind === 'education') ?? null
    }
    if (kinds.has('experience')) {
      return targets.find((block) => block.kind === 'experience') ?? null
    }
    // Dates d'emploi/diplôme sans colonne dédiée → pool de salvage, pas compétences.
    return null
  }

  const guessed = guessSectionForContent(c)
  const byGuess = targets.find((block) => block.kind === guessed)
  if (byGuess && guessed !== 'unknown') return byGuess

  if (looksLikeSkillLine(c) && kinds.has('skills')) {
    return targets.find((block) => block.kind === 'skills') ?? null
  }

  if (kinds.has('experience') && (looksLikeExperienceTitle(c) || EMPLOYER_LINE_RE.test(c))) {
    return targets.find((block) => block.kind === 'experience') ?? null
  }

  if (isMostlyUppercaseLine(c) || EMPLOYER_LINE_RE.test(c) || /,/.test(c) && /\b(dakar|paris|lyon|senegal|france)\b/i.test(c)) {
    return null
  }

  if (kinds.has('education') && guessed === 'education') {
    return targets.find((block) => block.kind === 'education') ?? null
  }

  return null
}

/**
 * Découpe les lignes nettoyées en blocs de sections, en s'appuyant sur la
 * détection de titres (`classifyHeading`). Tout ce qui précède la première
 * section est conservé dans `headerLines`.
 *
 * Gère les en-têtes consécutifs (ex. COMPÉTENCES | LANGUES sur 2 colonnes)
 * en routant chaque ligne de contenu vers la bonne section.
 */
export function splitBlocks(lines: string[]): SplitResult {
  const headerLines: string[] = []
  const orphanLines: string[] = []
  const blocks: SectionBlock[] = []
  let current: SectionBlock | null = null
  let multiColumnTargets: SectionBlock[] | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const dualHeadings = expandDualHeadingLine(line)
    if (dualHeadings) {
      multiColumnTargets = dualHeadings.map((heading) => ({
        kind: heading.kind,
        headerText: heading.headerText,
        lines: [],
      }))
      blocks.push(...multiColumnTargets)
      current = null
      continue
    }

    const kind = classifyHeading(line)

    if (kind) {
      const headings: Array<{ kind: ExtractionSectionKind; headerText: string }> = [{ kind, headerText: line }]
      while (i + 1 < lines.length && classifyHeading(lines[i + 1]!)) {
        i++
        const nextKind = classifyHeading(lines[i]!)!
        headings.push({ kind: nextKind, headerText: lines[i]! })
      }

      if (headings.length === 1) {
        current = { kind: headings[0]!.kind, headerText: headings[0]!.headerText, lines: [] }
        blocks.push(current)
        multiColumnTargets = null
      } else {
        multiColumnTargets = headings.map((heading) => ({
          kind: heading.kind,
          headerText: heading.headerText,
          lines: [],
        }))
        blocks.push(...multiColumnTargets)
        current = null
      }
      continue
    }

    if (multiColumnTargets?.length) {
      const target = routeMultiColumnLine(line, multiColumnTargets)
      if (target) target.lines.push(line)
      else orphanLines.push(line)
      continue
    }

    if (current) current.lines.push(line)
    else headerLines.push(line)
  }

  return { headerLines, orphanLines, blocks }
}

/**
 * Lignes candidates pour extracteurs « split column » (layout Adobe / Canva).
 * N'inclut PAS le contenu déjà assigné à un bloc compétences/langues/formations.
 */
export function buildSalvagePool(headerLines: string[], orphanLines: string[]): string[] {
  const pool = [...headerLines, ...orphanLines].filter((line) => !classifyHeading(line) && line.trim())
  return [...new Set(pool)]
}

/** @deprecated Utiliser buildSalvagePool — conservé pour compatibilité tests internes. */
export function collectOrphanContentLines(_lines: string[], _blocks: SectionBlock[]): string[] {
  return []
}
