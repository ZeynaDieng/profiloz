import type { ExtractionMeta, ResumeSnapshot } from '@profiloz/shared'
import { callGemini, GEMINI_MODELS, type GeminiPart, isGeminiConfigured, parseJsonOutput } from '@/lib/gemini'
import type { LlmEnhancer } from './llm'
import { cropPhotoFromBuffer, compressImageForAi } from './crop-photo'
import { mergeLlmResume, normalizeLlmResume } from './llm-normalize'
import { renderPdfPagesToImages } from '../ocr.service'

/** Lecture d'un CV entier (souvent en image) : plus long qu'un texte court de l'éditeur. */
const IMPORT_TIMEOUT_MS = 40_000
const IMPORT_BUDGET_MS = 70_000
/** Au-delà, le PDF n'est pas joint (le texte extrait suffit et l'appel resterait rapide). */
const MAX_INLINE_BYTES = 15 * 1024 * 1024
const MAX_RAW_TEXT = 20_000

const PROMPT = `Tu es un expert de l'extraction de CV. Le document de CV est joint (PDF ou image). Quand un texte extrait automatiquement figure plus bas, il peut avoir un ordre de colonnes mélangé : fie-toi d'abord au document joint.

RÈGLES ABSOLUES :
- Recopie le contenu TEL QU'IL EST ÉCRIT : ne reformule pas, ne traduis pas, ne résume pas, ne corrige que les erreurs de lecture évidentes.
- N'invente RIEN : un champ absent du CV vaut null (ou une liste vide).
- Extrais TOUTES les expériences et formations, sans en omettre, avec la description complète de chaque expérience (une mission par ligne, préfixée par "- ").
- Email et téléphone : lis-les sur le document joint, caractère par caractère ; le texte extrait confond souvent 0/o, 1/l/I et 5/S.
- Dates : recopie-les comme écrites ("03/2021", "2019", "Janvier 2020"). Pour un poste en cours, endDate = null et isCurrent = true.
- Compétences : une entrée par compétence (pas de liste séparée par des virgules dans un seul nom).
- Langues : le nom de la langue dans "name", le niveau tel qu'écrit dans "level".
- Photo : si une photo de portrait du candidat est présente, donne sa boîte [ymin, xmin, ymax, xmax] (0 à 1000) recadrée ÉTROITEMENT sur le visage et le haut des épaules, sans cadre, bordure ni motif décoratif.

Réponds UNIQUEMENT avec ce JSON :
{
  "personalInfo": { "fullName": string|null, "jobTitle": string|null, "email": string|null, "phone": string|null, "location": string|null, "linkedinUrl": string|null, "websiteUrl": string|null },
  "summary": string|null,
  "photo": { "present": boolean, "box": [number, number, number, number]|null },
  "experiences": [ { "position": string, "company": string, "location": string|null, "startDate": string|null, "endDate": string|null, "isCurrent": boolean, "description": string|null } ],
  "educations": [ { "degree": string, "institution": string, "field": string|null, "location": string|null, "startDate": string|null, "endDate": string|null, "description": string|null } ],
  "skills": [ { "name": string, "level": string|null, "category": string|null } ],
  "languages": [ { "name": string, "level": string|null } ],
  "certifications": [ { "name": string, "issuer": string|null, "issueDate": string|null } ],
  "interests": [ { "name": string } ]
}`

async function documentPart(buffer?: Buffer, mimeType?: string): Promise<GeminiPart | null> {
  if (!buffer || !mimeType) return null
  if (mimeType.startsWith('image/')) {
    const compressed = await compressImageForAi(buffer, undefined, mimeType)
    return { inlineData: { mimeType: compressed.mimeType, data: compressed.buffer.toString('base64') } }
  }
  if (mimeType === 'application/pdf' && buffer.length <= MAX_INLINE_BYTES) {
    return { inlineData: { mimeType, data: buffer.toString('base64') } }
  }
  return null
}

async function cropPhoto(
  box: [number, number, number, number],
  buffer: Buffer,
  mimeType?: string,
): Promise<string | undefined> {
  try {
    let image: Buffer | null = null
    if (mimeType?.startsWith('image/')) image = buffer
    else if (mimeType === 'application/pdf') image = (await renderPdfPagesToImages(buffer))[0] ?? null
    if (!image) return undefined
    return (await cropPhotoFromBuffer(image, box)) || undefined
  } catch (error) {
    console.warn('[import] recadrage photo impossible :', (error as Error).message)
    return undefined
  }
}

export class GeminiLlmEnhancer implements LlmEnhancer {
  readonly name = GEMINI_MODELS[0]!

  async enhance(input: {
    rawText: string
    lines: string[]
    data: Partial<ResumeSnapshot>
    meta: ExtractionMeta
    buffer?: Buffer
    mimeType?: string
  }): Promise<{ data: Partial<ResumeSnapshot>; meta: ExtractionMeta }> {
    const unchanged = { data: input.data, meta: { ...input.meta, engine: 'heuristic' as const } }
    if (!isGeminiConfigured()) return unchanged

    try {
      const parts: GeminiPart[] = []
      const doc = await documentPart(input.buffer, input.mimeType)
      if (doc) parts.push(doc)
      // Image : le texte de l'OCR (Tesseract) est surtout du bruit que le modèle recopie (« 0n715… »
      // au lieu de « on715… ») ; il lit mieux l'image seule. PDF, DOCX : le texte natif est exact.
      const isImage = input.mimeType?.startsWith('image/') ?? false
      const rawText = isImage && doc ? '' : input.rawText.slice(0, MAX_RAW_TEXT)
      if (!doc && !rawText.trim()) return unchanged
      parts.push({
        text: rawText
          ? `${PROMPT}\n\nTexte extrait automatiquement :\n---\n${rawText}\n---`
          : `${PROMPT}\n\nLis le CV directement sur l'image jointe.`,
      })

      const output = await callGemini({
        parts,
        json: true,
        temperature: 0.1,
        maxOutputTokens: 8192,
        timeoutMs: IMPORT_TIMEOUT_MS,
        budgetMs: IMPORT_BUDGET_MS,
        label: 'import',
      })
      if (!output) return unchanged

      let parsed: unknown
      try {
        parsed = parseJsonOutput(output)
      } catch {
        console.warn('[import] JSON IA illisible')
        return unchanged
      }
      const llm = normalizeLlmResume(parsed)
      if (!llm) {
        console.warn('[import] réponse IA sans contenu de CV')
        return unchanged
      }

      const merged = mergeLlmResume(input.data, llm, input.rawText, Boolean(doc))
      if (llm.photoBox && input.buffer) {
        const photoUrl = await cropPhoto(llm.photoBox, input.buffer, input.mimeType)
        if (photoUrl) merged.personalInfo = { ...merged.personalInfo, photoUrl }
      }

      return { data: merged, meta: { ...input.meta, engine: 'heuristic+llm' } }
    } catch (error) {
      console.warn('[import] analyse IA en erreur :', (error as Error).message)
      return unchanged
    }
  }
}

export const geminiLlmEnhancer = new GeminiLlmEnhancer()
