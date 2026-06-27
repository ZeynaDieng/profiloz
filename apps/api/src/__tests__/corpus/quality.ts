import type { ResumeSnapshot } from '@profiloz/shared'
import { cleanLine, detectSection, isContactLine, isTemplateFooter } from '../../modules/ocr/ocr.parser'
import type { ResumeExtraction } from '../../modules/ocr/pipeline'
import { classifyHeading } from '../../modules/ocr/pipeline'

/**
 * Évaluation de qualité indépendante du format : signaux objectifs qui trahissent
 * une mauvaise extraction (peu importe la mise en page d'origine). Partagée par le
 * test du corpus et le scorecard CLI, pour que les deux jugent avec les mêmes règles.
 */

export interface QualityReport {
  overall: number
  redFlags: string[]
  /** Lignes de contenu utiles présentes dans le texte mais nulle part dans le résultat. */
  orphanLines: string[]
  counts: {
    experiences: number
    educations: number
    skills: number
    languages: number
    reviewItems: number
  }
}

const YEAR_RE = /\b(?:19|20)\d{2}\b/
const DATE_RANGE_RE = /\b(?:19|20)\d{2}\s*[-–—/]\s*(?:(?:19|20)\d{2}|pr[ée]sent|present)\b/i
const DUTY_START_RE =
  /^(?:assister|aider|pr[ée]parer|entretenir|g[ée]rer|organiser|coordonner|r[ée]aliser|participer|assurer|d[ée]velopper|mettre|suivre|effectuer|encadrer|animer|accueillir|communiquer|veiller|planifier|superviser)\b/i

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function collectFragments(data: Partial<ResumeSnapshot>): string[] {
  const fragments: Array<string | undefined> = []
  const p = data.personalInfo
  if (p) fragments.push(p.fullName, p.email, p.phone, p.location, p.jobTitle, p.linkedinUrl, p.websiteUrl)
  fragments.push(data.summary)
  for (const exp of data.experiences ?? []) {
    fragments.push(exp.position, exp.company, exp.location, exp.country, exp.description)
    for (const s of exp.skillsUsed ?? []) fragments.push(s)
  }
  for (const edu of data.educations ?? []) fragments.push(edu.degree, edu.institution, edu.field, edu.location, edu.description)
  for (const skill of data.skills ?? []) fragments.push(skill.name)
  for (const lang of data.languages ?? []) fragments.push(lang.name)
  for (const cert of data.certifications ?? []) fragments.push(cert.name, cert.issuer)
  for (const interest of data.interests ?? []) fragments.push(interest.name)
  return fragments
    .filter((v): v is string => Boolean(v?.trim()))
    .flatMap((v) => v.split(/\n+/))
    .map(normalize)
    .filter((v) => v.length >= 3)
}

function isRepresented(line: string, fragments: string[]): boolean {
  const n = normalize(line)
  if (n.length < 3) return true
  return fragments.some(
    (f) => f === n || (f.length >= 6 && (f.includes(n) || n.includes(f))),
  )
}

/** Lignes utiles ni extraites, ni placées en « à vérifier » : information réellement perdue. */
export function findOrphanLines(lines: string[], extraction: ResumeExtraction): string[] {
  const fragments = collectFragments(extraction)
  const reviewTexts = new Set((extraction._extraction.review ?? []).map((r) => normalize(r.text)))
  const orphans: string[] = []
  const seen = new Set<string>()
  for (const raw of lines) {
    const line = cleanLine(raw)
    if (line.length < 4 || line.length > 220) continue
    if (classifyHeading(line) || detectSection(line)) continue
    if (isTemplateFooter(line) || isContactLine(line)) continue
    const key = normalize(line)
    if (!key || seen.has(key)) continue
    seen.add(key)
    if (isRepresented(line, fragments) || reviewTexts.has(key)) continue
    orphans.push(line)
  }
  return orphans
}

/** Détecte les incohérences structurelles, indépendamment du format d'entrée. */
export function detectRedFlags(extraction: ResumeExtraction): string[] {
  const flags: string[] = []
  const name = extraction.personalInfo?.fullName?.trim()
  if (!name) {
    flags.push('NAME_MISSING')
  } else {
    if (YEAR_RE.test(name)) flags.push('NAME_HAS_YEAR')
    if (name.split(/\s+/).length > 5) flags.push('NAME_LOOKS_LIKE_SENTENCE')
    if (classifyHeading(name)) flags.push('NAME_IS_HEADING')
  }

  const seenExp = new Set<string>()
  for (const exp of extraction.experiences ?? []) {
    const pos = exp.position?.trim() ?? ''
    if (YEAR_RE.test(pos)) flags.push(`POSITION_HAS_YEAR: "${pos}"`)
    if (DUTY_START_RE.test(pos)) flags.push(`POSITION_IS_DUTY: "${pos}"`)
    if (pos && classifyHeading(pos)) flags.push(`POSITION_IS_HEADING: "${pos}"`)
    const key = normalize(`${pos}|${exp.company ?? ''}`)
    if (key.length > 2 && seenExp.has(key)) flags.push(`DUPLICATE_EXPERIENCE: "${pos}"`)
    seenExp.add(key)
  }

  for (const edu of extraction.educations ?? []) {
    const degree = edu.degree?.trim() ?? ''
    if (DATE_RANGE_RE.test(degree)) flags.push(`DEGREE_HAS_DATE_RANGE: "${degree}"`)
    // « Licence », « Master », « Formation »… sont à la fois des titres de section
    // ET de vrais diplômes : on ne signale que les fuites d'AUTRES sections.
    const kind = degree ? classifyHeading(degree) : null
    if (kind && kind !== 'education' && kind !== 'certifications') {
      flags.push(`DEGREE_IS_HEADING: "${degree}"`)
    }
  }

  return flags
}

export function assessQuality(lines: string[], extraction: ResumeExtraction): QualityReport {
  return {
    overall: extraction._extraction.confidence.overall,
    redFlags: detectRedFlags(extraction),
    orphanLines: findOrphanLines(lines, extraction),
    counts: {
      experiences: extraction.experiences?.length ?? 0,
      educations: extraction.educations?.length ?? 0,
      skills: extraction.skills?.length ?? 0,
      languages: extraction.languages?.length ?? 0,
      reviewItems: extraction._extraction.review?.length ?? 0,
    },
  }
}
