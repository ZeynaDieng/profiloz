import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { runResumePipeline } from '../modules/ocr/pipeline'
import { corpusCases } from '../__tests__/corpus/cases'
import { aggregate, type FieldKey, scoreCase } from '../__tests__/corpus/metrics'

/**
 * Benchmark OCR/parser : exécute le corpus et produit un rapport par catégorie.
 * Peut sauvegarder une baseline et comparer avant/après une amélioration.
 *
 *   pnpm ocr:benchmark              # rapport courant
 *   pnpm ocr:benchmark --save       # sauvegarde baseline
 *   pnpm ocr:benchmark --compare    # compare à la baseline
 */

const BASELINE_PATH = join(process.cwd(), 'src/__tests__/corpus/baseline.json')

const FIELD_LABELS: Record<FieldKey, string> = {
  fullName: 'Identité (nom)',
  jobTitle: 'Identité (poste)',
  email: 'Coordonnées (email)',
  experiences: 'Expériences (nombre)',
  experiencePositions: 'Expériences (postes)',
  educations: 'Formations',
  skills: 'Compétences',
  languages: 'Langues',
}

const CATEGORY_MAP: Record<FieldKey, string> = {
  fullName: 'identité',
  jobTitle: 'identité',
  email: 'coordonnées',
  experiences: 'expériences',
  experiencePositions: 'expériences',
  educations: 'formations',
  skills: 'compétences',
  languages: 'langues',
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

async function runBenchmark() {
  const perCase = []
  for (const testCase of corpusCases) {
    const ex = await runResumePipeline(testCase.rawText)
    perCase.push({ name: testCase.name, outcomes: scoreCase(testCase, ex) })
  }
  const { rows, overall } = aggregate(perCase.map((c) => c.outcomes))
  return { rows, overall, corpusSize: corpusCases.length, at: new Date().toISOString() }
}

function printReport(label: string, result: Awaited<ReturnType<typeof runBenchmark>>) {
  console.log(`\n${label} — ${result.corpusSize} CV — ${result.at}\n`)
  for (const row of result.rows.sort((a, b) => a.key.localeCompare(b.key))) {
    console.log(`  ${FIELD_LABELS[row.key].padEnd(28)} ${pct(row.rate).padStart(7)}  (${row.passed}/${row.total})`)
  }

  const byCategory = new Map<string, { passed: number; total: number }>()
  for (const row of result.rows) {
    const cat = CATEGORY_MAP[row.key]
    const cur = byCategory.get(cat) ?? { passed: 0, total: 0 }
    cur.passed += row.passed
    cur.total += row.total
    byCategory.set(cat, cur)
  }

  console.log('\n  Par catégorie :')
  for (const [cat, { passed, total }] of [...byCategory.entries()].sort()) {
    console.log(`    ${cat.padEnd(16)} ${pct(total ? passed / total : 0).padStart(7)}  (${passed}/${total})`)
  }
  console.log(`\n  SCORE GLOBAL ${pct(result.overall)}\n`)
}

async function main() {
  const save = process.argv.includes('--save')
  const compare = process.argv.includes('--compare')
  const current = await runBenchmark()

  if (save) {
    writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2))
    console.log(`Baseline sauvegardée → ${BASELINE_PATH}`)
  }

  printReport('Rapport OCR / parser (local, sans IA)', current)

  if (compare && existsSync(BASELINE_PATH)) {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as Awaited<ReturnType<typeof runBenchmark>>
    console.log('Comparaison avant / après (baseline → courant)\n')
    const baselineMap = new Map(baseline.rows.map((r) => [r.key, r.rate]))
    for (const row of current.rows) {
      const before = baselineMap.get(row.key) ?? 0
      const delta = row.rate - before
      const sign = delta >= 0 ? '+' : ''
      console.log(
        `  ${FIELD_LABELS[row.key].padEnd(28)} ${pct(before).padStart(7)} → ${pct(row.rate).padStart(7)}  (${sign}${(delta * 100).toFixed(1)} pts)`,
      )
    }
    const deltaOverall = current.overall - baseline.overall
    const sign = deltaOverall >= 0 ? '+' : ''
    console.log(`\n  GLOBAL ${pct(baseline.overall)} → ${pct(current.overall)} (${sign}${(deltaOverall * 100).toFixed(1)} pts)\n`)
  } else if (compare) {
    console.log('Aucune baseline trouvée. Lancez `pnpm ocr:benchmark --save` d\'abord.\n')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
