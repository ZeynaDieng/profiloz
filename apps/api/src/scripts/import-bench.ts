/**
 * Banc d'essai de l'import : passe chaque fichier par le vrai pipeline (OCR + heuristiques + IA).
 * Usage : npx tsx src/scripts/import-bench.ts fichier1.pdf fichier2.png …
 */
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import { ocrService } from '../modules/ocr/ocr.service'
import { runResumePipeline } from '../modules/ocr/pipeline'
import { geminiLlmEnhancer } from '../modules/ocr/pipeline/gemini'

const MIME: Record<string, string> = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }

async function main() {
for (const file of process.argv.slice(2)) {
  const buffer = readFileSync(file)
  const mimeType = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream'
  const started = Date.now()
  const text = await ocrService.extractTextDetailed(buffer, mimeType)
  const result = await runResumePipeline(text.rawText, { ocrConfidence: text.confidence, llm: geminiLlmEnhancer, buffer, mimeType })
  const pi = result.personalInfo ?? {}
  console.log(JSON.stringify({
    fichier: file.split('/').pop(),
    secondes: Math.round((Date.now() - started) / 100) / 10,
    ocr: Math.round(text.confidence * 100) / 100,
    moteur: result._extraction.engine,
    avertissements: result._extraction.warnings ?? [],
    nom: pi.fullName, titre: pi.jobTitle, email: pi.email, tel: pi.phone, ville: pi.location, photo: Boolean(pi.photoUrl),
    resume: result.summary?.slice(0, 60),
    experiences: (result.experiences ?? []).map((e) => `${e.position} @ ${e.company} [${e.startDate ?? '?'}→${e.isCurrent ? 'actuel' : e.endDate ?? '?'}] ${(e.description ?? '').split('\n').length} lignes`),
    formations: (result.educations ?? []).map((e) => `${e.degree} @ ${e.institution}`),
    competences: (result.skills ?? []).length,
    langues: (result.languages ?? []).map((l) => `${l.name}:${l.level ?? '-'}`),
  }, null, 1))
}
}

void main()
