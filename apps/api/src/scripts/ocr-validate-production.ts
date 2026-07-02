import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { runOcrDebug } from '../modules/ocr/debug'
import {
  aggregateProductionReport,
  formatProductionReportMarkdown,
  type ProductionDocumentValidation,
} from '../modules/ocr/validation/production-corpus'
import {
  type RealCvGroundTruth,
  validateAgainstGroundTruth,
} from '../modules/ocr/validation/real-corpus'
import { runImportUxChecks } from '../modules/ocr/validation/import-ux-checks'

/**
 * Validation production sur cv-samples/production/ :
 *   pipeline complet sur fichiers binaires (PDF, DOCX, JPG, PNG)
 *   + contrôles UX post-parsing
 *
 *   pnpm ocr:validate-production
 *   pnpm ocr:validate-production ./cv-samples/production
 */

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
}

const BINARY_EXT = new Set(['.pdf', '.docx', '.jpg', '.jpeg', '.png'])

async function loadManifest(dir: string): Promise<RealCvGroundTruth[]> {
  try {
    const raw = await readFile(join(dir, 'manifest.json'), 'utf8')
    const parsed = JSON.parse(raw) as { entries: RealCvGroundTruth[] }
    return parsed.entries ?? []
  } catch {
    return []
  }
}

async function loadGroundTruth(dir: string, id: string): Promise<RealCvGroundTruth | null> {
  try {
    const raw = await readFile(join(dir, 'ground-truth', `${id}.json`), 'utf8')
    return JSON.parse(raw) as RealCvGroundTruth
  } catch {
    return null
  }
}

async function discoverFiles(dir: string): Promise<string[]> {
  const filesDir = join(dir, 'files')
  const found: string[] = []

  async function walk(current: string, prefix: string) {
    let entries: string[]
    try {
      entries = await readdir(current, { withFileTypes: true }).then((rows) =>
        rows.map((r) => (r.isDirectory() ? `__dir__:${r.name}` : r.name)),
      )
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.startsWith('__dir__:')) {
        const name = entry.slice('__dir__:'.length)
        await walk(join(current, name), prefix ? `${prefix}/${name}` : name)
      } else if (MIME_BY_EXT[extname(entry).toLowerCase()]) {
        found.push(prefix ? `files/${prefix}/${entry}` : `files/${entry}`)
      }
    }
  }

  await walk(filesDir, '')
  return found
}

async function main() {
  const dir = resolve(process.argv[2] ?? 'cv-samples/production')
  const reportArg = process.argv.indexOf('--report')
  const reportPath =
    reportArg >= 0
      ? resolve(process.argv[reportArg + 1] ?? join(dir, 'reports', 'latest.md'))
      : join(dir, 'reports', 'latest.md')

  const manifest = await loadManifest(dir)
  const fileNames = await discoverFiles(dir)

  if (!fileNames.length && !manifest.length) {
    console.error(`Aucun fichier dans ${dir}/files/ — voir cv-samples/production/README.md`)
    process.exit(1)
  }

  const entries: RealCvGroundTruth[] =
    manifest.length > 0
      ? manifest
      : fileNames.map((file) => ({
          id: file.replace(/^files\//, '').replace(/\.[^.]+$/, '').replace(/\//g, '-'),
          file,
          tags: { source: 'unknown' as const },
        }))

  const validations: ProductionDocumentValidation[] = []

  for (const entry of entries) {
    const filePath = join(dir, entry.file)
    const ext = extname(entry.file).toLowerCase()
    const mime = MIME_BY_EXT[ext]
    if (!mime) continue

    const buffer = await readFile(filePath)
    const debug = await runOcrDebug(buffer, mime, entry.file)
    const gt = (await loadGroundTruth(dir, entry.id)) ?? entry
    const isBinary = BINARY_EXT.has(ext)

    const fieldValidation = validateAgainstGroundTruth(gt, debug.parsed, {
      ocrConfidence: debug.extraction.confidence,
      qualityFlags: debug.quality.redFlags,
      orphanLines: debug.quality.orphanLines,
      warnings: debug.extraction.warnings,
      errors: debug.extraction.errors,
    })

    const ux = runImportUxChecks(debug.parsed)

    validations.push({
      ...fieldValidation,
      mimeType: mime,
      isBinary,
      pipelineMs: debug.durationMs,
      ux,
    })

    const kind = entry.tags.source ?? entry.tags.tool ?? ext
    console.log(
      `${(fieldValidation.rate * 100).toFixed(0).padStart(3)} %  UX ${ux.score.toFixed(0).padStart(3)} %  ${entry.id}  (${kind}${isBinary ? ', binaire' : ''})`,
    )
  }

  const report = aggregateProductionReport(validations)
  const markdown = formatProductionReportMarkdown(report)

  await mkdir(join(dir, 'reports'), { recursive: true })
  await writeFile(reportPath, markdown, 'utf8')

  console.log(`\nRapport écrit → ${reportPath}`)
  console.log(`Exactitude globale : ${(report.overallRate * 100).toFixed(1)} %`)
  console.log(`Exactitude binaires : ${(report.binaryOnlyRate * 100).toFixed(1)} %`)
  console.log(`Score UX moyen : ${report.overallUxScore.toFixed(1)} %\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
