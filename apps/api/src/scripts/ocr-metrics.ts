import { runResumePipeline } from '../modules/ocr/pipeline'
import { corpusCases } from '../__tests__/corpus/cases'
import { aggregate, type FieldKey, type FieldOutcome, scoreCase } from '../__tests__/corpus/metrics'

/**
 * Tableau de bord de fidélité du parser : exécute le corpus de référence (vérité-
 * terrain) et affiche le taux de réussite PAR CHAMP + un score global. À lancer
 * après chaque amélioration pour suivre les progrès et détecter les régressions.
 *
 *   pnpm ocr:metrics            # tableau agrégé
 *   pnpm ocr:metrics --details  # + détail des champs en échec, cas par cas
 */

const FIELD_LABELS: Record<FieldKey, string> = {
  fullName: 'Nom',
  jobTitle: 'Poste',
  email: 'Email',
  experiences: 'Nb expériences',
  experiencePositions: 'Postes (exp.)',
  educations: 'Nb formations',
  skills: 'Nb compétences',
  languages: 'Nb langues',
}

function bar(rate: number): string {
  const filled = Math.round(rate * 20)
  return `${'█'.repeat(filled)}${'░'.repeat(20 - filled)}`
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`.padStart(4)
}

async function main() {
  const details = process.argv.includes('--details')
  const perCase: Array<{ name: string; outcomes: FieldOutcome[] }> = []

  for (const testCase of corpusCases) {
    const ex = await runResumePipeline(testCase.rawText)
    perCase.push({ name: testCase.name, outcomes: scoreCase(testCase, ex) })
  }

  const { rows, overall } = aggregate(perCase.map((c) => c.outcomes))
  rows.sort((a, b) => a.rate - b.rate)

  console.log(`\nMétriques de fidélité du parser — ${corpusCases.length} CV de référence\n`)
  for (const row of rows) {
    console.log(
      `  ${FIELD_LABELS[row.key].padEnd(16)} ${bar(row.rate)} ${pct(row.rate)}  (${row.passed}/${row.total})`,
    )
  }
  console.log(`\n  ${'SCORE GLOBAL'.padEnd(16)} ${bar(overall)} ${pct(overall)}\n`)

  if (details) {
    for (const { name, outcomes } of perCase) {
      const fails = outcomes.filter((o) => !o.ok)
      if (!fails.length) continue
      console.log(`  ✗ ${name}`)
      for (const f of fails) {
        console.log(`      ${FIELD_LABELS[f.key]}: attendu « ${f.expected ?? '?'} » → obtenu « ${f.actual ?? '∅'} »`)
      }
    }
    console.log('')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
