/**
 * Contrôles UX post-parsing (ordre expériences, doublons compétences, etc.).
 */
import type { ResumeSnapshot } from '@profiloz/shared'

export type ImportUxCheckId =
  | 'experiences_ordered'
  | 'educations_separated'
  | 'skills_no_duplicates'
  | 'languages_detected'
  | 'contact_present'
  | 'summary_not_empty'

export interface ImportUxCheck {
  id: ImportUxCheckId
  label: string
  passed: boolean
  detail?: string
}

export interface ImportUxReport {
  passed: boolean
  checks: ImportUxCheck[]
  score: number
}

type SnapshotLike = Partial<ResumeSnapshot>

function normalizeSkillName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parseYearFromDate(d?: string): number | null {
  if (!d) return null
  const m = d.match(/\b(19|20)\d{2}\b/)
  return m ? Number(m[0]) : null
}

export function experiencesChronologicallyOrdered(data: SnapshotLike): ImportUxCheck {
  const exps = data.experiences ?? []
  if (exps.length <= 1) {
    return { id: 'experiences_ordered', label: 'Ordre des expériences', passed: true }
  }
  let prevStart: number | null = null
  for (const exp of exps) {
    const start = parseYearFromDate(exp.startDate) ?? parseYearFromDate(exp.endDate)
    if (start != null && prevStart != null && start > prevStart) {
      return {
        id: 'experiences_ordered',
        label: 'Ordre des expériences',
        passed: false,
        detail: `« ${exp.position ?? exp.company} » (${start}) avant une expérience plus récente (${prevStart})`,
      }
    }
    if (start != null) prevStart = start
  }
  return { id: 'experiences_ordered', label: 'Ordre des expériences', passed: true }
}

export function educationsSeparated(data: SnapshotLike): ImportUxCheck {
  const edus = data.educations ?? []
  const exps = data.experiences ?? []
  if (edus.length === 0) {
    return { id: 'educations_separated', label: 'Formations séparées', passed: true }
  }
  const expKeys = new Set(
    exps.map((e) => `${(e.position ?? '').toLowerCase()}|${(e.company ?? '').toLowerCase()}`),
  )
  for (const edu of edus) {
    const key = `${(edu.degree ?? '').toLowerCase()}|${(edu.institution ?? '').toLowerCase()}`
    if (key !== '|' && expKeys.has(key)) {
      return {
        id: 'educations_separated',
        label: 'Formations séparées',
        passed: false,
        detail: `Formation dupliquée comme expérience : ${edu.degree ?? edu.institution}`,
      }
    }
  }
  return { id: 'educations_separated', label: 'Formations séparées', passed: true }
}

export function skillsNoDuplicates(data: SnapshotLike): ImportUxCheck {
  const skills = data.skills ?? []
  const seen = new Set<string>()
  for (const s of skills) {
    const n = normalizeSkillName(s.name ?? '')
    if (!n) continue
    if (seen.has(n)) {
      return {
        id: 'skills_no_duplicates',
        label: 'Compétences sans doublon',
        passed: false,
        detail: `Doublon détecté : « ${s.name} »`,
      }
    }
    seen.add(n)
  }
  return { id: 'skills_no_duplicates', label: 'Compétences sans doublon', passed: true }
}

export function languagesDetected(data: SnapshotLike): ImportUxCheck {
  const langs = data.languages ?? []
  if (langs.length === 0) {
    return {
      id: 'languages_detected',
      label: 'Langues détectées',
      passed: false,
      detail: 'Aucune langue extraite',
    }
  }
  const invalid = langs.filter((l) => !l.name?.trim())
  if (invalid.length > 0) {
    return {
      id: 'languages_detected',
      label: 'Langues détectées',
      passed: false,
      detail: `${invalid.length} entrée(s) sans nom`,
    }
  }
  return { id: 'languages_detected', label: 'Langues détectées', passed: true }
}

export function contactPresent(data: SnapshotLike): ImportUxCheck {
  const p = data.personalInfo
  const hasEmail = Boolean(p?.email?.trim())
  const hasPhone = Boolean(p?.phone?.trim())
  const hasName = Boolean(p?.fullName?.trim())
  const passed = hasEmail || hasPhone || hasName
  return {
    id: 'contact_present',
    label: 'Coordonnées présentes',
    passed,
    detail: passed ? undefined : 'Ni nom, ni email, ni téléphone',
  }
}

export function summaryNotEmpty(data: SnapshotLike): ImportUxCheck {
  const summary = data.summary?.trim()
  return {
    id: 'summary_not_empty',
    label: 'Profil / résumé',
    passed: Boolean(summary && summary.length >= 20),
    detail: summary ? undefined : 'Résumé absent ou trop court',
  }
}

export function runImportUxChecks(data: SnapshotLike): ImportUxReport {
  const checks: ImportUxCheck[] = [
    contactPresent(data),
    experiencesChronologicallyOrdered(data),
    educationsSeparated(data),
    skillsNoDuplicates(data),
    languagesDetected(data),
    summaryNotEmpty(data),
  ]
  const passedCount = checks.filter((c) => c.passed).length
  return {
    passed: passedCount === checks.length,
    checks,
    score: Math.round((passedCount / checks.length) * 1000) / 10,
  }
}
