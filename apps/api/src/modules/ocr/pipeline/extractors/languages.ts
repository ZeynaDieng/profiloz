import type { Language, LanguageLevel } from '@profiloz/shared'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/** Dictionnaire de langues : alias normalisé → libellé canonique. */
const LANGUAGE_DICT: Record<string, string> = {
  francais: 'Français',
  french: 'Français',
  anglais: 'Anglais',
  english: 'Anglais',
  wolof: 'Wolof',
  espagnol: 'Espagnol',
  spanish: 'Espagnol',
  espanol: 'Espagnol',
  arabe: 'Arabe',
  arabic: 'Arabe',
  allemand: 'Allemand',
  german: 'Allemand',
  deutsch: 'Allemand',
  portugais: 'Portugais',
  portuguese: 'Portugais',
  italien: 'Italien',
  italian: 'Italien',
  chinois: 'Chinois',
  mandarin: 'Chinois',
  chinese: 'Chinois',
  russe: 'Russe',
  russian: 'Russe',
  japonais: 'Japonais',
  japanese: 'Japonais',
  pulaar: 'Pulaar',
  peul: 'Pulaar',
  pullar: 'Pulaar',
  poular: 'Pulaar',
  foula: 'Pulaar',
  toucouleur: 'Pulaar',
  serere: 'Sérère',
  serer: 'Sérère',
  diola: 'Diola',
  mandingue: 'Mandingue',
  neerlandais: 'Néerlandais',
  dutch: 'Néerlandais',
  turc: 'Turc',
  coreen: 'Coréen',
  hindi: 'Hindi',
}

const LEVEL_RULES: Array<{ level: LanguageLevel; pattern: RegExp }> = [
  { level: 'NATIVE', pattern: /\b(maternell?e|natif|native|bilingue|langue maternelle|mother tongue)\b/i },
  {
    level: 'PROFESSIONAL',
    pattern:
      /\b(courant|courante|professionnel|professionnelle|fluent|avance|avancee|advanced|tres bien|excellent|excellente|parfait|parfaite|c1|c2)\b/i,
  },
  {
    level: 'CONVERSATIONAL',
    pattern: /\b(intermediaire|conversationnel|conversational|moyen|moyenne|assez bien|bien|good|b1|b2)\b/i,
  },
  {
    level: 'BASIC',
    pattern: /\b(debutant|debutante|notions?|scolaire|basic|basique|elementaire|les bases|quelques bases|a1|a2)\b/i,
  },
]

function detectLevel(text: string): LanguageLevel | undefined {
  const normalized = normalize(text)
  for (const { level, pattern } of LEVEL_RULES) {
    if (pattern.test(normalized)) return level
  }
  return undefined
}

function detectLanguageName(fragment: string): string | undefined {
  const normalized = normalize(fragment).replace(/[^a-z\s]/g, ' ')
  const words = normalized.split(/\s+/).filter(Boolean)
  for (const word of words) {
    if (LANGUAGE_DICT[word]) return LANGUAGE_DICT[word]
  }
  for (const alias of Object.keys(LANGUAGE_DICT)) {
    if (normalized.includes(alias)) return LANGUAGE_DICT[alias]
  }
  return undefined
}

/** Découpe une ligne en fragments de langues (virgules, tirets longs entre langues…). */
function splitLanguageFragments(line: string): string[] {
  const trimmed = line.trim()
  if (!trimmed) return []

  const emDashParts = trimmed.split(/\s+[—–-]\s+/).map((p) => p.trim()).filter(Boolean)
  if (emDashParts.length > 1 && emDashParts.every((p) => detectLanguageName(p.split(/[(\[]/)[0]!.trim()))) {
    return emDashParts
  }

  return trimmed.split(/[,;/|•·]/).map((f) => f.trim()).filter(Boolean)
}

function parseLanguageFragment(fragment: string): Language | null {
  const paren = fragment.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (paren) {
    const name = detectLanguageName(paren[1]!)
    if (name) return { name, level: detectLevel(paren[2]!) ?? detectLevel(fragment) }
  }

  const labeled = fragment.match(/^(.+?)\s*[:：]\s*(.+)$/)
  if (labeled) {
    const name = detectLanguageName(labeled[1]!)
    if (name) return { name, level: detectLevel(labeled[2]!) ?? detectLevel(fragment) }
  }

  const name = detectLanguageName(fragment)
  if (name) return { name, level: detectLevel(fragment) }
  return null
}

/**
 * Extracteur de langues : reconnaît les langues via dictionnaire et détecte le
 * niveau associé. Gère les listes (« Français, Anglais, Wolof »), les niveaux
 * CEFR (« Français (C2) — Anglais (B2) ») et les lignes étiquetées.
 */
export function extractLanguages(lines: string[]): Language[] {
  const result: Language[] = []
  const seen = new Map<string, number>()

  const push = (name: string, level?: LanguageLevel) => {
    const existingIndex = seen.get(name)
    if (existingIndex !== undefined) {
      if (level && !result[existingIndex]!.level) result[existingIndex]!.level = level
      return
    }
    seen.set(name, result.length)
    result.push({ name, level })
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[-•●▪*✓]\s*/, '').trim()
    if (!line) continue

    for (const fragment of splitLanguageFragments(line)) {
      const parsed = parseLanguageFragment(fragment)
      if (parsed) push(parsed.name, parsed.level)
    }
  }

  return result.slice(0, 12)
}
