import type { ResumeExtraction } from '../../modules/ocr/pipeline'
import type { CorpusCase } from './cases'

/**
 * Métriques par champ : compare une extraction à la vérité-terrain d'un cas de
 * corpus et produit, champ par champ, un succès/échec. Agrégé sur tout le corpus,
 * cela donne un taux de réussite par champ (nom, poste, expériences…) et un score
 * global — la mesure qui permet de suivre les progrès du parser dans le temps.
 *
 * Contrairement au scorecard (red flags + lignes perdues, binaire), ces métriques
 * mesurent la FIDÉLITÉ : « le nom extrait est-il le bon ? », pas seulement « le
 * résultat est-il structurellement propre ? ».
 */

export type FieldKey =
  | 'fullName'
  | 'jobTitle'
  | 'email'
  | 'experiences'
  | 'experiencePositions'
  | 'educations'
  | 'skills'
  | 'languages'

export interface FieldOutcome {
  key: FieldKey
  ok: boolean
  /** Valeur attendue (pour le rapport de diagnostic). */
  expected?: string
  /** Valeur obtenue (pour le rapport de diagnostic). */
  actual?: string
}

function matches(actual: string | undefined, expected: string | RegExp): boolean {
  if (!actual) return false
  return expected instanceof RegExp ? expected.test(actual) : actual === expected
}

/** Évalue chaque champ pour lequel le cas définit une attente. */
export function scoreCase(testCase: CorpusCase, ex: ResumeExtraction): FieldOutcome[] {
  const e = testCase.expect
  const out: FieldOutcome[] = []
  const exps = ex.experiences ?? []

  if (e.fullName !== undefined) {
    out.push({
      key: 'fullName',
      ok: matches(ex.personalInfo?.fullName, e.fullName),
      expected: String(e.fullName),
      actual: ex.personalInfo?.fullName,
    })
  }
  if (e.jobTitle) {
    out.push({
      key: 'jobTitle',
      ok: matches(ex.personalInfo?.jobTitle, e.jobTitle),
      expected: String(e.jobTitle),
      actual: ex.personalInfo?.jobTitle,
    })
  }
  if (e.email) {
    out.push({ key: 'email', ok: ex.personalInfo?.email === e.email, expected: e.email, actual: ex.personalInfo?.email })
  }
  if (e.minExperiences !== undefined || e.maxExperiences !== undefined) {
    const okMin = e.minExperiences === undefined || exps.length >= e.minExperiences
    const okMax = e.maxExperiences === undefined || exps.length <= e.maxExperiences
    out.push({
      key: 'experiences',
      ok: okMin && okMax,
      expected: `${e.minExperiences ?? 0}..${e.maxExperiences ?? '∞'}`,
      actual: String(exps.length),
    })
  }
  if (e.experiencePositions) {
    const ok = e.experiencePositions.every((p) => exps.some((x) => p.test(x.position ?? '')))
    out.push({
      key: 'experiencePositions',
      ok,
      expected: e.experiencePositions.map((p) => p.source).join(' & '),
      actual: exps.map((x) => x.position).filter(Boolean).join(' | '),
    })
  }
  if (e.minEducations !== undefined) {
    out.push({
      key: 'educations',
      ok: (ex.educations ?? []).length >= e.minEducations,
      expected: `≥${e.minEducations}`,
      actual: String((ex.educations ?? []).length),
    })
  }
  if (e.minSkills !== undefined) {
    out.push({
      key: 'skills',
      ok: (ex.skills ?? []).length >= e.minSkills,
      expected: `≥${e.minSkills}`,
      actual: String((ex.skills ?? []).length),
    })
  }
  if (e.minLanguages !== undefined) {
    out.push({
      key: 'languages',
      ok: (ex.languages ?? []).length >= e.minLanguages,
      expected: `≥${e.minLanguages}`,
      actual: String((ex.languages ?? []).length),
    })
  }
  return out
}

export interface AggregateRow {
  key: FieldKey
  total: number
  passed: number
  rate: number
}

/** Agrège les résultats de plusieurs cas en taux de réussite par champ + global. */
export function aggregate(all: FieldOutcome[][]): { rows: AggregateRow[]; overall: number } {
  const byKey = new Map<FieldKey, { total: number; passed: number }>()
  for (const outcomes of all) {
    for (const o of outcomes) {
      const row = byKey.get(o.key) ?? { total: 0, passed: 0 }
      row.total += 1
      if (o.ok) row.passed += 1
      byKey.set(o.key, row)
    }
  }
  const rows = [...byKey.entries()].map(([key, { total, passed }]) => ({
    key,
    total,
    passed,
    rate: total ? passed / total : 0,
  }))
  const total = rows.reduce((sum, r) => sum + r.total, 0)
  const passed = rows.reduce((sum, r) => sum + r.passed, 0)
  return { rows, overall: total ? passed / total : 0 }
}
