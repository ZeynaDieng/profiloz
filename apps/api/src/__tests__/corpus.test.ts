import { afterAll, describe, expect, it } from 'vitest'
import { normalizeLines } from '../modules/ocr/ocr.parser'
import { runResumePipeline } from '../modules/ocr/pipeline'
import { type CorpusCase, corpusCases } from './corpus/cases'
import { assessQuality } from './corpus/quality'

/**
 * Test du corpus de référence : garantit que le moteur s'adapte à des formats
 * variés (1 colonne, 2 colonnes, étudiant, tech, libellés, exécutif…) et bloque
 * toute régression. Deux invariants indépendants du format :
 *   • aucune information perdue (orphanLines vide),
 *   • aucune incohérence structurelle (redFlags vide).
 */

function matchValue(actual: string | undefined, expected: string | RegExp): boolean {
  if (!actual) return false
  return expected instanceof RegExp ? expected.test(actual) : actual === expected
}

const summary: Array<{ name: string; ok: boolean; overall: number; flags: number; orphans: number }> = []

describe('Corpus CV — adaptation multi-formats', () => {
  it.each(corpusCases.map((c) => [c.name, c] as const))('%s', async (_name, testCase: CorpusCase) => {
    const { expect: exp } = testCase
    const extraction = await runResumePipeline(testCase.rawText)
    const lines = normalizeLines(testCase.rawText)
    const quality = assessQuality(lines, extraction)

    let ok = true
    const check = (condition: boolean) => {
      if (!condition) ok = false
      return condition
    }

    try {
      // Invariants durs réservés aux cas synthétiques maîtrisés. Les cas réels
      // anonymisés difficiles (strict: false) n'imposent pas « zéro info perdue /
      // zéro drapeau » — ils servent à mesurer les progrès via les métriques.
      if (testCase.strict !== false) {
        expect(check(quality.orphanLines.length === 0), `info perdue: ${quality.orphanLines.join(' | ')}`).toBe(true)
        expect(check(quality.redFlags.length === 0), `red flags: ${quality.redFlags.join(' | ')}`).toBe(true)
      }

      // Attentes propres au cas — assertions dures uniquement pour les cas stricts.
      // Pour les cas réels (strict: false), on n'échoue pas : leur fidélité est
      // suivie par `pnpm ocr:metrics` (et le résumé ci-dessous).
      if (testCase.strict !== false) {
        if (exp.fullName !== undefined) {
          expect(check(matchValue(extraction.personalInfo?.fullName, exp.fullName))).toBe(true)
        }
        if (exp.jobTitle) {
          expect(check(matchValue(extraction.personalInfo?.jobTitle, exp.jobTitle))).toBe(true)
        }
        if (exp.email) {
          expect(check(extraction.personalInfo?.email === exp.email)).toBe(true)
        }
        const exps = extraction.experiences ?? []
        const edus = extraction.educations ?? []
        if (exp.minExperiences !== undefined) expect(check(exps.length >= exp.minExperiences)).toBe(true)
        if (exp.maxExperiences !== undefined) expect(check(exps.length <= exp.maxExperiences)).toBe(true)
        if (exp.minEducations !== undefined) expect(check(edus.length >= exp.minEducations)).toBe(true)
        if (exp.minSkills !== undefined) expect(check((extraction.skills ?? []).length >= exp.minSkills)).toBe(true)
        if (exp.minLanguages !== undefined) expect(check((extraction.languages ?? []).length >= exp.minLanguages)).toBe(true)
        if (exp.experiencePositions) {
          for (const pattern of exp.experiencePositions) {
            expect(check(exps.some((e) => pattern.test(e.position ?? '')))).toBe(true)
          }
        }
      }
    } finally {
      summary.push({
        name: testCase.name,
        ok,
        overall: quality.overall,
        flags: quality.redFlags.length,
        orphans: quality.orphanLines.length,
      })
    }
  })

  afterAll(() => {
    const passed = summary.filter((s) => s.ok).length
    const lines = summary
      .map((s) => `  ${s.ok ? '✓' : '✗'} ${s.name.padEnd(32)} conf=${s.overall} flags=${s.flags} orphelins=${s.orphans}`)
      .join('\n')
    // eslint-disable-next-line no-console
    console.log(
      `\n[Corpus CV] ${passed}/${summary.length} formats OK\n${lines}\n`,
    )
  })
})
