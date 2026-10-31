/**
 * Remise en forme de la réponse Gemini d'un import de CV, puis fusion avec l'extraction heuristique.
 *
 * Le modèle ne respecte pas toujours le schéma demandé (noms de champs, niveaux en texte libre,
 * valeurs « null » ou « N/A ») : tout passe ici avant d'atteindre l'éditeur.
 */
import type {
  Certification,
  Education,
  Experience,
  Interest,
  Language,
  LanguageLevel,
  PersonalInfo,
  ResumeSnapshot,
  Skill,
  SkillLevel,
} from '@profiloz/shared'

type Raw = Record<string, unknown>

export type LlmResume = {
  personalInfo: PersonalInfo
  summary: string
  experiences: Experience[]
  educations: Education[]
  skills: Skill[]
  languages: Language[]
  certifications: Certification[]
  interests: Interest[]
  photoBox?: [number, number, number, number]
}

const EMPTY_VALUE = /^(?:null|undefined|n\/?a|none|aucun(?:e)?|non (?:sp[ée]cifi[ée]|renseign[ée]|pr[ée]cis[ée])|-|—|\?)$/i
const PRESENT = /^(?:pr[ée]sent|present|aujourd['’]hui|actuel(?:lement)?|en cours|nos jours|ce jour|current|now|today)$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Chaîne propre, ou '' pour les valeurs vides déguisées (« null », « N/A »…). */
function str(value: unknown, max = 300): string {
  if (typeof value === 'number') return String(value)
  if (typeof value !== 'string') return ''
  const cleaned = value.replace(/\s+/g, ' ').trim()
  if (!cleaned || EMPTY_VALUE.test(cleaned)) return ''
  return cleaned.slice(0, max)
}

/** Texte multiligne (descriptions) : garde les retours à la ligne, accepte une liste de puces. */
function multiline(value: unknown, max = 3000): string {
  if (Array.isArray(value)) {
    const lines = value.map((item) => str(item, 500)).filter(Boolean)
    return lines.map((line) => (/^[-•*]/.test(line) ? line : `- ${line}`)).join('\n').slice(0, max)
  }
  if (typeof value !== 'string') return ''
  const text = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim().replace(/^[•●▪*]\s*/, '- '))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return EMPTY_VALUE.test(text) ? '' : text.slice(0, max)
}

/** Première valeur non vide parmi plusieurs noms de champ possibles. */
function pick(raw: Raw, keys: string[], max?: number): string {
  for (const key of keys) {
    const value = str(raw[key], max)
    if (value) return value
  }
  return ''
}

function bool(value: unknown): boolean {
  return value === true || (typeof value === 'string' && /^(?:true|oui|yes)$/i.test(value.trim()))
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function normalizeExperience(raw: unknown): Experience | null {
  if (!isRecord(raw)) return null
  const position = pick(raw, ['position', 'title', 'jobTitle', 'role', 'poste', 'intitule'], 150)
  const company = pick(raw, ['company', 'employer', 'organization', 'organisation', 'entreprise', 'companyName'], 150)
  if (!position && !company) return null

  const startDate = pick(raw, ['startDate', 'start', 'from', 'dateDebut'], 40)
  let endDate = pick(raw, ['endDate', 'end', 'to', 'dateFin'], 40)
  let isCurrent = bool(raw.isCurrent) || bool(raw.current) || bool(raw.ongoing)
  if (PRESENT.test(endDate)) {
    isCurrent = true
    endDate = ''
  }

  return {
    company,
    position,
    location: pick(raw, ['location', 'city', 'lieu', 'ville'], 120) || undefined,
    startDate: startDate || undefined,
    endDate: isCurrent ? undefined : endDate || undefined,
    isCurrent,
    description: multiline(raw.description ?? raw.missions ?? raw.tasks ?? raw.responsibilities) || undefined,
  }
}

function normalizeEducation(raw: unknown): Education | null {
  if (!isRecord(raw)) return null
  const degree = pick(raw, ['degree', 'diploma', 'diplome', 'title', 'formation'], 200)
  const institution = pick(raw, ['institution', 'school', 'university', 'etablissement', 'ecole'], 200)
  if (!degree && !institution) return null
  let endDate = pick(raw, ['endDate', 'end', 'to', 'year', 'graduationYear'], 40)
  if (PRESENT.test(endDate)) endDate = ''
  return {
    institution,
    degree,
    field: pick(raw, ['field', 'fieldOfStudy', 'major', 'domaine', 'specialite'], 150) || undefined,
    location: pick(raw, ['location', 'city', 'lieu', 'ville'], 120) || undefined,
    startDate: pick(raw, ['startDate', 'start', 'from'], 40) || undefined,
    endDate: endDate || undefined,
    description: multiline(raw.description, 1500) || undefined,
  }
}

export function toSkillLevel(raw: string): SkillLevel | undefined {
  const value = raw.toLowerCase()
  if (!value) return undefined
  if (/expert|ma[iî]trise parfaite|excellent/.test(value)) return 'EXPERT'
  if (/avanc|confirm|tr[eè]s bon|advanced|ma[iî]tris/.test(value)) return 'ADVANCED'
  if (/interm|bon|moyen|interm[ée]diaire/.test(value)) return 'INTERMEDIATE'
  if (/d[ée]butant|notion|basique|beginner|base/.test(value)) return 'BEGINNER'
  return undefined
}

export function toLanguageLevel(raw: string): LanguageLevel | undefined {
  const value = raw.toLowerCase()
  if (!value) return undefined
  if (/natif|native|maternelle|mother|langue m[eè]re|\bc2\b/.test(value)) return 'NATIVE'
  // Formulations courantes au Sénégal : « lu, parlé et écrit », « parlé »
  if (/[ée]crit/.test(value) && /parl[ée]|lu\b/.test(value)) return 'PROFESSIONAL'
  if (/^parl[ée]s?$|parl[ée] uniquement|oral/.test(value)) return 'CONVERSATIONAL'
  if (/courant|bilingue|fluent|professionn|\bc1\b|\bb2\b|avanc|tr[eè]s bon|excellent/.test(value)) return 'PROFESSIONAL'
  if (/interm[ée]diaire|conversation|\bb1\b|bon|moyen|correct/.test(value)) return 'CONVERSATIONAL'
  if (/notion|d[ée]butant|basique|scolaire|\ba1\b|\ba2\b|basic|[ée]l[ée]mentaire/.test(value)) return 'BASIC'
  return undefined
}

function normalizeSkills(value: unknown): Skill[] {
  const out: Skill[] = []
  const seen = new Set<string>()
  const add = (name: string, level?: string, category?: string) => {
    const clean = name.replace(/^[-•*]\s*/, '').trim()
    const key = clean.toLowerCase()
    if (!clean || clean.length > 80 || seen.has(key)) return
    seen.add(key)
    out.push({ name: clean, level: level ? toSkillLevel(level) : undefined, category: category || undefined })
  }
  for (const item of list(value)) {
    if (typeof item === 'string') {
      // « Excel, Word, PowerPoint » renvoyé en une seule chaîne
      for (const part of item.split(/\s*[,;|]\s*/)) add(part)
    } else if (isRecord(item)) {
      const name = pick(item, ['name', 'skill', 'label', 'nom'], 120)
      const category = pick(item, ['category', 'categorie', 'type'], 60)
      const level = pick(item, ['level', 'niveau'], 40)
      if (name.includes(',') && name.length > 40) name.split(/\s*,\s*/).forEach((part) => add(part, level, category))
      else add(name, level, category)
    }
  }
  return out.slice(0, 40)
}

function normalizeLanguages(value: unknown): Language[] {
  const out: Language[] = []
  const seen = new Set<string>()
  for (const item of list(value)) {
    let name = ''
    let level = ''
    if (typeof item === 'string') {
      // « Anglais (courant) » ou « Anglais : courant »
      const match = item.match(/^([^(:–-]+?)\s*(?:[(:–-]\s*([^)]*)\)?)?$/)
      name = str(match?.[1] ?? item, 60)
      level = str(match?.[2], 60)
    } else if (isRecord(item)) {
      name = pick(item, ['name', 'language', 'langue', 'label'], 60)
      level = pick(item, ['level', 'niveau', 'proficiency'], 60)
    }
    const key = name.toLowerCase()
    if (!name || seen.has(key)) continue
    seen.add(key)
    out.push({ name, level: toLanguageLevel(level) })
  }
  return out.slice(0, 12)
}

function normalizeCertifications(value: unknown): Certification[] {
  const out: Certification[] = []
  for (const item of list(value)) {
    const raw: Raw = typeof item === 'string' ? { name: item } : isRecord(item) ? item : {}
    const name = pick(raw, ['name', 'title', 'certification', 'nom'], 200)
    if (!name) continue
    out.push({
      name,
      issuer: pick(raw, ['issuer', 'organization', 'organisme', 'authority'], 150) || undefined,
      issueDate: pick(raw, ['issueDate', 'date', 'year', 'annee'], 40) || undefined,
    })
  }
  return out.slice(0, 20)
}

function normalizeInterests(value: unknown): Interest[] {
  const out: Interest[] = []
  const seen = new Set<string>()
  for (const item of list(value)) {
    const names = typeof item === 'string'
      ? item.split(/\s*[,;]\s*/)
      : isRecord(item) ? [pick(item, ['name', 'title', 'label', 'interest'], 80)] : []
    for (const raw of names) {
      const name = str(raw, 80)
      const key = name.toLowerCase()
      if (!name || seen.has(key)) continue
      seen.add(key)
      out.push({ name })
    }
  }
  return out.slice(0, 15)
}

function normalizePhotoBox(value: unknown): LlmResume['photoBox'] {
  if (!isRecord(value) || !bool(value.present)) return undefined
  // Le modèle renvoie parfois [[ymin, xmin, ymax, xmax]] ou { ymin, xmin, ymax, xmax }
  let rawBox: unknown = value.box
  if (Array.isArray(rawBox) && rawBox.length === 1 && Array.isArray(rawBox[0])) rawBox = rawBox[0]
  if (isRecord(rawBox)) rawBox = [rawBox.ymin, rawBox.xmin, rawBox.ymax, rawBox.xmax]
  if (!Array.isArray(rawBox) || rawBox.length !== 4) return undefined
  const box = rawBox.map(Number)
  if (box.some((n) => !Number.isFinite(n) || n < 0 || n > 1000)) return undefined
  const [ymin, xmin, ymax, xmax] = box as [number, number, number, number]
  // Boîte trop petite ou inversée : ce n'est pas une photo exploitable
  if (ymax - ymin < 30 || xmax - xmin < 30) return undefined
  return [ymin, xmin, ymax, xmax]
}

/** « OMAR NDIAYE » → « Omar Ndiaye » ; un nom déjà en casse mixte est gardé tel quel. */
function tidyName(name: string): string {
  if (!name || name !== name.toUpperCase()) return name
  return name.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase())
}

/** Un « téléphone » sans assez de chiffres ou qui ressemble à des années (« 2024-2025 ») est rejeté. */
export function isPlausiblePhone(value: string | undefined): boolean {
  if (!value) return false
  const d = value.replace(/\D/g, '')
  if (d.length < 8 || d.length > 16) return false
  return !/^(?:19|20)\d{2}\s*[-–/]\s*(?:19|20)\d{2}$/.test(value.trim())
}

/** « (+221) 70 605 13 87 - 77 833 76 20 » → premier numéro plausible ; espaces et retours à la ligne nettoyés. */
export function firstPhone(value: string | undefined): string | undefined {
  if (!value) return undefined
  const cleaned = value.replace(/\s+/g, ' ').trim()
  if (isPlausiblePhone(cleaned)) return cleaned
  const parts = cleaned.split(/\s+[-–\/|]\s+|\s*[,;\/|]\s*|\s+(?:ou|et)\s+/i)
  return parts.map((part) => part.trim()).find(isPlausiblePhone)
}

/** Réponse brute de Gemini → données au format de l'éditeur (null si inexploitable). */
export function normalizeLlmResume(parsed: unknown): LlmResume | null {
  if (!isRecord(parsed)) return null
  const pi = isRecord(parsed.personalInfo) ? parsed.personalInfo : {}

  const email = pick(pi, ['email', 'mail', 'e-mail'], 120).replace(/^mailto:/i, '')
  const personalInfo: PersonalInfo = {
    fullName: tidyName(pick(pi, ['fullName', 'name', 'nom'], 120)) || undefined,
    jobTitle: pick(pi, ['jobTitle', 'title', 'headline', 'poste'], 150) || undefined,
    email: EMAIL.test(email) ? email : undefined,
    phone: firstPhone(pick(pi, ['phone', 'telephone', 'tel', 'mobile'], 80)),
    location: pick(pi, ['location', 'address', 'city', 'adresse', 'ville'], 150) || undefined,
    linkedinUrl: pick(pi, ['linkedinUrl', 'linkedin'], 200) || undefined,
    websiteUrl: pick(pi, ['websiteUrl', 'website', 'portfolio', 'site'], 200) || undefined,
  }

  const summary = multiline(parsed.summary ?? pi.summary, 1500)

  const result: LlmResume = {
    personalInfo,
    summary,
    experiences: list(parsed.experiences).map(normalizeExperience).filter((e): e is Experience => e !== null).slice(0, 25),
    educations: list(parsed.educations ?? parsed.education).map(normalizeEducation).filter((e): e is Education => e !== null).slice(0, 15),
    skills: normalizeSkills(parsed.skills),
    languages: normalizeLanguages(parsed.languages),
    certifications: normalizeCertifications(parsed.certifications),
    interests: normalizeInterests(parsed.interests),
    photoBox: normalizePhotoBox(parsed.photo),
  }

  const hasContent =
    Object.values(personalInfo).some(Boolean) ||
    result.summary ||
    result.experiences.length ||
    result.educations.length ||
    result.skills.length
  return hasContent ? result : null
}

const digits = (value: string) => value.replace(/\D/g, '')

/**
 * Fusion IA + heuristiques.
 *
 * - Email, téléphone : quand l'IA a vu le document, elle prime (l'OCR fait des erreurs de lecture).
 *   Sinon (texte seul), les heuristiques priment et une valeur IA absente du texte est ignorée
 *   quand ce texte est exploitable (anti-invention). Liens : les heuristiques priment.
 * - Structure (titre, ville, résumé, sections) : quand l'IA a vu le document lui-même (`sawDocument`),
 *   elle fait foi, y compris quand elle répond « rien » : les heuristiques prennent souvent un intitulé
 *   de rubrique pour une formation (« Informations personnelles »). Sinon, une valeur vide de l'IA
 *   n'efface jamais une valeur trouvée.
 */
export function mergeLlmResume(
  heuristic: Partial<ResumeSnapshot>,
  llm: LlmResume,
  rawText: string,
  sawDocument = false,
): Partial<ResumeSnapshot> {
  const base = heuristic.personalInfo ?? {}
  const textIsUsable = rawText.replace(/\s+/g, '').length >= 200
  const textDigits = digits(rawText)
  const lowerText = rawText.toLowerCase()

  const llmEmail = llm.personalInfo.email
  const emailSeen = !textIsUsable || (llmEmail ? lowerText.includes(llmEmail.toLowerCase()) : false)
  const llmPhone = llm.personalInfo.phone
  const phoneSeen = !textIsUsable || (llmPhone ? textDigits.includes(digits(llmPhone).slice(-7)) : false)

  const heuristicPhone = firstPhone(base.phone)
  const aiPhone = isPlausiblePhone(llmPhone) ? llmPhone : undefined

  const personalInfo: PersonalInfo = {
    ...base,
    fullName: llm.personalInfo.fullName || base.fullName,
    jobTitle: sawDocument ? llm.personalInfo.jobTitle : llm.personalInfo.jobTitle || base.jobTitle,
    location: sawDocument ? llm.personalInfo.location : llm.personalInfo.location || base.location,
    // L'IA lit le document lui-même : elle évite les erreurs d'OCR (« 0n715… » au lieu de « on715… »)
    email: sawDocument ? llmEmail || base.email : base.email || (emailSeen ? llmEmail : undefined),
    phone: sawDocument ? aiPhone || heuristicPhone : heuristicPhone || (phoneSeen ? aiPhone : undefined),
    linkedinUrl: base.linkedinUrl || llm.personalInfo.linkedinUrl,
    websiteUrl: base.websiteUrl || llm.personalInfo.websiteUrl,
  }

  const prefer = <T>(fromLlm: T[], fromHeuristic: T[] | undefined): T[] =>
    fromLlm.length > 0 || sawDocument ? fromLlm : fromHeuristic ?? []

  return {
    ...heuristic,
    personalInfo,
    summary: llm.summary || (sawDocument ? undefined : heuristic.summary),
    experiences: prefer(llm.experiences, heuristic.experiences),
    educations: prefer(llm.educations, heuristic.educations),
    skills: prefer(llm.skills, heuristic.skills),
    languages: prefer(llm.languages, heuristic.languages),
    certifications: prefer(llm.certifications, heuristic.certifications),
    interests: prefer(llm.interests, heuristic.interests),
  }
}
