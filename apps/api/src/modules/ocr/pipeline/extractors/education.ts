import type { Education } from '@profiloz/shared'
import {
  cleanLine,
  finalizeEducationEntry,
  isBulletLine,
  isContactLine,
  isDateOnlyLine,
  isEducationEntryLine,
  looksLikeLocation,
  parseDateRange,
  parseEducationEntryLine,
  parseEducationLine,
  stripBullet,
} from '../../ocr.parser'

// `\b` indispensable sur les acronymes courts (mba, bac, cap…) : sans frontière,
// « mba » matcherait « Mbao », « bac » matcherait « Baco », etc.
const DEGREE_RE =
  /\b(licence|master|bachelor|bts|dut|doctorat|mba|baccalaur[a-zéè]*|bac|certificat|dipl[oô]me|formation|bfem|cap|brevet|ing[ée]nieur|ann[ée]e)\b/i

function isComplete(entry: Education): boolean {
  return Boolean(entry.degree?.trim() && entry.institution?.trim())
}

function appendField(entry: Education, text: string) {
  if (!entry.field) entry.field = text
  else entry.description = [entry.description, text].filter(Boolean).join('\n')
}

/**
 * Extracteur de formations (sur un bloc isolé). Chaque formation est une entrée
 * indépendante : diplôme, établissement, ville, dates et description éventuelle.
 * Une ligne « diplôme »/entrée datée ou une date seule délimite les entrées.
 */
export function extractEducations(lines: string[]): Education[] {
  const entries: Education[] = []
  let current: Education | null = null

  const flush = () => {
    if (current) {
      const finalized = finalizeEducationEntry(current)
      if (finalized) entries.push(finalized)
    }
    current = null
  }

  for (const rawLine of lines) {
    const line = cleanLine(rawLine)
    if (!line) continue

    // Les coordonnées (tél./email/URL) sans en-tête peuvent atterrir dans ce bloc
    // (mise en page deux colonnes) : elles n'appartiennent pas à une formation.
    if (isContactLine(line)) continue

    // Entrée préfixée par une date : "2021-2022 : Diplôme ...".
    if (isEducationEntryLine(line)) {
      flush()
      current = parseEducationEntryLine(line)
      continue
    }

    // Format « date d'abord » : « de Oct 2024 à Août 2025  En Santé »
    // (la plage de dates précède le diplôme / domaine).
    const dr = parseDateRange(line)
    const rest = cleanLine(dr.rest)
    if ((dr.startDate || dr.endDate) && rest && rest !== line && !looksLikeLocation(rest)) {
      flush()
      current = { degree: rest, institution: '', startDate: dr.startDate, endDate: dr.endDate }
      continue
    }

    // Date seule : complète puis clôt l'entrée en cours.
    if (isDateOnlyLine(line)) {
      const dates = parseDateRange(line)
      if (current) {
        current.startDate ||= dates.startDate
        current.endDate ||= dates.endDate
        flush()
      }
      continue
    }

    if (isBulletLine(line)) {
      if (current) appendField(current, stripBullet(line))
      continue
    }

    // Nouvelle ligne « diplôme » → nouvelle entrée si l'actuelle est complète.
    if (DEGREE_RE.test(line)) {
      const parsed = parseEducationLine(line)
      if (parsed && (!current || isComplete(current))) {
        flush()
        current = parsed
        continue
      }
    }

    if (!current) {
      current = parseEducationLine(line) ?? { degree: line, institution: '' }
      continue
    }

    // Remplissage : établissement → ville → domaine.
    if (!current.institution) current.institution = line
    else if (looksLikeLocation(line) && !current.location) current.location = line
    else appendField(current, line)
  }

  flush()
  return entries.slice(0, 15)
}
