import { readdir, readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { normalizeLines } from '../modules/ocr/ocr.parser'
import { ocrService } from '../modules/ocr/ocr.service'
import { runResumePipeline } from '../modules/ocr/pipeline'
import { assessQuality } from '../__tests__/corpus/quality'

/**
 * Scorecard OCR : dépose des CV (PDF / DOCX / images) dans un dossier et mesure
 * empiriquement l'adaptation du moteur à leurs formats. Pour chaque fichier :
 * confiance, nombre d'expériences/formations, lignes « à vérifier » et drapeaux
 * rouges (date dans le poste, nom suspect, doublon…). Aucune donnée n'est stockée.
 *
 *   pnpm ocr:scorecard              # lit ./cv-samples
 *   pnpm ocr:scorecard ./mon-dossier
 */

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

async function scoreFile(path: string) {
  const mime = MIME_BY_EXT[extname(path).toLowerCase()]
  if (!mime) return null
  const buffer = await readFile(path)
  const { rawText, confidence } = await ocrService.extractText(buffer, mime)
  if (!rawText.trim()) {
    return { ocrConfidence: confidence, empty: true as const }
  }
  const extraction = await runResumePipeline(rawText)
  const quality = assessQuality(normalizeLines(rawText), extraction)
  return {
    ocrConfidence: Number(confidence.toFixed(2)),
    name: extraction.personalInfo?.fullName,
    title: extraction.personalInfo?.jobTitle,
    quality,
  }
}

async function main() {
  const dir = resolve(process.argv[2] ?? 'cv-samples')
  let files: string[]
  try {
    files = (await readdir(dir)).filter((f) => MIME_BY_EXT[extname(f).toLowerCase()])
  } catch {
    console.error(`Dossier introuvable : ${dir}\nCrée-le et dépose des CV, puis relance.`)
    process.exit(1)
  }

  if (!files.length) {
    console.error(`Aucun CV (.pdf/.docx/.png/.jpg) dans ${dir}`)
    process.exit(1)
  }

  console.log(`\nScorecard OCR — ${files.length} fichier(s) dans ${dir}\n`)
  let cleanCount = 0

  for (const file of files.sort()) {
    const result = await scoreFile(join(dir, file))
    if (!result) continue
    if ('empty' in result) {
      console.log(`✗ ${file}\n   texte vide (OCR confiance=${result.ocrConfidence})\n`)
      continue
    }
    const { quality } = result
    const clean = quality.redFlags.length === 0 && quality.orphanLines.length === 0
    if (clean) cleanCount++
    console.log(`${clean ? '✓' : '⚠'} ${file}`)
    console.log(`   nom="${result.name ?? '∅'}"  poste="${result.title ?? '∅'}"  confiance=${quality.overall}`)
    console.log(
      `   exp=${quality.counts.experiences} formations=${quality.counts.educations} ` +
        `compétences=${quality.counts.skills} langues=${quality.counts.languages} à-vérifier=${quality.counts.reviewItems}`,
    )
    if (quality.redFlags.length) console.log(`   🚩 ${quality.redFlags.join(' | ')}`)
    if (quality.orphanLines.length) console.log(`   ⛔ info perdue: ${quality.orphanLines.slice(0, 5).join(' | ')}`)
    console.log('')
  }

  console.log(`Résumé : ${cleanCount}/${files.length} sans drapeau ni perte d'information.\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
