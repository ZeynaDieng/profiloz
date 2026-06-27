import type { ExtractionReviewItem, ResumeSnapshot } from '@profiloz/shared'
import { cleanLine, detectSection, isBulletLine, isContactLine, isTemplateFooter } from '../ocr.parser'
import { classifyHeading, guessSectionForContent } from './sections'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/** Rassemble tous les fragments de texte déjà représentés dans l'extraction. */
function collectExtractedFragments(data: Partial<ResumeSnapshot>): string[] {
  const fragments: Array<string | undefined> = []
  const p = data.personalInfo
  if (p) fragments.push(p.fullName, p.email, p.phone, p.location, p.jobTitle, p.linkedinUrl, p.websiteUrl)
  fragments.push(data.summary)
  for (const exp of data.experiences ?? []) {
    fragments.push(exp.position, exp.company, exp.location, exp.description)
  }
  for (const edu of data.educations ?? []) {
    fragments.push(edu.degree, edu.institution, edu.field, edu.location)
  }
  for (const skill of data.skills ?? []) fragments.push(skill.name)
  for (const lang of data.languages ?? []) fragments.push(lang.name)
  for (const cert of data.certifications ?? []) fragments.push(cert.name, cert.issuer)
  for (const interest of data.interests ?? []) fragments.push(interest.name)

  return fragments
    .filter((value): value is string => Boolean(value?.trim()))
    .flatMap((value) => value.split(/\n+/))
    .map(normalize)
    .filter((value) => value.length >= 3)
}

function isRepresented(line: string, fragments: string[]): boolean {
  const normalized = normalize(line)
  if (normalized.length < 3) return true
  return fragments.some(
    (fragment) =>
      fragment === normalized ||
      (fragment.length >= 6 && (fragment.includes(normalized) || normalized.includes(fragment))),
  )
}

/**
 * Étape « ne jamais perdre d'information » : toute ligne de contenu utile qui
 * n'apparaît pas dans les données extraites est conservée comme élément
 * « à vérifier », avec une suggestion de section.
 */
export function computeReviewItems(lines: string[], data: Partial<ResumeSnapshot>): ExtractionReviewItem[] {
  const fragments = collectExtractedFragments(data)
  const items: ExtractionReviewItem[] = []
  const seen = new Set<string>()

  for (const rawLine of lines) {
    const line = cleanLine(rawLine)
    if (line.length < 4 || line.length > 220) continue
    if (classifyHeading(line) || detectSection(line)) continue
    if (isTemplateFooter(line)) continue
    if (isContactLine(line)) continue
    if (isBulletLine(line) && line.replace(/^[-•●▪*]\s+/, '').length < 4) continue
    if (isRepresented(line, fragments)) continue

    const key = normalize(line)
    if (!key || seen.has(key)) continue
    seen.add(key)

    items.push({
      id: `review-${items.length + 1}`,
      text: line,
      reason: 'Information non classée automatiquement',
      suggestedSection: guessSectionForContent(line),
      confidence: 0.4,
    })
  }

  return items.slice(0, 30)
}
