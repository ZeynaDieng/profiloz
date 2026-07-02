import type { Skill } from '@profiloz/shared'
import type { SectionBlock } from '../blocks'
import { canonicalSkillName, extractSkillsFromText, mergeSkillLists } from '../../dictionaries/skills'
import { parseDateRange } from '../../ocr.parser'
import { guessSectionForContent } from '../sections'

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const NOISE_RE = /@|https?:\/\/|\+?\d[\d\s().-]{6,}|^\d{4}\b/i

/** Sous-titre de bloc compétences (pas une compétence en soi). */
const SKILL_SECTION_HEADER_RE =
  /^(?:tr[eé]sorerie\s*[&]\s*finance|outils?\s+informatiques?|comp[eé]tences?\s+cl[eé]s?|savoir[\s-]faire|hard\s+skills?|soft\s+skills?)$/i

/** Fragment trop court / générique pour figurer seul dans la liste. */
const WEAK_SKILL_FRAGMENT_RE =
  /^(?:suivi|flux|pr[eé]visions|clients?|fournisseurs?|bancaires?|recouvrement|contr[oô]le|des|les|et|ou|la|le|de|du|en|au|aux)$/i

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

function isWeakSkill(name: string): boolean {
  const trimmed = name.trim()
  if (trimmed.length < 2) return true
  if (SKILL_SECTION_HEADER_RE.test(trimmed)) return true
  if (WEAK_SKILL_FRAGMENT_RE.test(trimmed)) return true
  return false
}

const CATEGORY_LABEL_RE =
  /^(?:langages?|frameworks?|ui\/design|bases?(?:\s+de\s+donn[eé]es?)?|outils?(?:\s+informatiques?)?|stack|technologies?)$/i

/** Découpe une ligne en tokens de compétences. */
function tokenize(line: string): string[] {
  let cleaned = line.replace(/^[-•●▪*✓]\s*/, '').trim()
  if (!cleaned) return []

  const prefixMatch = cleaned.match(CATEGORY_PREFIX_RE)
  if (prefixMatch) {
    const beforeColon = cleaned.match(/^(.{2,45})\s*[:：]\s*/)?.[1]?.trim()
    const afterColon = prefixMatch[1]!.trim()
    const commaParts = afterColon.split(/[,;/|•·]/).map((part) => part.trim()).filter(Boolean)

    if (beforeColon && CATEGORY_LABEL_RE.test(beforeColon)) {
      return commaParts.length ? commaParts : [afterColon]
    }

    if (beforeColon && beforeColon.split(/\s+/).length >= 2 && !SKILL_SECTION_HEADER_RE.test(beforeColon)) {
      return [beforeColon]
    }

    cleaned = afterColon
  }

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
export function extractSkills(blocks: SectionBlock[], rawText?: string): Skill[] {
  const result: Skill[] = []
  const seen = new Set<string>()

  for (const block of blocks) {
    const category = categoryFromHeader(block.headerText)
    for (const line of block.lines) {
      if (guessSectionForContent(line) === 'experience' || guessSectionForContent(line) === 'education') continue
      if (parseDateRange(line).startDate || parseDateRange(line).endDate) continue
      for (const token of tokenize(line)) {
        const name = canonicalSkillName(token.replace(/[•\s]+$/g, '').trim())
        if (name.length < 2 || name.length > 60) continue
        if (NOISE_RE.test(name)) continue
        if (isWeakSkill(name)) continue
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

  const fromBlocks = result.slice(0, 40)
  if (!rawText || fromBlocks.length >= 3) return fromBlocks
  return mergeSkillLists(fromBlocks, extractSkillsFromText(rawText)).slice(0, 50)
}
