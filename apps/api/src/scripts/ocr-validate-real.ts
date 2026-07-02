import { readFile, readdir, writeFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { runOcrDebug } from '../modules/ocr/debug'
import {
  aggregateValidationReport,
  formatValidationReportMarkdown,
  type RealCvGroundTruth,
  validateAgainstGroundTruth,
} from '../modules/ocr/validation/real-corpus'

/**
 * Validation terrain sur cv-samples/ :
 *   - fichiers réels (PDF, DOCX, images) + ground-truth/*.json
 *   - fichiers .txt (texte déjà extrait, sans couche OCR)
 *
 *   pnpm ocr:validate-real
 *   pnpm ocr:validate-real ./cv-samples --report ./cv-samples/reports/latest.md
 */

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
}

async function loadManifest(dir: string): Promise<RealCvGroundTruth[]> {
  const manifestPath = join(dir, 'manifest.json')
  try {
    const raw = await readFile(manifestPath, 'utf8')
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
  try {
    return (await readdir(filesDir)).filter((f) => MIME_BY_EXT[extname(f).toLowerCase()])
  } catch {
    try {
      return (await readdir(dir)).filter((f) => MIME_BY_EXT[extname(f).toLowerCase()])
    } catch {
      return []
    }
  }
}

async function main() {
  const dir = resolve(process.argv[2] ?? 'cv-samples')
  const reportArg = process.argv.indexOf('--report')
  const reportPath = reportArg >= 0 ? resolve(process.argv[reportArg + 1] ?? join(dir, 'reports', 'latest.md')) : join(dir, 'reports', 'latest.md')

  const manifest = await loadManifest(dir)
  const fileNames = await discoverFiles(dir)

  if (!fileNames.length && !manifest.length) {
    console.error(`Aucun CV dans ${dir}/files — voir cv-samples/README.md`)
    process.exit(1)
  }

  const entries: RealCvGroundTruth[] =
    manifest.length > 0
      ? manifest
      : fileNames.map((file) => ({
          id: file.replace(/\.[^.]+$/, ''),
          file: `files/${file}`,
          tags: { source: 'unknown' as const },
        }))

  const validations = []

  for (const entry of entries) {
    const filePath = join(dir, entry.file)
    const ext = extname(entry.file).toLowerCase()
    const mime = MIME_BY_EXT[ext]
    if (!mime) continue

    const buffer = await readFile(filePath)
    const debug = await runOcrDebug(buffer, mime, entry.file)
    const gt = (await loadGroundTruth(dir, entry.id)) ?? entry

    validations.push(
      validateAgainstGroundTruth(gt, debug.parsed, {
        ocrConfidence: debug.extraction.confidence,
        qualityFlags: debug.quality.redFlags,
        orphanLines: debug.quality.orphanLines,
        warnings: debug.extraction.warnings,
        errors: debug.extraction.errors,
      }),
    )

    console.log(
      `${(validations.at(-1)!.rate * 100).toFixed(0).padStart(3)} %  ${entry.id}  (${entry.tags.source ?? entry.tags.tool ?? '?'})`,
    )
  }

  const report = aggregateValidationReport(validations)
  const markdown = formatValidationReportMarkdown(report)

  await writeFile(reportPath, markdown, 'utf8')

  console.log(`\nRapport écrit → ${reportPath}`)
  console.log(`Taux global terrain : ${(report.overallRate * 100).toFixed(1)} %\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
