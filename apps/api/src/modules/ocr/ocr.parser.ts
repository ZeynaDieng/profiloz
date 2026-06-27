import type { CoverLetterImportData, DocumentType, ResumeSnapshot } from '@profiloz/shared'
import { classifyHeading } from './pipeline/sections'
import { repairSpacedOutText } from './text-repair'

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/
const URL_RE = /https?:\/\/[^\s]+/i
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s]+/i
// Un mois FR (préfixe + suffixe optionnel) : « jan », « mars », « avril », « août »…
const MONTH_TOKEN = '(?:jan|fév|fev|mar|avr|mai|jun|jui|aoû|aou|sep|oct|nov|déc|dec)[a-zûéèà.]*'
// Un repère de date : « Mars 2024 » ou « 2024 ».
const DATE_PART = `(?:${MONTH_TOKEN}\\.?\\s*)?\\d{4}`
// Plage de dates, ex. « 2017 - 2020 », « Mars 2024 à Avril 2024 », « de Mai 2024 à Juin 2024 »,
// « d'Août 2024 à Sept 2024 », « Janvier 2021 - Présent ». Le préfixe « de »/« d' » est toléré.
const DATE_RANGE_RE = new RegExp(
  `(?:de\\s+|d['\u2019]\\s*)?(${DATE_PART})\\s*(?:[-–—/]+|à|au|to|a)\\s*(${DATE_PART}|présent|present|aujourd['\u2019]hui|current|aujourd)`,
  'i',
)
const YEAR_RANGE_RE = /^(\d{4})\s*[-–—]\s*(\d{4}|présent|present)$/i
// Une ligne qui COMMENCE par une plage de dates (nouvelle entrée datée).
const DATE_RANGE_START_RE = new RegExp(
  `^(?:de\\s+|d['\u2019]\\s*)?${DATE_PART}\\s*(?:[-–—/]+|à|au|to|a)\\s*(?:${DATE_PART}|présent|present|aujourd['\u2019]hui|current|aujourd)`,
  'i',
)

const SKIP_NAME_RE =
  /^(curriculum vitae|cv|résumé|resume|profil|profile|coordonnées|contact|informations personnelles)$/i

/** Mots qui trahissent un intitulé de poste plutôt qu'un nom de personne. */
const JOB_TITLE_HINT_RE =
  /\b(charg[ée]+e?|responsable|assistant[e]?|directeur|directrice|consultant[e]?|d[ée]veloppeu(?:r|se)|ing[ée]nieur[e]?|manager|manageuse|stagiaire|g[ée]rant[e]?|technicien[ne]?|comptable|commercial[e]?|vendeu(?:r|se)|conseiller[e]?|coordinateur|coordinatrice|secr[ée]taire|analyste|architecte|designer|chef[fe]?|superviseur|administrateu(?:r|rice)|agent[e]?|op[ée]rateur|formateur|formatrice|enseignant[e]?|professeur[e]?|soignant[e]?|aide-?soignant[e]?|infirmi(?:er|ère)|m[ée]decin|pharmacien[ne]?|sage-femme|kin[ée]sith[ée]rapeute|plombier|[ée]lectricien[ne]?|m[ée]canicien[ne]?|ma[çc]on|cuisinier[e]?|p[âa]tissier[e]?|serveu(?:r|se)|caissi(?:er|ère)|chauffeur|livreur|magasinier[e]?|[ée]ducateu(?:r|rice)|animateu(?:r|rice)|infographiste|graphiste|juriste|avocat[e]?|notaire|m[ée]diateur|chargée?|attach[ée]|directeur|auditeu(?:r|rice)|contr[oô]leu(?:r|se)|acheteu(?:r|se)|logisticien[ne]?|community manager|webmaster)\b/i

const LABELED_LINE_RE =
  /^(?:prénom|prenom|nom|adresse|tel|tél|téléphone|telephone|email|e-mail|courriel|mail|poste|profession|métier|metier|fonction|linkedin|ville|localisation)\b/i

/** Mots qui trahissent un nom d'organisation (pas une personne). */
const ORG_NAME_RE =
  /\b(business|group|groupe|sarl|sas|sasu|inc|ltd|corp|company|services?|n[ée]goce|entreprise|agence|cabinet|minist[èe]re|soci[ée]t[ée]|holding|consulting|technologies?|solutions?|immo)\b/i

/** Libellés d'état civil : jamais une expérience ni un intitulé de poste. */
const PERSONAL_INFO_LABEL_RE =
  /^(?:date de naissance|né[e]?\s+le|lieu de naissance|nationalit[ée]|situation matrimoniale|statut matrimonial|sexe|genre|m[èe]re|p[èe]re|parents?|enfants?|permis(?:\s+de\s+conduire)?|cni|passeport|num[ée]ro)\b/i

const LABELED_FIELDS: Array<{ field: keyof ResumeSnapshot['personalInfo']; pattern: RegExp }> = [
  {
    field: 'fullName',
    pattern: /^(?:prénom\s*(?:&|et)\s*nom|nom\s*(?:&|et)\s*prénom|nom\s*et\s*prénom|nom complet|name)\s*[:：]\s*(.+)$/i,
  },
  { field: 'location', pattern: /^(?:adresse|address|ville|localisation|résidence|residence)\s*[:：]\s*(.+)$/i },
  { field: 'phone', pattern: /^(?:tél(?:éphone)?|tel|phone|mobile|portable)\s*[:：]\s*(.+)$/i },
  { field: 'email', pattern: /^(?:e-?mail|courriel|mail)\s*[:：]\s*(.+)$/i },
  {
    field: 'jobTitle',
    pattern: /^(?:poste(?:\s*visé)?|profession|métier|metier|fonction|titre(?:\s*professionnel)?)\s*[:：]\s*(.+)$/i,
  },
  { field: 'linkedinUrl', pattern: /^linkedin\s*[:：]\s*(.+)$/i },
]

type Section =
  | 'none'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'interests'

const SECTION_PATTERNS: Array<{ section: Section; pattern: RegExp }> = [
  { section: 'summary', pattern: /^(?:(?:\/\/\s*)?(?:profil|résumé|resume|summary|à propos|about me?|vision\s*(?:&|et)\s*leadership))\s*:?\s*$/i },
  {
    section: 'experience',
    pattern:
      /^(?:(?:\/\/\s*)?(?:stages?\s*(?:&|et)\s*)?(?:résultats?\s*(?:&|et)\s*)?)?(?:expériences?(?:\s+(?:professionnelles?|internationales?))?|experiences?(?:\s+(?:professionnelles?|internationales?))?|expérience(?:\s+internationale)?|experience|parcours exécutif|parcours professionnel|employment|work history|professional experience)\s*:?\s*$/i,
  },
  {
    section: 'education',
    pattern:
      /^(?:(?:\/\/\s*)?)?(?:formations?|éducation|education|diplômes?|diplomes?|études(?:\s+et\s+diplômes?)?|etudes(?:\s+et\s+diplomes?)?|scolarité|scolarite)\s*:?\s*$/i,
  },
  {
    section: 'skills',
    pattern:
      /^(?:(?:\/\/\s*)?)?(?:compétences?(?:\s+techniques?)?|competences?(?:\s+techniques?)?|expertises?|skills|savoir-faire|stack)\s*:?\s*$/i,
  },
  { section: 'languages', pattern: /^(?:(?:\/\/\s*)?)?(?:langues?|languages?|idiomes?)\s*:?\s*$/i },
  {
    section: 'certifications',
    pattern: /^(?:(?:\/\/\s*)?)?(?:certifications?|attestations?|certificats?|habilitations?|licences)\s*:?\s*$/i,
  },
  { section: 'interests', pattern: /^(?:centres?\s+d['']intérêt|interests?|loisirs|hobbies)\s*:?\s*$/i },
]

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\d{4}/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Replie un texte qui est exactement 2 ou 3 répétitions d'une même base, sans
 * séparateur (artefact fréquent des PDF où un titre est surimprimé pour simuler
 * le gras/l'ombre → « ExpériencesExpériencesExpériences »). Très conservateur :
 * n'agit que sur une répétition EXACTE d'une base d'au moins 3 caractères.
 */
export function collapseRepeatedString(value: string): string {
  const s = value.trim()
  for (const k of [3, 2]) {
    if (s.length % k !== 0) continue
    const base = s.slice(0, s.length / k)
    if (base.length >= 3 && base.repeat(k) === s) return base
  }
  return value
}

export function cleanLine(line: string): string {
  const collapsed = collapseRepeatedString(line.trim())
  return collapsed
    // Puce issue d'une police Symbol/Wingdings (zone à usage privé, ex. U+F0B7) en
    // tête de ligne : invisible à l'affichage, mais elle colle au 1er mot et fausse
    // l'extraction (« Langages : … »). On la retire.
    .replace(/^[\uE000-\uF8FF]+\s*/, '')
    // Caractères invisibles (zero-width, BOM) → supprimés.
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Parenthèses vidées de leur contenu (souvent une date déjà extraite,
    // ex. « Intech Group () » → « Intech Group ») : on les supprime.
    .replace(/\(\s*\)/g, ' ')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\s*[—–-]\s*$/, '')
    .trim()
}

function preprocessRawText(rawText: string): string {
  let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  text = text.replace(/(\d)\s+(?=(?:[èe]me|[èe]re|ère))/gi, '$1')

  const sectionHeaders = [
    'CURRICULUM VITAE',
    'EXPERIENCES PROFESSIONNELLES',
    'EXPÉRIENCES PROFESSIONNELLES',
    'STAGES & EXPÉRIENCES',
    'STAGES ET EXPÉRIENCES',
    'EXPÉRIENCE INTERNATIONALE',
    'PARCOURS EXÉCUTIF',
    'PARCOURS EXECUTIF',
    'RÉSULTATS & EXPÉRIENCE',
    'VISION & LEADERSHIP',
    'EXPERTISES',
    'CENTRES D\'INTÉRÊT',
    'CENTRES D\'INTERET',
    '// EXPÉRIENCE',
    '// FORMATION',
    '// STACK',
    '// CERTIFICATIONS',
    'EXPÉRIENCE',
    'EXPERIENCE',
    'ETUDES ET DIPLOMES',
    'ÉTUDES ET DIPLOMES',
    'FORMATIONS',
    'FORMATION',
    'COMPETENCES',
    'COMPÉTENCES',
    'LANGUES',
    'LOISIRS',
    'CERTIFICATIONS',
    'PROFIL',
  ]

  // Détache un en-tête de section collé en fin de ligne (ex. "...professionnelle\nEXPÉRIENCE").
  // Sensible à la casse : les vrais en-têtes sont en MAJUSCULES, ce qui évite de couper
  // des intitulés comme "2ème année de Formation" ou "Formation accélérée".
  for (const header of sectionHeaders) {
    text = text.replace(new RegExp(`([^\\n])\\s+(${header})\\s*(?=\\n|$)`, 'g'), '$1\n$2')
  }

  text = text.replace(/([^\n])\s+(?=\d{4}\s*[-–—]\s*\d{4}\s*[:：])/g, '$1\n')
  text = text.replace(
    /([^\n])\s+(?=(?:prénom|prenom|nom(?:\s*(?:&|et)\s*nom)?|adresse|tel|tél|téléphone|email|e-mail|courriel)\s*[:：])/gi,
    '$1\n',
  )

  return text.replace(/\n{3,}/g, '\n\n').trim()
}

function startsNewEntry(line: string): boolean {
  if (detectSection(line)) return true
  if (isLabeledContactLine(line)) return true
  if (isContactLine(line)) return true
  if (isBulletLine(line)) return true
  if (isEducationEntryLine(line)) return true
  if (isYearPeriodLine(line)) return true
  if (/^\d{4}\s*[-–—]\s*\d{4}/.test(line)) return true
  if (parseExperienceLine(line)) return true
  return false
}

const EDUCATION_ENTRY_RE = /^\d{4}\s*[-–—]\s*\d{4}\s*[:：]/i

const EDUCATION_KEYWORDS_RE =
  /(?:formation|baccalauréat|baccalaureat|\bbac\b|bfem|master|licence|diplôme|diplome|année|annee|lycée|lycee|université|universite|école|ecole|ensup|institut|faculté|faculte|campus|grade|certificat|scolarité|scolarite)/i

const EXPERIENCE_KEYWORDS_RE =
  /\b(?:assistant|assistante|chargé|chargée|directeur|directrice|commercial|développeur|developpeur|manager|conseiller|conseillère|technicien|responsable|chef de|chef du)\b/i

function experienceEntryContent(line: string): string {
  return cleanLine(line).replace(/^\d{4}\s*[-–—]\s*\d{4}\s*[:：]\s*/i, '')
}

function isExperienceEntryLine(line: string): boolean {
  if (!EDUCATION_ENTRY_RE.test(cleanLine(line))) return false
  const content = experienceEntryContent(line)

  if (/\bchez\b/i.test(content)) return true
  if (/\b(?:stagiaire|stage en|alternance|cdd|cdi|intérim|interim)\b/i.test(content)) return true
  if (EDUCATION_KEYWORDS_RE.test(content)) return false
  if (EXPERIENCE_KEYWORDS_RE.test(content)) return true
  // Intitulé de métier daté sans entreprise (« 2024 - 2025 : Plombier ») : fréquent
  // sur les CV de métiers manuels où le poste se répète d'une période à l'autre.
  if (JOB_TITLE_HINT_RE.test(content)) return true

  return false
}

export function isEducationEntryLine(line: string): boolean {
  if (!EDUCATION_ENTRY_RE.test(cleanLine(line))) return false
  if (isExperienceEntryLine(line)) return false
  return EDUCATION_KEYWORDS_RE.test(experienceEntryContent(line))
}

function normalizeYear(value?: string): string | undefined {
  if (!value) return undefined
  const match = value.match(/\d{4}/)
  return match?.[0]
}

function normalizeOrdinalText(value: string): string {
  return value
    .replace(/(\d)\s+(?=(?:[èe]me|[èe]re|ère))/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function isGarbageDegree(degree: string): boolean {
  const normalized = normalizeText(degree)
  if (!normalized || normalized.length < 4) return true
  if (/^(\d\s*)?[eme]+$/.test(normalized)) return true
  if (/^(et|assurance|dakar)$/.test(normalized)) return true
  return false
}

function splitDegreeAndInstitution(degree: string, institution = ''): { degree: string; institution: string } {
  let normalizedDegree = normalizeOrdinalText(degree)
  let normalizedInstitution = institution.trim()

  if (!normalizedInstitution) {
    const auMatch = normalizedDegree.match(/^(.+?)\s+(?:à|a|au)\s+(.+)$/i)
    if (auMatch) {
      normalizedDegree = auMatch[1]!.trim()
      normalizedInstitution = auMatch[2]!.trim()
    }
  }

  if (!normalizedInstitution && /\s(?:à|a|au)\s/i.test(normalizedDegree)) {
    const parts = normalizedDegree.split(/\s+(?:à|a|au)\s+/i)
    if (parts.length >= 2) {
      normalizedDegree = parts.slice(0, -1).join(' au ').trim()
      normalizedInstitution = parts[parts.length - 1]!.trim()
    }
  }

  return { degree: normalizedDegree, institution: normalizedInstitution }
}

function splitDegreeAndField(degree: string, field = ''): { degree: string; field: string } {
  const normalizedDegree = degree.trim()
  const trimmedField = field.trim()
  if (trimmedField) return { degree: normalizedDegree, field: trimmedField }
  if (/\s+et$/i.test(normalizedDegree)) return { degree: normalizedDegree, field: '' }

  const formationMatch = normalizedDegree.match(/^(.+\bFormation)\s+en\s+(.+)$/i)
  if (formationMatch?.[2]?.trim()) {
    return { degree: formationMatch[1]!.trim(), field: formationMatch[2]!.trim() }
  }

  const enMatch = normalizedDegree.match(/^(.+?)\s+en\s+(.+)$/i)
  if (enMatch?.[2]?.trim() && enMatch[2].trim().length >= 3) {
    return { degree: enMatch[1]!.trim(), field: enMatch[2]!.trim() }
  }

  const bacMatch = normalizedDegree.match(/^Baccalauréat\s+(\S+)/i)
  if (bacMatch?.[1]) return { degree: normalizedDegree, field: bacMatch[1] }

  if (/^BFEM$/i.test(normalizedDegree)) return { degree: normalizedDegree, field: 'Secondaire' }

  return { degree: normalizedDegree, field: '' }
}

export function finalizeEducationEntry(entry: ResumeSnapshot['educations'][number]): ResumeSnapshot['educations'][number] | null {
  const split = splitDegreeAndInstitution(entry.degree ?? '', entry.institution ?? '')
  if (isGarbageDegree(split.degree)) return null

  const { degree, field } = splitDegreeAndField(split.degree, entry.field ?? '')

  return {
    ...entry,
    degree,
    institution: split.institution,
    field,
    startDate: normalizeYear(entry.startDate),
    endDate: normalizeYear(entry.endDate),
  }
}

export function parseEducationEntryLine(line: string): ResumeSnapshot['educations'][number] | null {
  if (!isEducationEntryLine(line)) return null

  const { startDate, endDate, rest } = parseDateRange(line)
  const content = normalizeOrdinalText(cleanLine(rest).replace(/^:\s*/, ''))
  if (!content) return null

  const split = splitDegreeAndInstitution(content)
  return finalizeEducationEntry({
    degree: split.degree,
    institution: split.institution,
    startDate,
    endDate,
  })
}

function appendEducationContinuation(
  entry: ResumeSnapshot['educations'][number],
  line: string,
): ResumeSnapshot['educations'][number] {
  const chunk = normalizeOrdinalText(cleanLine(line))
  const combined = normalizeOrdinalText([entry.degree, entry.field, chunk].filter(Boolean).join(' '))
  const split = splitDegreeAndInstitution(combined, entry.institution ?? '')
  return {
    ...entry,
    degree: split.degree,
    institution: split.institution || entry.institution,
    field: '',
  }
}

function isWrappedContinuation(previous: string, line: string): boolean {
  if (!previous || !line) return false
  // Connecteur en suspens en fin de ligne précédente (« … Banque Finance et ») :
  // elle est incomplète, la ligne suivante la complète forcément — même si celle-ci
  // ressemble à une nouvelle entrée (« Assurance à ENSUP » lue à tort « poste à employeur »).
  if (
    /\s+(?:et|de|du|des|en|pour|avec|sur)$/i.test(cleanLine(previous)) &&
    !classifyHeading(line) &&
    !detectSection(line)
  ) {
    return true
  }
  if (startsNewEntry(line)) return false
  // Ne jamais fusionner un titre de section dans la ligne précédente
  // (ex. « À propos de moi » commence par « à » mais reste un titre).
  if (classifyHeading(line)) return false
  // Ni une ligne qui commence par une plage de dates : c'est une nouvelle
  // entrée datée (ex. « de Mai 2024 à Juin 2024  Aide Soignante »), pas une
  // continuation — même si elle débute par « de »/« d' ».
  if (DATE_RANGE_START_RE.test(cleanLine(line))) return false
  if (detectSection(previous)) return false
  if (isEducationEntryLine(line)) return false

  const cleanedPrevious = cleanLine(previous)
  if (/^\d{4}\s*[-–—]\s*\d{4}\s*[:：]/i.test(cleanedPrevious) && parseExperienceLine(previous)) {
    return false
  }

  // Ligne précédente finissant par un ordinal isolé (« … : 2ème », « 1ère ») :
  // le libellé du diplôme a été coupé par un retour à la ligne, la suite
  // (« année de Formation … ») est une continuation. Fréquent sur les CV scannés.
  if (/\b\d{1,2}\s*(?:ème|eme|ère|ere|er|e)$/i.test(cleanedPrevious)) return true

  const previousIsEducationEntry = isEducationEntryLine(previous)
  if (previousIsEducationEntry || /\s+et$/i.test(previous) || /\s+de$/i.test(previous)) {
    if (/\s+et$/i.test(previous)) return true
    if (/^\d{1,2}$/.test(cleanedPrevious.split(/\s+/).pop() ?? '') && /^(?:[èe]me|[èe]re|ère|année|annee)/i.test(line)) {
      return true
    }
    if (/^(?:[èe]me|[èe]re|ère|année|annee|assurance|dakar)/i.test(line)) return true
    if (/^(?:et|ou|à|a|de|du|des|en|pour|avec)\s/i.test(line)) return true
    if (/\s+de$/i.test(previous) && /^[A-ZÀ-Ÿ]/.test(line) && line.length <= 40) return true
    if (/^[a-zàâäéèêëïîôùûüç]/.test(line) && !/^(chez|stage|email|tel)/i.test(line)) return true
    return false
  }

  if (/^(?:et|ou|à|a|de|du|des|en|pour|avec)\s/i.test(line)) return true
  return false
}

function mergeWrappedLines(lines: string[]): string[] {
  const merged: string[] = []

  for (const line of lines) {
    const previous = merged[merged.length - 1]
    if (previous && isWrappedContinuation(previous, line)) {
      merged[merged.length - 1] = `${previous} ${line}`
      continue
    }
    merged.push(line)
  }

  return merged
}

function trySplitTwoColumnLineRaw(line: string): string[] {
  const trimmed = line.trim()
  if (trimmed.length < 12) return [trimmed]

  if (/[^\S\n]{2,}/.test(trimmed)) {
    const parts = trimmed.split(/[^\S\n]{2,}/).map((part) => part.trim()).filter(Boolean)
    if (parts.length >= 2) return parts
  }

  if (/\t/.test(trimmed)) {
    return trimmed.split(/\t/).map((part) => part.trim()).filter(Boolean)
  }

  const dualHeader = trimmed.match(/^(.*\bexpériences?\b.*)\s{2,}(.*\bformations?\b.*)$/i)
  if (dualHeader) return [dualHeader[1]!.trim(), dualHeader[2]!.trim()]

  const eduSplit = trimmed.search(
    /\s+(?=(?:\d{1,2}(?:ère|ere|ème|eme)\s|formation\b|licence\b|master\b|baccalauréat\b|baccalaureat\b|bfem\b|diplôme\b|diplome\b))/i,
  )
  if (eduSplit > 12) {
    return [trimmed.slice(0, eduSplit).trim(), trimmed.slice(eduSplit).trim()]
  }

  const datePairSplit = trimmed.match(
    /^(.+?\d{4}\s*[–—-]\s*(?:\d{4}|présent|present))\s+(\d{4}\s*[–—-]\s*(?:\d{4}|présent|present))$/i,
  )
  if (datePairSplit) {
    return [datePairSplit[1]!.trim(), datePairSplit[2]!.trim()]
  }

  return [trimmed]
}

function splitInterleavedLines(lines: string[]): string[] {
  return lines.flatMap(trySplitTwoColumnLineRaw)
}

function demuxTwoColumnLines(rawLines: string[]): string[] {
  const output: string[] = []
  let leftColumn: string[] = []
  let rightColumn: string[] = []
  let inTwoColumn = false

  const flushColumns = () => {
    if (leftColumn.length === 0 && rightColumn.length === 0) return
    output.push('EXPÉRIENCE', ...leftColumn)
    output.push('FORMATION', ...rightColumn)
    leftColumn = []
    rightColumn = []
    inTwoColumn = false
  }

  for (const raw of rawLines) {
    const parts = trySplitTwoColumnLineRaw(raw)
    const left = parts[0]?.trim() ?? ''
    const right = parts[1]?.trim() ?? ''

    if (parts.length === 2 && left.length >= 3 && right.length >= 3) {
      const leftHeader = detectSection(cleanLine(left))
      const rightHeader = detectSection(cleanLine(right))
      if (leftHeader === 'experience' && rightHeader === 'education') {
        flushColumns()
        inTwoColumn = true
      continue
    }

      if (inTwoColumn) {
        leftColumn.push(cleanLine(left))
        rightColumn.push(cleanLine(right))
      continue
      }
    }

    if (inTwoColumn) {
      const cleaned = cleanLine(raw.trim())
      if (looksLikeEducationDegree(cleaned) || (EDUCATION_KEYWORDS_RE.test(cleaned) && !looksLikeExperienceTitle(cleaned))) {
        rightColumn.push(cleaned)
      } else {
        leftColumn.push(cleaned)
      }
      continue
    }

    flushColumns()
    output.push(cleanLine(raw.trim()))
  }

  flushColumns()
  return output.filter(Boolean)
}

export function normalizeLines(rawText: string): string[] {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rawLines = normalized.split('\n').filter((line) => line.trim())
  const demuxed = demuxTwoColumnLines(rawLines)
  const preprocessed = preprocessRawText(demuxed.join('\n'))
  const lines = preprocessed.split('\n').map((line) => cleanLine(line)).filter(Boolean)

  return mergeWrappedLines(lines)
}

export function detectSection(line: string): Section | null {
  const cleaned = cleanLine(line).replace(/^\/\/\s*/, '')
  if (cleaned.length > 80) return null

  for (const { section, pattern } of SECTION_PATTERNS) {
    if (pattern.test(cleaned)) return section
  }

  const loose = normalizeText(cleaned)
  if (/^etudes et diplomes?$/.test(loose)) return 'education'
  if (/^vision et leadership$/.test(loose)) return 'summary'
  if (/^parcours executif$/.test(loose)) return 'experience'
  if (/^experience internationale$/.test(loose)) return 'experience'
  if (/^resultats?\s+experiences?$/.test(loose)) return 'experience'
  if (/^stages?\s+experiences?$/.test(loose)) return 'experience'
  if (/^experiences?( professionnelles?)?$/.test(loose)) return 'experience'
  if (/^experience$/.test(loose)) return 'experience'
  if (/^formations?$/.test(loose)) return 'education'
  if (/^competences?( techniques?)?$/.test(loose)) return 'skills'
  if (/^expertises?$/.test(loose)) return 'skills'
  if (/^stack$/.test(loose)) return 'skills'
  if (/^langues?$/.test(loose)) return 'languages'
  if (/^loisirs$/.test(loose)) return 'interests'
  if (/^centres? d interet$/.test(loose)) return 'interests'

  return null
}

export function isContactLine(line: string): boolean {
  const cleaned = cleanLine(line)
  if (isLabeledContactLine(cleaned)) return false
  if (/^\d{4}\s*[-–—]\s*\d{4}/.test(cleaned)) return false
  if (isYearPeriodLine(cleaned)) return false
  if (detectSection(cleaned)) return false
  if (EMAIL_RE.test(cleaned) && cleaned.length < 80) return true
  if (URL_RE.test(cleaned)) return true
  if (/^\+?[\d\s().-]{8,24}$/.test(cleaned)) return true
  return false
}

function isLabeledContactLine(line: string): boolean {
  return LABELED_LINE_RE.test(line) && /[:：]/.test(line)
}

function parseLabeledPersonalInfo(lines: string[]): ResumeSnapshot['personalInfo'] {
  const info: ResumeSnapshot['personalInfo'] = {}
  let nom: string | undefined
  let prenom: string | undefined

  // Les libellés sont sans ambiguïté : on scanne large (jusqu'à 120 lignes) car
  // sur une mise en page deux colonnes, la barre latérale « Nom : / Prénom : »
  // peut arriver tard dans le texte reconstruit.
  for (const line of lines.slice(0, 120)) {
    const nomMatch = line.match(/^nom\s*[:：]\s*(.+)$/i)
    if (nomMatch?.[1]?.trim() && !nom && !/^(adresse|tel|email)/i.test(nomMatch[1].trim())) {
      nom = nomMatch[1].trim()
    }
    const prenomMatch = line.match(/^pr[ée]nom\s*[:：]\s*(.+)$/i)
    if (prenomMatch?.[1]?.trim() && !prenom) prenom = prenomMatch[1].trim()

    for (const { field, pattern } of LABELED_FIELDS) {
      const match = line.match(pattern)
      if (!match?.[1]?.trim()) continue
      const value = match[1].trim()
      if (field === 'email' && !EMAIL_RE.test(value)) continue
      if (field === 'fullName' && /^(adresse|tel|email)/i.test(value)) continue
      if (!info[field]) info[field] = value
    }
  }

  // Nom + Prénom séparés → nom complet « Prénom Nom ».
  if (!info.fullName && (nom || prenom)) {
    info.fullName = [prenom, nom].filter(Boolean).join(' ')
  }

  return info
}

export function isBulletLine(line: string): boolean {
  return /^[-•●▪*]\s+/.test(line)
}

const TEMPLATE_FOOTER_RE =
  /^.+?\s*[—–-]\s*profilo['']z$/i

export function isTemplateFooter(line: string): boolean {
  const cleaned = cleanLine(line)
  return cleaned.length <= 45 && TEMPLATE_FOOTER_RE.test(cleaned)
}

export function looksLikeLocation(line: string): boolean {
  const cleaned = cleanLine(line)
  if (cleaned.length > 55 || cleaned.length < 3) return false
  if (isDateOnlyLine(cleaned)) return false
  if (EMAIL_RE.test(cleaned) || PHONE_RE.test(cleaned)) return false
  if (/\bchez\b/i.test(cleaned)) return false
  if (EXPERIENCE_KEYWORDS_RE.test(cleaned)) return false

  if (
    /^[A-ZÀ-Ÿ][\wàâäéèêëïîôùûüç'’-]+(?:\s*[—–]\s*[A-ZÀ-Ÿ][\wàâäéèêëïîôùûüç'’-]+)+$/.test(cleaned) &&
    cleaned.length <= 45
  ) {
    return true
  }

  if (cleaned.length <= 35 && /\b(?:dakar|rufisque|diamniadio|ouakam|paris|abidjan|thies|thiès)\b/i.test(cleaned)) {
    return true
  }

  return false
}

export function looksLikeExperienceTitle(line: string): boolean {
  const cleaned = cleanLine(line)
  if (cleaned.length < 4 || cleaned.length > 90) return false
  if (isDateOnlyLine(cleaned)) return false
  if (detectSection(cleaned)) return false
  if (isContactLine(cleaned) || isTemplateFooter(cleaned)) return false
  if (PERSONAL_INFO_LABEL_RE.test(cleaned)) return false
  if (EDUCATION_KEYWORDS_RE.test(cleaned) && !EXPERIENCE_KEYWORDS_RE.test(cleaned)) return false
  // Une description / énumération (virgule + plusieurs mots) ou une phrase longue
  // (> 7 mots) est une mission, pas un intitulé de poste.
  const titleWordCount = cleaned.split(/\s+/).length
  if (titleWordCount > 7) return false
  if (/,/.test(cleaned) && titleWordCount > 4) return false

  if (
    /^(?:stage|stagiaire|consultant|consultante|chargé|chargée|assistant|assistante|conseill|gérant|gérante|communicat|directeur|directrice|commercial|technicien|responsable|chef|developpeur|développeur|comptable|manager|ingénieur|ingenieur)/i.test(
      cleaned,
    )
  ) {
    return true
  }

  if (/^[a-zàâäéèêëïîôùûüç]/.test(cleaned)) return false
  if (
    /\b(?:de la|des |du |d[''']|pour |avec |en |sur |par )\b/i.test(cleaned) &&
    !/^(?:stage|stagiaire|chargé|chargée|assistant|assistante|conseill|gérant|gérante|communicat)/i.test(cleaned)
  ) {
    return false
  }

  if (/^[A-ZÀ-Ÿ]/.test(cleaned) && !looksLikeLocation(cleaned) && !/^\d/.test(cleaned)) {
    if (EDUCATION_KEYWORDS_RE.test(cleaned)) return false
    const wordCount = cleaned.split(/\s+/).length
    if (wordCount <= 4 && !EXPERIENCE_KEYWORDS_RE.test(cleaned)) return false
    return true
  }

  return false
}

function applyExperienceBlockLine(
  entry: ResumeSnapshot['experiences'][number],
  line: string,
): ResumeSnapshot['experiences'][number] {
  const cleaned = cleanLine(line)

  if (isDateOnlyLine(cleaned)) {
    const dates = parseDateRange(cleaned)
    return {
      ...entry,
      startDate: entry.startDate || dates.startDate,
      endDate: entry.endDate || dates.endDate,
      isCurrent: entry.isCurrent || dates.isCurrent,
    }
  }

  if (!entry.position) {
    return { ...entry, position: cleaned }
  }

  if (!entry.company && !looksLikeLocation(cleaned) && !looksLikeEducationDegree(cleaned)) {
    return { ...entry, company: cleaned }
  }

  if (!entry.location && looksLikeLocation(cleaned)) {
    return { ...entry, location: cleaned }
  }

  if (!entry.company) {
    return { ...entry, company: cleaned }
  }

  return {
    ...entry,
    description: [entry.description, cleaned].filter(Boolean).join('\n'),
  }
}

export function stripBullet(line: string): string {
  return line.replace(/^[-•●▪*]\s+/, '').trim()
}

function isYearPeriodLine(line: string): boolean {
  const cleaned = cleanLine(line)
  return /^\d{4}\s*\D{1,5}\s*(\d{4}|présent|present|aujourd['']hui|current)$/i.test(cleaned)
}

export function isDateOnlyLine(line: string): boolean {
  const cleaned = cleanLine(line)
  if (isYearPeriodLine(cleaned)) return true

  const match = cleaned.match(DATE_RANGE_RE)
  if (!match) return false

  const rest = cleaned.replace(match[0], '').replace(/^[\s,;:–—-]+|[\s,;:–—-]+$/g, '').trim()
  return rest.length === 0
}

function fixDateOrder(startDate?: string, endDate?: string): { startDate?: string; endDate?: string } {
  if (!startDate || !endDate) return { startDate, endDate }
  const startYear = Number.parseInt(startDate.replace(/\D/g, '').slice(-4), 10)
  const endYear = Number.parseInt(endDate.replace(/\D/g, '').slice(-4), 10)
  if (Number.isNaN(startYear) || Number.isNaN(endYear) || startYear <= endYear) {
    return { startDate, endDate }
  }
  return { startDate: endDate, endDate: startDate }
}

export function parseDateRange(line: string): { startDate?: string; endDate?: string; isCurrent?: boolean; rest: string } {
  const cleaned = cleanLine(line)
  const yearPeriod = cleaned.match(/^(\d{4})\s*\D{1,5}\s*(\d{4}|présent|present|aujourd['']hui|current)$/i)
  if (yearPeriod) {
    const endRaw = yearPeriod[2]?.toLowerCase() ?? ''
    const isCurrent = /présent|present|current|aujourd/.test(endRaw)
    const fixed = fixDateOrder(yearPeriod[1], isCurrent ? undefined : yearPeriod[2])
    return { startDate: fixed.startDate, endDate: fixed.endDate, isCurrent, rest: '' }
  }

  const match = cleaned.match(DATE_RANGE_RE) ?? cleaned.match(YEAR_RANGE_RE)
  if (!match) return { rest: line }

  const startDate = match[1]
  const endRaw = match[2]?.toLowerCase() ?? ''
  const isCurrent = /présent|present|current|aujourd/.test(endRaw)
  const endDate = isCurrent ? undefined : match[2]
  const fixed = fixDateOrder(startDate, endDate)
  const rest = line.replace(match[0], '').replace(/^[\s,;:–—-]+|[\s,;:–—-]+$/g, '').trim()
  return { startDate: fixed.startDate, endDate: fixed.endDate, isCurrent, rest }
}

export function parseExperienceLine(line: string): ResumeSnapshot['experiences'][number] | null {
  if (detectSection(line)) return null
  // Ligne de date seule (« 2021-2024 » mais aussi « Janvier 2021 - Présent ») :
  // ce n'est pas une expérience. Garde indispensable depuis que le tiret simple
  // est un séparateur rôle/entreprise, sinon « Janvier 2021 - Présent » serait lu
  // comme poste=« Janvier 2021 », entreprise=« Présent ».
  if (isDateOnlyLine(line)) return null

  const { startDate, endDate, isCurrent, rest } = parseDateRange(line)
  let content = cleanLine(rest || line).replace(/^:\s*/, '')

  if (!rest && looksLikeLocation(line)) return null
  if (rest && looksLikeLocation(content)) return null

  const chezMatch = content.match(
    /^(.+?)\s+(?:chez|at|@|à l['']|à la |à)\s+(.+?)(?:\s*[—–-]\s*)?$/i,
  )
  if (chezMatch) {
    let company = chezMatch[2]!.trim()
    let description: string | undefined
    const companySplit = company.match(/^(.+?)\s+(?=(?:gestion|organisation|développement|developpement|mise|suivi|animation|accueil|conseil|support|participation|coordination|administration|assistance)\b)/i)
    if (companySplit) {
      description = company.slice(companySplit[1]!.length).trim()
      company = companySplit[1]!.trim()
    }

    return {
      position: chezMatch[1]!.trim(),
      company,
      description,
      startDate,
      endDate,
      isCurrent,
    }
  }

  // Séparateur rôle/entreprise : tiret long OU tiret simple ENTOURÉ d'espaces
  // (« Développeuse Full-stack - Intech Group »). Les espaces sont requis pour ne
  // pas couper un mot composé (« Full-stack », « sous-traitant »).
  const roleCompanyMatch = content.match(/^(.+?)\s+[—–-]\s+(.+?)(?:\s+\d{4}\s*[-–—].*)?$/i)
  if (roleCompanyMatch && !looksLikeLocation(content)) {
    const position = roleCompanyMatch[1]!.trim()
    const company = roleCompanyMatch[2]!
      .replace(/\s*\d{4}\s*[-–—]\s*(\d{4}|présent|present).*$/i, '')
      .trim()
    if (position.length >= 3 && company.length >= 2) {
      return { position, company, startDate, endDate, isCurrent }
    }
  }

  const pipeParts = content.split(/\s*[|•]\s*/).map((part) => part.trim()).filter(Boolean)
  if (pipeParts.length >= 2) {
    const [first, second, third] = pipeParts
    if (first && second) {
      return { position: first, company: second, startDate: third ?? startDate, endDate, isCurrent }
    }
  }

  return null
}

export function parseEducationLine(line: string): ResumeSnapshot['educations'][number] | null {
  if (detectSection(line)) return null
  if (isExperienceEntryLine(line)) return null

  const entry = parseEducationEntryLine(line)
  if (entry) return entry

  const { startDate, endDate, rest } = parseDateRange(line)
  const content = normalizeOrdinalText(cleanLine(rest || line).replace(/^:\s*/, ''))
  if (content.length < 4 || content.length > 200 || isGarbageDegree(content)) return null

  const atInstitution = content.match(/^(.+?)\s+(?:à|a|au)\s+(.+)$/i)
  if (atInstitution) {
    return finalizeEducationEntry({
      degree: atInstitution[1]!.trim(),
      institution: atInstitution[2]!.trim(),
      startDate,
      endDate,
    })
  }

  const parts = content.split(/\s*[|•–—,]\s*|\s+-\s+/).map((part) => part.trim()).filter(Boolean)
      if (parts.length >= 2) {
    const [first, second, third] = parts
    const degreeLike =
      /(master|licence|bachelor|bts|dut|doctorat|mba|ingénieur|ingenieur|bac|diplôme|diplome|certificat|formation|année|annee|bfem)/i
    if (degreeLike.test(first!)) {
      return finalizeEducationEntry({
        degree: first!,
        institution: second!,
        field: third,
        startDate,
        endDate,
      })
    }
    if (degreeLike.test(second!)) {
      return finalizeEducationEntry({
        institution: first!,
        degree: second!,
        field: third,
        startDate,
        endDate,
      })
    }
    return finalizeEducationEntry({
      degree: first!,
      institution: second ?? '',
      field: third,
      startDate,
      endDate,
    })
  }

  return finalizeEducationEntry({
    degree: content,
        institution: '',
    startDate,
    endDate,
  })
}

function parseSkillTokens(line: string): ResumeSnapshot['skills'] {
  const cleaned = stripBullet(line)
  const tokens = cleaned.includes(',') ? cleaned.split(',') : cleaned.split(/\s{2,}| · /)

  return tokens
    .map((name) => name.trim())
    .filter((name) => name.length >= 2 && name.length <= 60)
    .map((name) => ({ name }))
}

function parseLanguageLine(line: string): ResumeSnapshot['languages'][number] | null {
  const cleaned = stripBullet(line).replace(/^✓\s*/, '')
  const match = cleaned.match(/^(.+?)\s*(?:[:：]|[-–—])\s*(.+)$/i)
  if (match) {
    const name = match[1]!.trim()
    if (name.length >= 2 && name.length <= 30) {
      return { name, level: undefined }
    }
  }
  if (cleaned.length >= 2 && cleaned.length <= 40 && !isLabeledContactLine(cleaned)) {
    return { name: cleaned }
  }
  return null
}

function parseInterestLine(line: string): ResumeSnapshot['interests'][number] | null {
  const cleaned = stripBullet(line).replace(/^✓\s*/, '').trim()
  if (!cleaned || cleaned.length > 80) return null
  if (/^sport\s*[:：]\s*/i.test(cleaned)) {
    return { name: `Sport — ${cleaned.replace(/^sport\s*[:：]\s*/i, '').trim()}` }
  }
  return { name: cleaned }
}

function parseCertificationLine(line: string): ResumeSnapshot['certifications'][number] | null {
  const cleaned = stripBullet(line)
  if (cleaned.length < 3 || cleaned.length > 160) return null
  const { startDate, rest } = parseDateRange(cleaned)
  const parts = (rest || cleaned).split(/\s*[-–—|]\s*/).map((part) => part.trim()).filter(Boolean)
  return {
    name: parts[0] ?? cleaned,
    issuer: parts[1],
    issueDate: startDate,
  }
}

/** Un mot isolé qui ressemble à un fragment de nom (« Dieynaba », « CAMARA »). */
function isNameToken(value: string): boolean {
  const word = value.trim()
  if (word.length < 2 || word.length > 30) return false
  return /^[A-ZÀ-Ÿ][a-zà-ÿ'’-]+$/.test(word) || /^[A-ZÀ-Ÿ][A-ZÀ-Ÿ'’-]+$/.test(word)
}

/**
 * Vrai « Prénom Nom » : 2 à 5 mots, chacun ressemblant à un fragment de nom
 * (capitalisé, MAJUSCULES, ou initiale). Exclut les listes techniques
 * (« Vue.js, Node.js ») et les phrases (présence de virgule/point/connecteur).
 */
function isStrictPersonName(line: string): boolean {
  const c = cleanLine(line)
  if (c.length < 4 || c.length > 55) return false
  if (/[,;]/.test(c) || /\.\w/.test(c)) return false
  const words = c.split(/\s+/)
  if (words.length < 2 || words.length > 5) return false
  return words.every(
    (word) =>
      /^[A-ZÀ-Ÿ][a-zàâäéèêëïîôùûüç'’-]+$/.test(word) ||
      /^[A-ZÀ-Ÿ]{2,}$/.test(word) ||
      /^[A-ZÀ-Ÿ]\.?$/.test(word),
  )
}

/**
 * Sépare une ligne « Prénom Nom — Intitulé de poste », motif très courant des CV
 * modernes (ex. « Seynabou DIENG - Développeuse Full-stack »). La gauche doit être
 * un nom strict SANS mot-clé métier, la droite doit contenir un mot-clé métier —
 * sinon on ne coupe pas (évite de massacrer « Banque Finance - Assurance »).
 */
function splitNameTitleLine(line: string): { name: string; title: string } | null {
  const c = cleanLine(line)
  const match = c.match(/^(.+?)\s+[-–—|]\s+(.+)$/)
  if (!match) return null
  const left = match[1]!.trim()
  const right = match[2]!.trim()
  if (
    isStrictPersonName(left) &&
    !JOB_TITLE_HINT_RE.test(left) &&
    right.length >= 3 &&
    right.length <= 60 &&
    JOB_TITLE_HINT_RE.test(right)
  ) {
    return { name: left, title: right }
  }
  return null
}

function detectFullName(lines: string[]): string | undefined {
  const head = lines.slice(0, 12)

  // 0) Ligne « Nom — Poste » : la partie gauche est le nom.
  for (const line of head) {
    const split = splitNameTitleLine(line)
    if (split) return split.name
  }

  // 1er passage : nom « strict » (capitalisation propre, sans mot-clé de poste).
  // 2e passage (repli) : on tolère davantage, pour ne pas laisser le nom vide.
  for (const strict of [true, false]) {
    for (let i = 0; i < head.length; i++) {
      const line = head[i]!
      if (line.length < 4 || line.length > 60) {
        // Nom éclaté sur deux lignes (« Dieynaba » / « CAMARA ») : on les fusionne
        // si les deux lignes consécutives sont des mots isolés de type nom.
        if (isNameToken(line)) {
          const next = head[i + 1]
          if (next && isNameToken(next) && !detectSection(next)) {
            return `${line} ${next}`.trim()
          }
        }
        continue
      }
      if (EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line)) continue
      if (SKIP_NAME_RE.test(line)) continue
      if (isLabeledContactLine(line)) continue
      if (/^(adresse|tel|tél|email|e-mail|prénom|prenom|nom)\s*[:：]/i.test(line)) continue
      if (/^\d/.test(line)) continue
      if (detectSection(line) || classifyHeading(line)) continue
      // Rejette les listes de compétences / lignes techniques (« Vue.js, Node.js »).
      if (/[,;]/.test(line) || /\.\w/.test(line)) continue
      if (JOB_TITLE_HINT_RE.test(line)) continue
      // Un nom d'organisation (« Rajab Business », « Immo-Négoce ») n'est pas un nom
      // de personne : fréquent quand la 1re section est l'expérience (mise 2 colonnes).
      if (ORG_NAME_RE.test(line)) continue

      if (strict) {
        if (isStrictPersonName(line)) return line
        continue
      }

      const words = line.split(/\s+/)
      if (words.length >= 2 && words.length <= 6) return line
      // Nom éclaté : « Dieynaba » suivi de « CAMARA ».
      if (words.length === 1 && isNameToken(line)) {
        const next = head[i + 1]
        if (next && isNameToken(next) && next.split(/\s+/).length === 1 && !detectSection(next)) {
          return `${line} ${next}`.trim()
        }
      }
    }
  }
  return undefined
}

/**
 * Une ligne candidate à l'intitulé de poste : ni coordonnée, ni section, ni lieu,
 * ni date, ni titre générique (« Curriculum Vitae »), ni phrase (≤ 7 mots).
 */
function isPlausibleJobTitle(line: string, fullName?: string): boolean {
  const c = cleanLine(line)
  if (c.length < 3 || c.length > 50) return false
  if (EMAIL_RE.test(c) || PHONE_RE.test(c) || URL_RE.test(c)) return false
  if (SKIP_NAME_RE.test(c)) return false
  if (detectSection(c) || classifyHeading(c)) return false
  if (isLabeledContactLine(c)) return false
  if (/^(tél|tel|phone|email|e-mail|adresse|prénom|prenom|nom|date de naissance|situation|mère|père|pere)\b/i.test(c)) {
    return false
  }
  if (/^\d/.test(c) || DATE_RANGE_START_RE.test(c)) return false
  if (looksLikeLocation(c)) return false
  if (c.split(/\s+/).length > 7) return false
  if (fullName && c === fullName) return false
  return true
}

/**
 * Détecte l'intitulé de poste en deux passes :
 *   1. une ligne contenant un mot-clé métier explicite (fiable, toujours active) ;
 *   2. (si `allowPositional`) une ligne courte placée juste après le nom — utile
 *      pour les intitulés sans mot-clé (« Aide-Soignante »). Désactivée quand le
 *      nom vient de libellés : on évite alors de deviner un poste au hasard.
 */
function detectJobTitle(lines: string[], fullName?: string, allowPositional = true): string | undefined {
  const head = lines.slice(0, 12)
  const nameWords = fullName ? fullName.split(/\s+/) : []

  // 1) Intitulé explicite (mot-clé métier).
  for (const line of head) {
    const c = cleanLine(line)
    if (nameWords.includes(c)) continue
    if (isPlausibleJobTitle(c, fullName) && JOB_TITLE_HINT_RE.test(c)) return c
  }

  // 2) Ligne courte juste après le nom (titres sans mot-clé reconnu).
  if (allowPositional && fullName) {
    let started = false
    for (const line of head) {
      const c = cleanLine(line)
      const isNamePart = c === fullName || nameWords.includes(c)
      if (!started) {
        if (isNamePart) started = true
        continue
      }
      if (isNamePart) continue
      if (!isPlausibleJobTitle(c, fullName)) continue
      if (isStrictPersonName(c)) continue
      if (c.split(/\s+/).length <= 5) return c
      break
    }
  }

  return undefined
}

/**
 * Cherche le nom (et son intitulé) dans le « cluster de contact » : les lignes
 * situées juste au-dessus d'un email, où qu'elles soient dans le document. Indispensable
 * pour les CV 2 colonnes où le nom est relégué en pied de page (la section
 * expérience occupant le haut), ex. « Fatou Sarr / Comptable / email ».
 */
function detectContactCluster(lines: string[]): { name?: string; title?: string } | undefined {
  for (let i = 0; i < lines.length; i++) {
    if (!EMAIL_RE.test(lines[i]!)) continue

    let name: string | undefined
    let title: string | undefined
    for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
      const c = cleanLine(lines[j]!)
      if (!c || EMAIL_RE.test(c) || PHONE_RE.test(c) || URL_RE.test(c)) continue
      if (detectSection(c) || classifyHeading(c)) break
      if (isLabeledContactLine(c) || looksLikeLocation(c)) continue

      const split = splitNameTitleLine(c)
      if (split) return { name: split.name, title: split.title }
      if (ORG_NAME_RE.test(c)) continue
      if (isStrictPersonName(c) && !JOB_TITLE_HINT_RE.test(c)) {
        name = c
        break
      }
      if (!title && JOB_TITLE_HINT_RE.test(c) && c.split(/\s+/).length <= 5) title = c
    }
    if (name) return { name, title }
  }
  return undefined
}

function buildPersonalInfo(lines: string[], rawText: string): ResumeSnapshot['personalInfo'] {
  const labeled = parseLabeledPersonalInfo(lines)
  let fullName = labeled.fullName
  let jobTitle = labeled.jobTitle

  // Ligne « Nom — Poste » dans l'en-tête : renseigne les deux d'un coup.
  if (!fullName || !jobTitle) {
    for (const line of lines.slice(0, 8)) {
      const split = splitNameTitleLine(line)
      if (split) {
        fullName ||= split.name
        jobTitle ||= split.title
        break
      }
    }
  }

  // Cluster de contact (nom/poste juste au-dessus de l'email) : signal plus fiable
  // que la devinette positionnelle, et seul moyen de retrouver un nom relégué en pied
  // de page (CV 2 colonnes). On le consulte AVANT le repli positionnel pour éviter de
  // capter une société du haut de page (« PCCI Dakar ») comme nom.
  if (!fullName) {
    const cluster = detectContactCluster(lines)
    if (cluster?.name) {
      fullName = cluster.name
      jobTitle ||= cluster.title
    }
  }

  // Repli positionnel, autorisé uniquement si le nom vient d'une position (pas d'un
  // libellé « Nom : ») — sinon on risque de prendre une ligne au hasard.
  const positional = !labeled.fullName
  if (!fullName) fullName = detectFullName(lines)
  if (!jobTitle) jobTitle = detectJobTitle(lines, fullName, positional)

  return {
    fullName,
    jobTitle,
    email: labeled.email || rawText.match(EMAIL_RE)?.[0],
    phone: labeled.phone || rawText.match(PHONE_RE)?.[0]?.trim(),
    linkedinUrl: labeled.linkedinUrl || rawText.match(LINKEDIN_RE)?.[0],
    location: labeled.location,
  }
}

function experienceIdentity(item: ResumeSnapshot['experiences'][number]): string {
  const position = normalizeText(item.position ?? '')
  const company = normalizeText(item.company ?? '')
  // Sans entreprise, la période distingue les postes répétés (« Plombier » sur
  // plusieurs périodes) ; avec entreprise, on ignore les dates pour bien dédupliquer.
  const period = company ? '' : `${item.startDate ?? ''}-${item.endDate ?? ''}`
  return `${company}|${position}|${period}`
}

function experiencesMatch(
  a: ResumeSnapshot['experiences'][number],
  b: ResumeSnapshot['experiences'][number],
): boolean {
  const posA = normalizeText(a.position ?? '')
  const posB = normalizeText(b.position ?? '')
  const companyA = normalizeText(a.company ?? '')
  const companyB = normalizeText(b.company ?? '')

  if (!posA || !posB) return false
  if (posA === posB && (companyA === companyB || !companyA || !companyB)) {
    // Même poste répété SANS entreprise mais sur des périodes différentes
    // (« Plombier » 2024-2025 puis 2020-2021) → ce sont des entrées distinctes.
    if (!companyA && !companyB) {
      const periodA = `${a.startDate ?? ''}|${a.endDate ?? ''}`
      const periodB = `${b.startDate ?? ''}|${b.endDate ?? ''}`
      if (periodA !== periodB && periodA !== '|' && periodB !== '|') return false
    }
    return true
  }
  if (posA.includes(posB) || posB.includes(posA)) {
    if (!companyA || !companyB || companyA.includes(companyB) || companyB.includes(companyA)) return true
  }
  return false
}

function mergeExperienceFields(
  target: ResumeSnapshot['experiences'][number],
  source: ResumeSnapshot['experiences'][number],
): ResumeSnapshot['experiences'][number] {
  const targetScore = (target.position?.length ?? 0) + (target.company?.length ?? 0)
  const sourceScore = (source.position?.length ?? 0) + (source.company?.length ?? 0)
  const best = sourceScore > targetScore ? source : target
  const other = best === source ? target : source

  return {
    position: best.position || other.position,
    company: best.company || other.company,
    startDate: target.startDate || source.startDate || other.startDate,
    endDate: target.endDate || source.endDate || other.endDate,
    isCurrent: target.isCurrent || source.isCurrent,
    description: [target.description, source.description].filter(Boolean).join('\n') || undefined,
    location: target.location || source.location,
  }
}

function dedupeExperiences(items: ResumeSnapshot['experiences']): ResumeSnapshot['experiences'] {
  const result: ResumeSnapshot['experiences'] = []

  for (const item of items) {
    if (!item.position?.trim() && !item.company?.trim()) continue
    if (/^entreprise$/i.test(item.company ?? '')) continue
    if (isDateOnlyLine(item.position ?? '')) continue
    if (detectSection(item.position ?? '') || detectSection(item.company ?? '')) continue

    const existingIndex = result.findIndex((existing) => experiencesMatch(existing, item))
    if (existingIndex >= 0) {
      result[existingIndex] = mergeExperienceFields(result[existingIndex]!, item)
      continue
    }

    const key = experienceIdentity(item)
    if (result.some((existing) => experienceIdentity(existing) === key)) continue
    result.push(item)
  }

  return result
}

function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = normalizeText(item.name)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function dedupeEducations(items: ResumeSnapshot['educations']): ResumeSnapshot['educations'] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${normalizeText(item.institution ?? '')}|${normalizeText(item.degree ?? '')}`
    if (!key.replace('|', '').trim() || seen.has(key)) return false
    seen.add(key)
    return Boolean(item.degree?.trim() || item.institution?.trim())
  })
}

function dedupeCertifications(items: ResumeSnapshot['certifications']): ResumeSnapshot['certifications'] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = normalizeText(item.name)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function isEducationContinuationFragment(line: string): boolean {
  const cleaned = cleanLine(line)
  if (/^(?:ème|ere|ère|et|assurance|finance)\b/i.test(cleaned)) return true
  if (/^assurance\s+(?:à|a|au)\s+/i.test(cleaned)) return true
  if (/^(?:de|du|des)\s+(?:dakar|rufisque)\b/i.test(cleaned)) return true
  if (cleaned.length <= 6 && !/^(?:bfem|bac|l2|l3|master)$/i.test(cleaned)) return true
  return false
}

function isLikelyJobTitleLine(line: string): boolean {
  const cleaned = cleanLine(line)
  if (cleaned.length > 40 || cleaned.split(/\s+/).length > 4) return false
  return (
    cleaned === cleaned.toUpperCase() &&
    /^(?:comptable|commercial|développeur|developpeur|manager|étudiant|etudiant|ingénieur|ingenieur|consultant)$/i.test(
      cleaned,
    )
  )
}

function shouldSkipBlockScanLine(line: string): boolean {
  if (isLikelyJobTitleLine(line)) return true
  if (isTemplateFooter(line)) return true
  if (isContactLine(line) && !isLabeledContactLine(line)) return true
  // État civil ou ligne à libellé (« Date de naissance : … », « Nom : … ») :
  // jamais une expérience — évite d'inventer des postes sur un CV étudiant.
  if (PERSONAL_INFO_LABEL_RE.test(cleanLine(line))) return true
  if (isLabeledContactLine(line)) return true
  if (detectSection(line)) return true
  return false
}

function looksLikeEducationDegree(line: string): boolean {
  const cleaned = cleanLine(line)
  if (cleaned.length < 3 || cleaned.length > 120) return false
  if (isDateOnlyLine(cleaned)) return false
  if (isExperienceEntryLine(cleaned)) return false
  if (isEducationContinuationFragment(cleaned)) return false
  if (looksLikeExperienceTitle(cleaned) && !EDUCATION_KEYWORDS_RE.test(cleaned)) return false
  if (!/^[A-Z0-9ÉÈÀÂÎÔÛÇ"'«]/.test(cleaned) && !/^\d{1,2}(?:ère|ere|ème|eme)\s/i.test(cleaned)) return false
  return EDUCATION_KEYWORDS_RE.test(cleaned) || /^(?:\d{1,2}(?:ère|ere|ème|eme)\s)/i.test(cleaned)
}

function extractBlockExperiencesFromLines(lines: string[]): ResumeSnapshot['experiences'] {
  const results: ResumeSnapshot['experiences'] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (shouldSkipBlockScanLine(line)) continue
    // Une entrée de formation (« … : 2ème année de Formation … à ENSUP ») ne doit
    // jamais devenir une expérience, même si le « à » ressemble à « poste à employeur ».
    if (isEducationEntryLine(line)) continue

    const parsedFromLine = parseExperienceLine(line)
    if (parsedFromLine?.position && parsedFromLine.company) {
      results.push(parsedFromLine)
      continue
    }

    if (isExperienceEntryLine(line)) {
      const parsed = parseExperienceLine(line)
      if (parsed) results.push(parsed)
      continue
    }

    if (!looksLikeExperienceTitle(line)) continue
    if (EDUCATION_KEYWORDS_RE.test(line) && !EXPERIENCE_KEYWORDS_RE.test(line) && !/\b(?:stagiaire|stage)\b/i.test(line)) {
      continue
    }

    let entry: ResumeSnapshot['experiences'][number] = { position: cleanLine(line), company: '' }
    let consumed = 0

    for (let offset = 1; offset <= 6 && i + offset < lines.length; offset++) {
      const next = lines[i + offset]!
      if (shouldSkipBlockScanLine(next)) break
      if (looksLikeEducationDegree(next)) continue
      if (looksLikeExperienceTitle(next) && !isDateOnlyLine(next)) break
      if (isExperienceEntryLine(next)) break

      if (isDateOnlyLine(next)) {
        const dates = parseDateRange(next)
        entry = {
          ...entry,
          startDate: entry.startDate || dates.startDate,
          endDate: entry.endDate || dates.endDate,
          isCurrent: entry.isCurrent || dates.isCurrent,
        }
        consumed = offset
        break
      }

      entry = applyExperienceBlockLine(entry, next)
      consumed = offset
    }

    if (entry.position?.trim()) results.push(entry)
    i += consumed
  }

  return dedupeExperiences(results)
}

function extractBlockEducationsFromLines(lines: string[]): ResumeSnapshot['educations'] {
  const results: ResumeSnapshot['educations'] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (shouldSkipBlockScanLine(line)) continue
    if (isEducationContinuationFragment(line)) continue
    if (isExperienceEntryLine(line)) continue
    if (looksLikeExperienceTitle(line) && !EDUCATION_KEYWORDS_RE.test(line)) continue

    if (isEducationEntryLine(line)) {
      const parsed = parseEducationEntryLine(line)
      if (parsed) {
        const finalized = finalizeEducationEntry(parsed)
        if (finalized) results.push(finalized)
      }
      continue
    }

    if (!looksLikeEducationDegree(line)) continue

    let entry: ResumeSnapshot['educations'][number] = { degree: cleanLine(line), institution: '' }
    let consumed = 0

    for (let offset = 1; offset <= 4 && i + offset < lines.length; offset++) {
      const next = lines[i + offset]!
      if (shouldSkipBlockScanLine(next)) break
      if (looksLikeEducationDegree(next) && offset > 1) break
      if (looksLikeExperienceTitle(next) && !EDUCATION_KEYWORDS_RE.test(next)) break

      if (isDateOnlyLine(next)) {
        const dates = parseDateRange(next)
        entry.startDate = dates.startDate
        entry.endDate = dates.endDate
        consumed = offset
        break
      }

      if (!entry.institution && offset === 1 && !looksLikeLocation(next) && !EDUCATION_KEYWORDS_RE.test(next)) {
        entry.institution = cleanLine(next)
        continue
      }

      if (!entry.field && !isDateOnlyLine(next)) {
        entry.field = cleanLine(next)
        continue
      }

      if (!entry.institution) entry.institution = cleanLine(next)
      consumed = offset
    }

    const finalized = finalizeEducationEntry(entry)
    if (finalized) results.push(finalized)
    i += consumed
  }

  return dedupeEducations(results)
}

function parseStructuredSections(lines: string[]) {
  const experiences: ResumeSnapshot['experiences'] = []
  const educations: ResumeSnapshot['educations'] = []
  const skills: ResumeSnapshot['skills'] = []
  const languages: ResumeSnapshot['languages'] = []
  const certifications: ResumeSnapshot['certifications'] = []
  const interests: ResumeSnapshot['interests'] = []
  const summaryParts: string[] = []

  let section: Section = 'none'
  let currentExperience: ResumeSnapshot['experiences'][number] | null = null
  let currentEducation: ResumeSnapshot['educations'][number] | null = null

  const flushExperience = () => {
    if (currentExperience && (currentExperience.position || currentExperience.company)) {
      experiences.push(currentExperience)
    }
    currentExperience = null
  }

  const flushEducation = () => {
    if (currentEducation) {
      const finalized = finalizeEducationEntry(currentEducation)
      if (finalized) educations.push(finalized)
    }
    currentEducation = null
  }

  const appendToCurrent = (line: string) => {
    if (section === 'experience' && currentExperience) {
      currentExperience.description = [currentExperience.description, line].filter(Boolean).join('\n')
      return true
    }
    if (section === 'summary') {
      summaryParts.push(line)
      return true
    }
    return false
  }

  for (const rawLine of lines) {
    if (isContactLine(rawLine) && !isLabeledContactLine(rawLine)) continue
    if (isTemplateFooter(rawLine)) continue

    const header = detectSection(rawLine)
    if (header) {
      flushExperience()
      flushEducation()
      section = header
      continue
    }

    if (isExperienceEntryLine(rawLine)) {
      flushExperience()
      flushEducation()
      section = 'experience'
      currentExperience = parseExperienceLine(rawLine)
      continue
    }

    if (section === 'summary') {
      if (rawLine.length >= 8 && rawLine.length <= 500) summaryParts.push(rawLine)
      continue
    }

    if (section === 'experience') {
      if (isDateOnlyLine(rawLine)) {
        const dates = parseDateRange(rawLine)
        if (currentExperience) {
          currentExperience.startDate ||= dates.startDate
          currentExperience.endDate ||= dates.endDate
          currentExperience.isCurrent ||= dates.isCurrent
        }
        continue
      }

      if (isBulletLine(rawLine) && currentExperience) {
        const bullet = stripBullet(rawLine)
        currentExperience.description = [currentExperience.description, bullet].filter(Boolean).join('\n')
        continue
      }

      const parsed = parseExperienceLine(rawLine)
      if (parsed) {
        flushExperience()
        currentExperience = parsed
        continue
      }

      if (looksLikeExperienceTitle(rawLine)) {
        flushExperience()
        currentExperience = { position: cleanLine(rawLine), company: '' }
        continue
      }

      if (currentExperience && looksLikeLocation(rawLine)) {
        currentExperience = applyExperienceBlockLine(currentExperience, rawLine)
        continue
      }

      if (currentExperience && looksLikeEducationDegree(rawLine)) {
        continue
      }

      if (currentExperience) {
        currentExperience = applyExperienceBlockLine(currentExperience, rawLine)
        continue
      }

      if (appendToCurrent(rawLine)) continue
    }

    if (section === 'education') {
      // Entrée préfixée par une date : "2021-2022 : Diplôme ..."
      if (isEducationEntryLine(rawLine)) {
        flushEducation()
        currentEducation = parseEducationEntryLine(rawLine)
        continue
      }

      // Ligne de date seule : clôt l'entrée en cours (mise en page
      // diplôme / établissement / domaine / date où la date est en dernier).
      if (isDateOnlyLine(rawLine)) {
        if (currentEducation) {
          const dates = parseDateRange(rawLine)
          currentEducation.startDate ||= dates.startDate
          currentEducation.endDate ||= dates.endDate
          flushEducation()
        }
        continue
      }

      // Entrée déjà datée : lignes suivantes = continuation (retour à la ligne).
      if (currentEducation && (currentEducation.startDate || currentEducation.endDate)) {
        currentEducation = appendEducationContinuation(currentEducation, rawLine)
        continue
      }

      // Entrée en cours de construction (pas encore de date) :
      // ordre attendu = établissement puis domaine (la 2e ligne est l'établissement,
      // même si elle ressemble à un lieu, ex. "Matar Seck de Rufisque").
      if (currentEducation) {
        if (!currentEducation.institution) {
          currentEducation.institution = cleanLine(rawLine)
          continue
        }
        if (looksLikeLocation(rawLine)) {
          currentEducation.location ||= cleanLine(rawLine)
          continue
        }
        const chunk = cleanLine(rawLine)
        if (!currentEducation.field) {
          currentEducation.field = chunk
          continue
        }
        if (!normalizeText(currentEducation.field).includes(normalizeText(chunk))) {
          currentEducation.field = [currentEducation.field, chunk].filter(Boolean).join(' ')
        }
        continue
      }

      const parsed = parseEducationLine(rawLine)
      if (parsed) {
        flushEducation()
        currentEducation = parsed
        continue
      }
    }

    if (section === 'skills') {
      skills.push(...parseSkillTokens(rawLine))
      continue
    }

    if (section === 'languages') {
      const parsed = parseLanguageLine(rawLine)
      if (parsed) languages.push(parsed)
      continue
    }

    if (section === 'certifications') {
      const parsed = parseCertificationLine(rawLine)
      if (parsed) certifications.push(parsed)
      continue
    }

    if (section === 'interests') {
      const parsed = parseInterestLine(rawLine)
      if (parsed) interests.push(parsed)
    }
  }

  flushExperience()
  flushEducation()

  return {
    summary: summaryParts.join('\n').trim() || undefined,
    experiences: dedupeExperiences(experiences).slice(0, 12),
    educations: dedupeEducations(educations).slice(0, 12),
    skills: dedupeByName(skills).slice(0, 30),
    languages: dedupeByName(languages).slice(0, 10),
    certifications: dedupeCertifications(certifications).slice(0, 12),
    interests: dedupeByName(interests).slice(0, 10),
  }
}

export function parseResumeText(rawText: string): Partial<ResumeSnapshot> {
  const lines = normalizeLines(rawText)
  const personalInfo = buildPersonalInfo(lines, rawText)
  const sections = parseStructuredSections(lines)

  const hasEducationSection = lines.some((line) => detectSection(line) === 'education')

  const experiences = dedupeExperiences([
    ...(sections.experiences ?? []),
    ...extractBlockExperiencesFromLines(lines),
  ]).slice(0, 12)

  const blockEducations = hasEducationSection ? [] : extractBlockEducationsFromLines(lines)
  const educations = dedupeEducations([
    ...(sections.educations ?? []),
    ...blockEducations,
  ]).slice(0, 12)

  return {
    personalInfo,
    ...sections,
    experiences,
    educations,
    title: personalInfo.fullName ? `CV — ${personalInfo.fullName}` : 'Mon CV',
  }
}

const DIPLOMA_NOISE_RE =
  /^(république|republique|ministère|ministere|minister|président|president|directeur|director|certifie|certifies|atteste|décern|decerne|sénat|senat|national|education|éducation|education nationale|vu le|arrêté|arrete|décret|decret|n°|no\.|matricule|registre|signature|cachet|fait à|fait a|le\s+\d{1,2}\s)/i

function isDiplomaNoiseLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length < 4) return true
  if (EMAIL_RE.test(trimmed) || PHONE_RE.test(trimmed)) return true
  if (DIPLOMA_NOISE_RE.test(trimmed)) return true
  if (/^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(trimmed)) return true
  return false
}

function extractYearFromLines(lines: string[]): string | undefined {
  for (const line of lines) {
    const match = line.match(/\b(19|20)\d{2}\b/)
    if (match) return match[0]
  }
  return undefined
}

export function parseDiplomaText(rawText: string): Partial<ResumeSnapshot> {
  const lines = normalizeLines(rawText).filter((line) => !isDiplomaNoiseLine(line))
  const educations: ResumeSnapshot['educations'] = []

  for (const line of lines) {
    if (detectSection(line)) continue
    const parsed = parseEducationLine(line)
    if (parsed) educations.push(parsed)
  }

  const deduped = dedupeEducations(educations)
  if (!deduped.length && lines.length) {
    const degreeLine =
      lines.find(
        (line) =>
          line.length > 8 &&
          line.length < 160 &&
          /(master|licence|bachelor|bts|dut|doctorat|mba|ingénieur|ingenieur|bac|diplôme|diplome|certificat|bfem|cap|bep|deug|licence|grade)/i.test(
            line,
          ),
      ) ??
      lines.find((line) => line.length > 8 && line.length < 120) ??
      'Diplôme importé'

    const institutionLine =
      lines.find((line) =>
        /université|university|école|ecole|institut|faculté|faculte|académie|academie|lycée|lycee|campus|ucad|heg|esp|ism/i.test(
          line,
        ),
      ) ?? ''

    const year = extractYearFromLines(lines)

    deduped.push({
      degree: degreeLine,
      institution: institutionLine,
      endDate: year,
    })
  }

  return { educations: deduped.slice(0, 5) }
}

export function parseCertificateText(rawText: string): Partial<ResumeSnapshot> {
  const lines = normalizeLines(rawText)
  const certifications: ResumeSnapshot['certifications'] = []

  for (const line of lines) {
    if (detectSection(line)) continue
    const parsed = parseCertificationLine(line)
    if (parsed) certifications.push(parsed)
  }

  const deduped = dedupeCertifications(certifications)
  if (!deduped.length && lines.length) {
    const titleLine = lines.find((line) => line.length > 5 && line.length < 120 && !EMAIL_RE.test(line))
    if (titleLine) {
      deduped.push({
        name: titleLine,
        issuer: lines.find((line) => /délivré|delivre|issued|organisme|by/i.test(line)),
      })
    }
  }

  return { certifications: deduped.slice(0, 5) }
}

const COVER_LETTER_NOISE_RE =
  /^(?:lettre de motivation|cover letter|madame,? monsieur,?|objet\s*:|subject\s*:)$/i

const OBJECT_LINE_RE = /^(?:objet|subject)\s*[:：]\s*(.+)$/i
const RECIPIENT_LINE_RE =
  /^(?:à l'?attention de|attention de|destinataire|recruteur|recruiter)\s*[:：]\s*(.+)$/i
const COMPANY_LINE_RE = /^(?:entreprise|société|societe|company|employeur)\s*[:：]\s*(.+)$/i
const COVER_LETTER_DATE_RE =
  /\b\d{1,2}\s+(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+\d{4}\b/i
const COMPANY_HINT_RE =
  /\b(?:group|groupe|société|societe|sa|sarl|sas|ltd|inc|company|entreprise|intech)\b/i

function isCoverLetterNoiseLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return true
  if (COVER_LETTER_NOISE_RE.test(trimmed)) return true
  if (isTemplateFooter(trimmed)) return true
  if (/profilo['']z/i.test(trimmed)) return true
  if (/^(?:madame|monsieur|mesdames|messieurs)\b/i.test(trimmed) && trimmed.length < 40) return true
  return false
}

function extractEmailFromText(text: string): string | undefined {
  const matches = text.match(/[a-zA-Z0-9._+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+/gi) ?? []
  const cleaned = matches
    .map((match) => match.replace(/^[^a-zA-Z0-9._+-]+/, ''))
    .filter((match) => EMAIL_RE.test(match) && match.length >= 6)

  return cleaned.sort((a, b) => b.length - a.length)[0]
}

function extractPhoneFromText(text: string): string | undefined {
  const match = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/,
  )
  return match?.[0]?.trim()
}

function looksLikePersonName(line: string): boolean {
  const trimmed = cleanLine(line)
  if (trimmed.length < 4 || trimmed.length > 55) return false
  if (EMAIL_RE.test(trimmed) || PHONE_RE.test(trimmed) || URL_RE.test(trimmed)) return false
  if (COMPANY_HINT_RE.test(trimmed)) return false
  if (COVER_LETTER_DATE_RE.test(trimmed)) return false
  if (/^(?:objet|madame|monsieur|dakar|paris|abidjan)/i.test(trimmed)) return false

  const words = trimmed.split(/\s+/)
  if (words.length < 2 || words.length > 5) return false

  return words.every(
    (word) =>
      /^[A-ZÀ-Ÿ][a-zàâäéèêëïîôùûüç'-]+$/.test(word) ||
      /^[A-ZÀ-Ÿ]{2,}$/.test(word) ||
      /^[A-ZÀ-Ÿ]\.?$/.test(word),
  )
}

export function formatCoverLetterRawText(rawText: string): string {
  let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  if (!text) return ''

  const existingLines = text.split('\n').filter((line) => line.trim()).length
  if (existingLines < 4) {
    const emailMatch = text.match(/[a-zA-Z0-9._+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+/i)?.[0]
    if (emailMatch) {
      text = text.replace(emailMatch, `\n${emailMatch}\n`)
    }

    const phoneMatch = text.match(
      /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/,
    )?.[0]
    if (phoneMatch) {
      text = text.replace(phoneMatch, `\n${phoneMatch}\n`)
    }
  }

  const markers = [
    /\s+(Objet\s*:)/gi,
    /\s+(Madame,?\s*Monsieur,?)/gi,
    /\s+(Mesdames,?\s*Messieurs,?)/gi,
    /\s+(Je vous prie)/gi,
    /\s+(Dans l['']attente)/gi,
    /\s+(Veuillez agréer)/gi,
    /\s+(Bien cordialement)/gi,
    /\s+(Cordialement)/gi,
    /\s+(\d{1,2}\s+(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+\d{4})/gi,
  ]

  for (const pattern of markers) {
    text = text.replace(pattern, '\n\n$1')
  }

  text = text.replace(/([.!?])\s+(?=[A-ZÀ-Ÿ«"])/g, '$1\n\n')
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n /g, '\n')
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

function extractCoverLetterSenderName(lines: string[]): string | undefined {
  for (const line of [...lines].reverse().slice(0, 8)) {
    if (looksLikePersonName(line)) return cleanLine(line)
  }

  for (const line of lines.slice(0, 10)) {
    if (looksLikePersonName(line)) return cleanLine(line)
  }

  return undefined
}

function extractCoverLetterCompanyName(lines: string[]): string | undefined {
  for (const line of lines.slice(0, 15)) {
    const cleaned = cleanLine(line)
    if (COMPANY_HINT_RE.test(cleaned) && cleaned.length <= 80) return cleaned
  }
  return undefined
}

const SALUTATION_LINE_RE = /^(?:madame,?\s*monsieur,?|mesdames,?\s*messieurs,?)/i
const CLOSING_START_RE =
  /^(?:je vous prie|veuillez agréer|dans l['']attente|bien cordialement|cordialement|salutations distinguées)/i

interface CoverLetterExtractMeta {
  senderName?: string
  senderEmail?: string
  senderPhone?: string
  senderLocation?: string
  companyName?: string
  position?: string
  recruiterName?: string
}

function normalizeCompareText(value?: string): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? ''
}

function isCoverLetterHeaderLine(line: string, meta: CoverLetterExtractMeta): boolean {
  const trimmed = cleanLine(line)
  if (!trimmed) return true
  if (SALUTATION_LINE_RE.test(trimmed)) return true
  if (OBJECT_LINE_RE.test(trimmed)) return true
  if (COVER_LETTER_DATE_RE.test(trimmed)) return true
  if (EMAIL_RE.test(trimmed) || PHONE_RE.test(trimmed) || URL_RE.test(trimmed)) return true
  if (isTemplateFooter(trimmed) || /profilo['']z/i.test(trimmed)) return true
  if (/^[→\-–]\s/.test(trimmed)) return true

  const normalized = normalizeCompareText(trimmed)
  if (meta.senderName && normalized === normalizeCompareText(meta.senderName)) return true
  if (meta.senderEmail && normalized.includes(normalizeCompareText(meta.senderEmail))) return true
  if (meta.senderPhone && trimmed.replace(/\s/g, '').includes(meta.senderPhone.replace(/\s/g, ''))) return true
  if (meta.senderLocation && normalized === normalizeCompareText(meta.senderLocation)) return true
  if (meta.companyName && normalized === normalizeCompareText(meta.companyName)) return true
  if (meta.recruiterName && normalized.includes(normalizeCompareText(meta.recruiterName))) return true
  if (meta.position && normalized === normalizeCompareText(`objet : ${meta.position}`)) return true
  if (meta.position && normalized === normalizeCompareText(`objet: ${meta.position}`)) return true

  if (COMPANY_HINT_RE.test(trimmed) && trimmed.length <= 80) return true
  if (looksLikeLocation(trimmed) && !looksLikePersonName(trimmed)) return true

  return false
}

function splitObjectLineBody(line: string): { subject?: string; body?: string } {
  const match = line.match(OBJECT_LINE_RE)
  if (!match?.[1]) return {}

  const subject = match[1].trim()
  const sentenceSplit = subject.match(/^(.+?[.!?])\s+(.+)$/s)
  if (sentenceSplit?.[2] && sentenceSplit[2].length >= 20) {
    return { subject: sentenceSplit[1]!.trim(), body: sentenceSplit[2].trim() }
  }

  return { subject }
}

function extractCoverLetterBody(
  formatted: string,
  meta: CoverLetterExtractMeta,
): { content: string; closingText?: string } {
  const lines = formatted.split('\n')
  let closingStartIdx = lines.length
  let closingText: string | undefined

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim()
    if (!trimmed) continue
    if (CLOSING_START_RE.test(trimmed)) {
      closingStartIdx = i
      closingText = lines.slice(i, lines.length).join('\n').trim()
      break
    }
  }

  if (closingText && meta.senderName) {
    const signature = meta.senderName.trim()
    closingText = closingText
      .replace(new RegExp(`\\n${signature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`), '')
      .trim()
  }

  let bodyStart = 0
  for (let i = 0; i < closingStartIdx; i++) {
    const trimmed = lines[i]!.trim()
    if (!trimmed) continue

    if (SALUTATION_LINE_RE.test(trimmed)) {
      bodyStart = i + 1
      continue
    }

    if (OBJECT_LINE_RE.test(trimmed)) {
      const { body } = splitObjectLineBody(trimmed)
      if (body) {
        lines[i] = body
        bodyStart = i
        break
      }
      bodyStart = i + 1
      continue
    }

    if (!isCoverLetterHeaderLine(trimmed, meta)) {
      bodyStart = i
      break
    }
  }

  let bodyEnd = closingStartIdx
  for (let i = closingStartIdx - 1; i >= bodyStart; i--) {
    const trimmed = lines[i]!.trim()
    if (!trimmed) continue
    if (meta.senderName && trimmed === meta.senderName.trim()) {
      bodyEnd = i
      continue
    }
    break
  }

  const content = lines
    .slice(bodyStart, bodyEnd)
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed) return true
      return !isCoverLetterHeaderLine(trimmed, meta)
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { content, closingText }
}

export function parseCoverLetterText(rawText: string): CoverLetterImportData {
  const normalized = repairSpacedOutText(rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim())
  const formatted = formatCoverLetterRawText(normalized)
  const lines = normalizeLines(formatted).filter((line) => !isCoverLetterNoiseLine(line))
  const email = extractEmailFromText(formatted)
  const phone = extractPhoneFromText(formatted)

  let senderLocation: string | undefined
  let position: string | undefined
  let recruiterName: string | undefined
  let companyName = extractCoverLetterCompanyName(lines)

  for (const line of lines.slice(0, 15)) {
    const objectMatch = line.match(OBJECT_LINE_RE)
    if (objectMatch && !position) {
      position = objectMatch[1]?.trim()
      continue
    }

    const recipientMatch = line.match(RECIPIENT_LINE_RE)
    if (recipientMatch && !recruiterName) {
      recruiterName = recipientMatch[1]?.trim()
      continue
    }

    const companyMatch = line.match(COMPANY_LINE_RE)
    if (companyMatch && !companyName) {
      companyName = companyMatch[1]?.trim()
      continue
    }

    const labeled = parseLabeledPersonalInfo([line])
    if (labeled.location && !senderLocation) senderLocation = labeled.location
    if (labeled.jobTitle && !position) position = labeled.jobTitle
  }

  if (!senderLocation) {
    senderLocation = lines.find(
      (line) =>
        looksLikeLocation(line) &&
        !COMPANY_HINT_RE.test(line) &&
        !isTemplateFooter(line) &&
        !/profilo['']z/i.test(line) &&
        !looksLikePersonName(line) &&
        line.length <= 45,
    )
  }

  const senderName = extractCoverLetterSenderName(lines)
  const meta: CoverLetterExtractMeta = {
    senderName,
    senderEmail: email,
    senderPhone: phone,
    senderLocation,
    companyName,
    position,
    recruiterName,
  }
  const { content, closingText } = extractCoverLetterBody(formatted, meta)

  return {
    senderName,
    senderEmail: email,
    senderPhone: phone,
    senderLocation,
    companyName,
    position,
    recruiterName,
    content,
    closingText,
  }
}

export function parseDocumentText(
  rawText: string,
  documentType: DocumentType = 'CV',
): Partial<ResumeSnapshot> | CoverLetterImportData {
  if (documentType === 'DIPLOMA') return parseDiplomaText(rawText)
  if (documentType === 'CERTIFICATE') return parseCertificateText(rawText)
  if (documentType === 'COVER_LETTER') return parseCoverLetterText(rawText)
  return parseResumeText(rawText)
}
