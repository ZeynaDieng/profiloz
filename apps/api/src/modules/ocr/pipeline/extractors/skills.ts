import type { Skill } from '@profiloz/shared'
import type { SectionBlock } from '../blocks'

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const NOISE_RE = /@|https?:\/\/|\+?\d[\d\s().-]{6,}|^\d{4}\b/i

/** Déduit la catégorie (Hard/Soft) à partir du titre du bloc. */
function categoryFromHeader(headerText: string): string | undefined {
  const normalized = headerText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (/\bsoft\b|comportement|interpersonnel|savoir etre/.test(normalized)) return 'Soft skills'
  if (/\bhard\b|technique|technical|stack|outil|technolog/.test(normalized)) return 'Hard skills'
  return undefined
}

/**
 * Préfixe de sous-catégorie en tête de ligne (« Langages : … », « Frameworks : … »,
 * « UI/Design : … », « Base de données : … ») : un libellé court alphabétique suivi
 * de « : ». On le retire pour qu'il ne pollue pas le premier token.
 */
const CATEGORY_PREFIX_RE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ/ '-]{1,28}\s*[:：]\s*(.+)$/

/** Découpe une ligne en tokens de compétences. */
function tokenize(line: string): string[] {
  let cleaned = line.replace(/^[-•●▪*✓]\s*/, '').trim()
  if (!cleaned) return []
  // Retire le préfixe de catégorie AVANT tout découpage (sinon « UI/Design : X »
  // se scinde en « UI » et « Design : X » à cause du « / »).
  const prefixMatch = cleaned.match(CATEGORY_PREFIX_RE)
  if (prefixMatch) cleaned = prefixMatch[1]!.trim()
  // Séparateurs explicites prioritaires ; sinon, gros espaces (colonnes).
  if (/[,;/|•·]/.test(cleaned)) return cleaned.split(/[,;/|•·]/)
  if (/ {2,}|\t/.test(cleaned)) return cleaned.split(/ {2,}|\t/)
  return [cleaned]
}

/**
 * Extracteur de compétences : nettoie, déduplique et catégorise (Hard/Soft).
 *
 * Garantit qu'une compétence (même en MAJUSCULES, ex. « HYGIÈNE ET CONTACT
 * PATIENT ») reste une compétence et ne dérive jamais vers une autre section.
 */
export function extractSkills(blocks: SectionBlock[]): Skill[] {
  const result: Skill[] = []
  const seen = new Set<string>()

  for (const block of blocks) {
    const category = categoryFromHeader(block.headerText)
    for (const line of block.lines) {
      for (const token of tokenize(line)) {
        const name = token.replace(/[•\s]+$/g, '').trim()
        if (name.length < 2 || name.length > 60) continue
        if (NOISE_RE.test(name)) continue
        // Évite les fragments de phrase (verbes/prépositions de liaison).
        if (/\b(?:et|ou|avec|pour|dans|chez|the|and|with)\b/i.test(name) && name.split(/\s+/).length > 5) {
          continue
        }
        const key = normalizeKey(name)
        if (!key || seen.has(key)) continue
        seen.add(key)
        result.push(category ? { name, category } : { name })
      }
    }
  }

  return result.slice(0, 40)
}
