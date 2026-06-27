import type { ExtractionSectionKind } from '@profiloz/shared'

/** Normalise un titre pour comparaison : minuscule, sans accents ni ponctuation. */
function normalizeHeading(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^\/\/\s*/, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Synonymes de titres de section → catégorie. L'ordre n'importe pas ;
 * la correspondance se fait sur le titre normalisé (tolère majuscules,
 * accents, ponctuation et variantes FR/EN).
 */
const SECTION_SYNONYMS: Array<{ kind: ExtractionSectionKind; patterns: RegExp[] }> = [
  {
    kind: 'profile',
    patterns: [
      /^profil( professionnel)?$/,
      /^resume$/,
      /^a propos( de moi)?$/,
      /^about( me)?$/,
      /^summary$/,
      /^objectif( professionnel)?$/,
      /^presentation$/,
      /^vision( et leadership)?$/,
    ],
  },
  {
    kind: 'experience',
    patterns: [
      /^experiences?( professionnelles?| internationales?)?$/,
      /^experience( professionnelle| internationale)?$/,
      /^parcours( professionnel| executif)?$/,
      /^stages?( et experiences?| experiences?)?$/,
      /^resultats?( et experiences?| experiences?)?$/,
      /^emplois?$/,
      /^carriere$/,
      /^work( history| experience)?$/,
      /^employment( history)?$/,
      /^professional experience$/,
    ],
  },
  {
    kind: 'education',
    patterns: [
      /^formations?$/,
      /^education( nationale)?$/,
      /^etudes?( et diplomes?| et formations?)?$/,
      /^diplomes?$/,
      /^scolarite$/,
      /^cursus( scolaire| universitaire)?$/,
      /^parcours( scolaire| academique| universitaire)$/,
      /^academic background$/,
      /^qualifications?$/,
    ],
  },
  {
    kind: 'skills',
    patterns: [
      /^competences?( techniques?| cles| professionnelles?)?$/,
      /^expertises?$/,
      /^savoir faire$/,
      /^skills$/,
      /^hard skills$/,
      /^soft skills$/,
      /^competences? comportementales?$/,
      /^aptitudes?$/,
      /^stack( technique)?$/,
      /^technologies?$/,
      /^outils?$/,
    ],
  },
  {
    kind: 'languages',
    patterns: [/^langues?$/, /^languages?$/, /^idiomes?$/, /^language skills$/],
  },
  {
    kind: 'interests',
    patterns: [
      /^centres? d interet$/,
      /^centre d interet$/,
      /^interets?$/,
      /^interests?$/,
      /^loisirs?$/,
      /^hobbies$/,
      /^activites?( extra professionnelles?| extra scolaires?)?$/,
    ],
  },
  {
    kind: 'certifications',
    patterns: [
      /^certifications?$/,
      /^certificats?$/,
      /^attestations?$/,
      /^habilitations?$/,
      /^licences?$/,
      /^accreditations?$/,
    ],
  },
  {
    kind: 'references',
    patterns: [/^references?$/, /^referents?$/, /^recommandations?$/],
  },
  {
    kind: 'contact',
    patterns: [
      /^coordonnees?$/,
      /^contact( s| infos?| me)?$/,
      /^informations? (personnelles?|de contact)$/,
      /^me contacter$/,
    ],
  },
]

/** Mots-clés indicatifs pour deviner la section d'un contenu (pas d'un titre). */
const CONTENT_HINTS: Array<{ kind: ExtractionSectionKind; pattern: RegExp }> = [
  { kind: 'contact', pattern: /@|https?:\/\/|\+?\d[\d\s().-]{7,}|linkedin|github/i },
  {
    kind: 'education',
    pattern:
      /\b(licence|master|doctorat|bac\b|baccalaur|bts|dut|bfem|diplome|diplôme|universit|ecole|école|lycee|lycée|institut|faculte|faculté|formation)\b/i,
  },
  {
    kind: 'languages',
    pattern: /\b(francais|français|anglais|english|wolof|espagnol|arabe|allemand|portugais|italien|chinois)\b/i,
  },
  {
    kind: 'experience',
    pattern:
      /\b(stage|stagiaire|charge|chargé|responsable|directeur|assistant|consultant|developpeur|développeur|manager|technicien|commercial|conseiller|chez|\d{4}\s*[-–—]\s*\d{4})\b/i,
  },
]

/**
 * Radicaux de section pour un repli TOLÉRANT (titres mal orthographiés, au
 * singulier ou suivis d'un qualificatif), fréquents sur les CV passés à l'OCR :
 * « EXPERIENCE PREFFESIONELLE », « ETUDE SECONDAIRE », « FORMATION INFORMATIQUE »…
 */
// NB : on évite volontairement les radicaux qui débutent souvent une LIGNE DE
// CONTENU (« diplôme d'ingénieur », « certificat Voltaire », « licence pro ») —
// ils restent gérés par les motifs exacts, jamais par le repli flou.
const HEADING_STEMS: Array<{ kind: ExtractionSectionKind; stems: string[] }> = [
  { kind: 'profile', stems: ['profil', 'presentation', 'objectif'] },
  { kind: 'experience', stems: ['experience', 'experiences', 'parcours', 'emploi', 'emplois', 'carriere'] },
  { kind: 'education', stems: ['formation', 'formations', 'etude', 'etudes', 'scolarite', 'cursus'] },
  { kind: 'skills', stems: ['competence', 'competences', 'expertise', 'expertises', 'aptitude', 'aptitudes'] },
  { kind: 'languages', stems: ['langue', 'langues', 'language', 'languages', 'idiome', 'idiomes'] },
  { kind: 'interests', stems: ['interet', 'interets', 'loisir', 'loisirs', 'hobbie', 'hobbies'] },
  { kind: 'contact', stems: ['coordonnee', 'coordonnees', 'coordonne'] },
]

// Mots de liaison : leur présence signale une PHRASE (contenu), pas un titre.
const CONNECTOR_WORDS = new Set([
  'de', 'du', 'des', 'd', 'en', 'a', 'au', 'aux', 'le', 'la', 'les', 'et', 'sur', 'pour',
  'the', 'of', 'in', 'and',
])

/** Distance de Levenshtein bornée (pour tolérer 1-2 fautes d'OCR sur un radical). */
function withinEditDistance(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i)
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0]!
    dp[0] = j
    for (let i = 1; i <= a.length; i++) {
      const tmp = dp[i]!
      dp[i] = Math.min(
        dp[i]! + 1,
        dp[i - 1]! + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      prev = tmp
    }
  }
  return dp[a.length]! <= max
}

/**
 * Repli tolérant : un titre court (≤ 3 mots) dont le PREMIER mot correspond
 * (exactement ou à 1 faute près) au radical d'une section. Le seuil de 3 mots
 * évite de confondre un titre avec un élément de contenu (« Formation en
 * développement personnelle » a 4 mots → reste du contenu).
 */
/** Ligne majoritairement en CAPITALES (signal fort de titre décoratif). */
function isMostlyUppercase(line: string): boolean {
  const letters = line.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (letters.length < 3) return false
  const lower = (letters.match(/[a-zà-ÿ]/g) ?? []).length
  return lower / letters.length <= 0.3
}

function classifyHeadingFuzzy(line: string, normalized: string): ExtractionSectionKind | null {
  const words = normalized.split(' ')
  if (words.length > 3) return null
  // Le repli flou ne s'applique qu'aux titres en CAPITALES : sinon un élément de
  // contenu en casse normale (« Formation accélérée ») serait pris pour un titre.
  if (!isMostlyUppercase(line)) return null
  // Un mot de liaison → c'est une phrase (« diplôme d'ingénieur »), pas un titre.
  if (words.some((w) => CONNECTOR_WORDS.has(w))) return null
  const first = words[0]!
  if (first.length < 5) return null
  for (const { kind, stems } of HEADING_STEMS) {
    for (const stem of stems) {
      if (first === stem) return kind
      // 1 faute pour ≥ 6 lettres, 2 fautes pour ≥ 10 (radicaux longs).
      const max = stem.length >= 10 ? 2 : stem.length >= 6 ? 1 : 0
      if (max > 0 && withinEditDistance(first, stem, max)) return kind
    }
  }
  return null
}

/**
 * Classe une ligne de TITRE en catégorie de section, ou null si ce n'en est pas
 * une. Reconnaît des dizaines de variantes (FR/EN, accents, ponctuation), avec un
 * repli tolérant aux fautes d'OCR.
 */
export function classifyHeading(line: string): ExtractionSectionKind | null {
  const normalized = normalizeHeading(line)
  if (!normalized || normalized.length > 48) return null
  if (normalized.split(' ').length > 5) return null

  for (const { kind, patterns } of SECTION_SYNONYMS) {
    if (patterns.some((pattern) => pattern.test(normalized))) return kind
  }
  return classifyHeadingFuzzy(line, normalized)
}

/** Devine la section la plus probable pour un CONTENU non classé (best effort). */
export function guessSectionForContent(line: string): ExtractionSectionKind {
  for (const { kind, pattern } of CONTENT_HINTS) {
    if (pattern.test(line)) return kind
  }
  return 'unknown'
}
