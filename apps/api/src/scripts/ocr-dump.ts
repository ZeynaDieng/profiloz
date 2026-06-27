import { readdir, readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { normalizeLines } from '../modules/ocr/ocr.parser'
import { ocrService } from '../modules/ocr/ocr.service'
import { runResumePipeline } from '../modules/ocr/pipeline'

/**
 * Dump détaillé d'extraction : pour chaque CV, affiche le rawText reconstruit (tronqué)
 * puis le JSON structuré (nom, poste, expériences, formations…). Sert à inspecter
 * manuellement la fidélité de l'extraction et identifier les corrections P1 à faire.
 *
 *   npx tsx src/scripts/ocr-dump.ts ./mon-dossier [N]   # N = nb de fichiers max
 */

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

async function main() {
  const dir = resolve(process.argv[2] ?? 'cv-samples')
  const limit = Number(process.argv[3] ?? '999')
  const files = (await readdir(dir)).filter((f) => MIME_BY_EXT[extname(f).toLowerCase()]).sort().slice(0, limit)

  for (const file of files) {
    const buffer = await readFile(join(dir, file))
    const mime = MIME_BY_EXT[extname(file).toLowerCase()]!
    const { rawText, confidence } = await ocrService.extractText(buffer, mime)
    console.log(`\n${'='.repeat(78)}\nFICHIER: ${file}  (OCR conf=${confidence.toFixed(2)})`)
    if (!rawText.trim()) {
      console.log('  ⛔ TEXTE VIDE')
      continue
    }
    const lines = normalizeLines(rawText)
    console.log(`\n--- LIGNES NORMALISÉES (${lines.length}) ---`)
    lines.slice(0, 40).forEach((l, i) => console.log(`  ${String(i).padStart(2)}│ ${l}`))

    const ex = await runResumePipeline(rawText)
    console.log('\n--- EXTRACTION ---')
    console.log(`  nom:    ${ex.personalInfo?.fullName ?? '∅'}`)
    console.log(`  poste:  ${ex.personalInfo?.jobTitle ?? '∅'}`)
    console.log(`  email:  ${ex.personalInfo?.email ?? '∅'}   tél: ${ex.personalInfo?.phone ?? '∅'}   lieu: ${ex.personalInfo?.location ?? '∅'}`)
    console.log(`  EXPÉRIENCES (${ex.experiences?.length ?? 0}):`)
    for (const e of ex.experiences ?? []) {
      console.log(`    • [${e.startDate ?? '?'}–${e.isCurrent ? 'présent' : e.endDate ?? '?'}] "${e.position ?? '∅'}" @ "${e.company ?? '∅'}" ${e.location ? `(${e.location})` : ''}`)
    }
    console.log(`  FORMATIONS (${ex.educations?.length ?? 0}):`)
    for (const e of ex.educations ?? []) {
      console.log(`    • [${e.startDate ?? '?'}–${e.endDate ?? '?'}] "${e.degree ?? '∅'}" @ "${e.institution ?? '∅'}" ${e.field ? `{${e.field}}` : ''}`)
    }
    console.log(`  COMPÉTENCES (${ex.skills?.length ?? 0}): ${(ex.skills ?? []).map((s) => s.name).join(' · ')}`)
    console.log(`  LANGUES (${ex.languages?.length ?? 0}): ${(ex.languages ?? []).map((l) => `${l.name}${l.level ? `(${l.level})` : ''}`).join(' · ')}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
