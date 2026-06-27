import type { ExtractionSectionKind } from '@profiloz/shared'
import { classifyHeading } from './sections'

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
  blocks: SectionBlock[]
}

/**
 * Découpe les lignes nettoyées en blocs de sections, en s'appuyant sur la
 * détection de titres (`classifyHeading`). Tout ce qui précède la première
 * section est conservé dans `headerLines`.
 *
 * Étape « détection des sections » : isole chaque section pour que les
 * extracteurs dédiés travaillent sur un périmètre propre (évite le mélange).
 */
export function splitBlocks(lines: string[]): SplitResult {
  const headerLines: string[] = []
  const blocks: SectionBlock[] = []
  let current: SectionBlock | null = null

  for (const line of lines) {
    const kind = classifyHeading(line)
    if (kind) {
      current = { kind, headerText: line, lines: [] }
      blocks.push(current)
      continue
    }
    if (current) current.lines.push(line)
    else headerLines.push(line)
  }

  return { headerLines, blocks }
}
