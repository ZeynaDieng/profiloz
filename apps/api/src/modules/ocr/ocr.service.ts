import type { DocumentType } from '@profiloz/shared'
import { PSM } from 'tesseract.js'
import { parseDocumentText } from './ocr.parser'
import { runResumePipeline } from './pipeline'
import { geminiLlmEnhancer } from './pipeline/gemini'
import { repairSpacedOutText, scoreExtractedPdfText, measureSpacedOutScore } from './text-repair'
import { preprocessImageForOcr } from './image-preprocess'
import type { OcrExtractDetails } from './ocr.types'

const OCR_TIMEOUT_MS = 90_000
export const MIN_NATIVE_PDF_TEXT = 80
/** Score minimal du texte PDF natif pour éviter l'OCR (sinon scan mal lu). */
export const MIN_NATIVE_PDF_SCORE = 0.75
const MIN_OCR_WORDS_FOR_COLUMNS = 6
const MAX_OCR_PDF_PAGES = 5
const PDF_OCR_RENDER_SCALE = 3

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function shouldFallbackToPdfOcr(nativeText: string): boolean {
  const trimmed = nativeText.trim()
  if (trimmed.length < MIN_NATIVE_PDF_TEXT) return true
  if (scoreExtractedPdfText(trimmed) < MIN_NATIVE_PDF_SCORE) return true
  if (measureSpacedOutScore(trimmed) > 0.35) return true
  return false
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return (result.value ?? '').trim()
  } catch {
    return ''
  }
}

type OcrWordBbox = { x0: number; y0: number; x1: number; y1: number }
type OcrWord = { text: string; bbox?: OcrWordBbox }

/**
 * Convertit les mots OCR (avec bbox) en items génériques pour la reconstruction
 * par colonnes. L'axe Y image va vers le BAS : on le nie pour adopter la
 * convention « plus grand = plus haut » (comme le PDF).
 */
function mapOcrWords(blocks: unknown): { items: MappedItem[]; tol: number } {
  const items: MappedItem[] = []
  const heights: number[] = []
  for (const block of (blocks as any[]) ?? [])
    for (const paragraph of block?.paragraphs ?? [])
      for (const line of paragraph?.lines ?? [])
        for (const word of (line?.words ?? []) as OcrWord[]) {
          const str = word.text ?? ''
          const bbox = word.bbox
          if (!str.trim() || !bbox) continue
          const width = bbox.x1 - bbox.x0
          if (width <= 0) continue
          items.push({ str, x: bbox.x0, y: -bbox.y0, width })
          heights.push(bbox.y1 - bbox.y0)
        }

  // Tolérance verticale = ~0,8 × hauteur médiane des mots.
  heights.sort((a, b) => a - b)
  const median = heights.length ? heights[Math.floor(heights.length / 2)]! : 16
  return { items, tol: Math.max(6, median * 0.8) }
}

async function recognizeImage(
  worker: Awaited<ReturnType<typeof import('tesseract.js').createWorker>>,
  buffer: Buffer,
): Promise<{ text: string; confidence: number; multiColumn: boolean }> {
  const preprocessed = await preprocessImageForOcr(buffer)
  const result = await withTimeout(
    worker.recognize(preprocessed, {}, { blocks: true, text: true }),
    OCR_TIMEOUT_MS,
    'OCR timeout',
  )
  const confidence = (result.data.confidence ?? 50) / 100
  const { items, tol } = mapOcrWords((result.data as any).blocks)

  if (items.length >= MIN_OCR_WORDS_FOR_COLUMNS) {
    const { lines, multiColumn } = reconstructFromMappedItems(items, tol)
    const text = repairSpacedOutText(lines.join('\n').trim())
    if (text) return { text, confidence, multiColumn }
  }
  const flat = repairSpacedOutText((result.data.text ?? '').trim())
  return { text: flat, confidence, multiColumn: false }
}

async function ocrImageBuffers(
  buffers: Buffer[],
): Promise<{ rawText: string; confidence: number; multiColumn: boolean }> {
  if (!buffers.length) return { rawText: '', confidence: 0, multiColumn: false }

  try {
    const { createWorker } = await import('tesseract.js')
    const worker = await withTimeout(createWorker('fra+eng'), OCR_TIMEOUT_MS, 'OCR timeout')

    try {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO_OSD,
      })
    } catch {
      /* paramètres optionnels selon version tesseract.js */
    }

    const parts: string[] = []
    let totalConfidence = 0
    let sawMultiColumn = false

    try {
      for (const buffer of buffers) {
        const { text, confidence, multiColumn } = await recognizeImage(worker, buffer)
        if (text) parts.push(text)
        totalConfidence += confidence
        if (multiColumn) sawMultiColumn = true
      }
    } finally {
      await worker.terminate()
    }

    return {
      rawText: repairSpacedOutText(parts.join('\n\n').trim()),
      confidence: buffers.length ? totalConfidence / buffers.length : 0,
      multiColumn: sawMultiColumn,
    }
  } catch {
    return { rawText: '', confidence: 0, multiColumn: false }
  }
}

async function ocrImageBuffer(
  buffer: Buffer,
): Promise<{ rawText: string; confidence: number; multiColumn: boolean }> {
  return ocrImageBuffers([buffer])
}

async function configurePdfJs(pdfjs: typeof import('pdfjs-dist/legacy/build/pdf.mjs')) {
  if (pdfjs.GlobalWorkerOptions.workerSrc) return
  const { join } = await import('path')
  const { pathToFileURL } = await import('url')
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
    join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
  ).href
}

type PdfTextItem = {
  str: string
  transform: number[]
  width?: number
  hasEOL?: boolean
}

function estimateTextItemWidth(str: string, transform: number[]): number {
  if (transform[0]) return Math.abs(transform[0]) * Math.max(str.length, 1)
  return str.length * 6
}

type MappedItem = { str: string; x: number; y: number; width: number; hasEOL?: boolean }

function mapTextItems(items: unknown[]): MappedItem[] {
  const textItems = items.filter(
    (item): item is PdfTextItem =>
      typeof item === 'object' &&
      item !== null &&
      'str' in item &&
      'transform' in item &&
      typeof (item as PdfTextItem).str === 'string',
  )

  return textItems
    .map((item) => ({
      str: item.str,
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
      width: item.width ?? estimateTextItemWidth(item.str, item.transform),
      hasEOL: item.hasEOL,
    }))
    .filter((item) => item.str.trim())
}

/**
 * Supprime les surimpressions : le même texte dessiné plusieurs fois à la même
 * position (simulation de gras/ombre dans certains modèles) qui produit sinon
 * « ExpériencesExpériencesExpériences ».
 */
function dedupeOverprintedItems(items: MappedItem[]): MappedItem[] {
  const seen = new Set<string>()
  const out: MappedItem[] = []
  for (const item of items) {
    const key = `${Math.round(item.x / 2)}:${Math.round(item.y / 2)}:${item.str}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

/**
 * Détecte une ou plusieurs gouttières verticales (1, 2 ou 3 colonnes).
 * Renvoie les abscisses de coupe triées, ou [] si mono-colonne.
 */
function detectColumnBoundaries(items: MappedItem[]): number[] {
  if (items.length < 12) return []
  const minLeft = Math.min(...items.map((i) => i.x))
  const maxRight = Math.max(...items.map((i) => i.x + i.width))
  const pageWidth = maxRight - minLeft
  if (pageWidth <= 0) return []

  const BINS = 80
  const binWidth = pageWidth / BINS
  const covered = new Array<number>(BINS).fill(0)
  for (const item of items) {
    const start = Math.max(0, Math.floor((item.x - minLeft) / binWidth))
    const end = Math.min(BINS - 1, Math.floor((item.x + item.width - minLeft) / binWidth))
    for (let b = start; b <= end; b++) covered[b] = (covered[b] ?? 0) + 1
  }

  const lo = Math.floor(BINS * 0.12)
  const hi = Math.ceil(BINS * 0.88)
  const gutters: Array<{ start: number; len: number }> = []
  let curStart = -1
  let curLen = 0
  for (let b = lo; b <= hi; b++) {
    if (covered[b] === 0) {
      if (curLen === 0) curStart = b
      curLen++
    } else {
      if (curLen >= 2) gutters.push({ start: curStart, len: curLen })
      curLen = 0
    }
  }
  if (curLen >= 2) gutters.push({ start: curStart, len: curLen })

  const splits = gutters
    .map((g) => minLeft + (g.start + g.len / 2) * binWidth)
    .filter((splitX) => {
      const leftCount = items.filter((i) => i.x + i.width / 2 < splitX).length
      const rightCount = items.length - leftCount
      return leftCount >= items.length * 0.08 && rightCount >= items.length * 0.08
    })
    .sort((a, b) => a - b)

  // Fusionne les gouttières trop proches (< 8 % de la largeur).
  const merged: number[] = []
  for (const split of splits) {
    if (!merged.length || split - merged[merged.length - 1]! > pageWidth * 0.08) merged.push(split)
  }
  return merged.slice(0, 3)
}

/** @deprecated Utiliser detectColumnBoundaries — conservé pour compatibilité tests internes. */
function detectColumnSplitX(items: MappedItem[]): number | null {
  const boundaries = detectColumnBoundaries(items)
  return boundaries[0] ?? null
}

// `tol` = tolérance verticale pour regrouper les fragments d'une même ligne.
// ~4 pour les points PDF ; pour l'OCR image (pixels), on la dérive de la hauteur
// médiane des mots.
function groupItemsTopDown(items: MappedItem[], tol = 4): string[] {
  const sortTol = tol * 0.75
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) > sortTol) return b.y - a.y
    return a.x - b.x
  })

  const lines: string[] = []
  let currentLine = ''
  let lastY: number | null = null
  let lastEndX: number | null = null
  const yThreshold = tol

  for (const item of sorted) {
    if (lastY !== null && Math.abs(item.y - lastY) > yThreshold) {
      if (currentLine.trim()) lines.push(currentLine.trim())
      currentLine = item.str
      lastEndX = item.x + item.width
    } else if (currentLine.length > 0) {
      const gap = lastEndX !== null ? item.x - lastEndX : 0
      // Seuil basé sur la largeur d'UN caractère (et non du mot entier), sinon
      // des mots voisins se collent (« lespatients »).
      const charWidth = item.width / Math.max(item.str.length, 1)
      const spaceThreshold = Math.max(1, charWidth * 0.3)
      const endsCleanly = /[\s'’-]$/.test(currentLine) || /^[\s'’-]/.test(item.str)
      if (gap > spaceThreshold && !endsCleanly) currentLine += ' '
      currentLine += item.str
      lastEndX = item.x + item.width
    } else {
      currentLine = item.str
      lastEndX = item.x + item.width
    }
    lastY = item.y

    if (item.hasEOL) {
      if (currentLine.trim()) lines.push(currentLine.trim())
      currentLine = ''
      lastY = null
      lastEndX = null
    }
  }

  if (currentLine.trim()) lines.push(currentLine.trim())
  return lines
}

/**
 * Cœur commun PDF/OCR : déduplique les surimpressions, détecte une éventuelle
 * mise en page deux colonnes et reconstruit le texte en lisant chaque colonne de
 * haut en bas (colonne la plus dense d'abord). C'est ce qui empêche la barre
 * latérale de s'entrelacer avec le contenu principal.
 */
function reconstructFromMappedItems(
  items: MappedItem[],
  tol = 4,
): { lines: string[]; multiColumn: boolean } {
  const mapped = dedupeOverprintedItems(items)
  if (!mapped.length) return { lines: [], multiColumn: false }

  const boundaries = detectColumnBoundaries(mapped)
  if (!boundaries.length) return { lines: groupItemsTopDown(mapped, tol), multiColumn: false }

  const minLeft = Math.min(...mapped.map((i) => i.x))
  const maxRight = Math.max(...mapped.map((i) => i.x + i.width))
  const cuts = [minLeft, ...boundaries, maxRight]

  const columns: MappedItem[][] = []
  for (let i = 0; i < cuts.length - 1; i++) {
    const lo = cuts[i]!
    const hi = cuts[i + 1]!
    const col = mapped.filter((item) => {
      const center = item.x + item.width / 2
      return center >= lo && (i === cuts.length - 2 ? center <= hi : center < hi)
    })
    if (col.length) columns.push(col)
  }

  if (columns.length <= 1) return { lines: groupItemsTopDown(mapped, tol), multiColumn: false }

  // 2 colonnes : barre latérale d'abord (colonne la plus dense).
  // 3+ colonnes : lecture gauche → droite.
  const ordered =
    columns.length === 2
      ? [...columns].sort(
          (a, b) =>
            b.reduce((sum, item) => sum + item.str.length, 0) -
            a.reduce((sum, item) => sum + item.str.length, 0),
        )
      : columns

  return {
    lines: ordered.flatMap((col) => groupItemsTopDown(col, tol)),
    multiColumn: true,
  }
}

function groupPdfTextItemsIntoLines(items: unknown[]): { lines: string[]; multiColumn: boolean } {
  return reconstructFromMappedItems(mapTextItems(items))
}

async function extractPdfTextWithLayout(buffer: Buffer): Promise<{ text: string; multiColumn: boolean }> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  await configurePdfJs(pdfjs)

  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise
  const pages: string[] = []
  let multiColumn = false

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()
    const grouped = groupPdfTextItemsIntoLines(content.items)
    if (grouped.multiColumn) multiColumn = true
    pages.push(grouped.lines.join('\n'))
  }

  return { text: pages.join('\n\n').trim(), multiColumn }
}

async function extractPdfNativeText(buffer: Buffer): Promise<string> {
  let pdfParseText = ''
  let layoutText = ''
  let multiColumn = false

  try {
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    pdfParseText = (data.text ?? '').trim()
  } catch {
    /* fallback below */
  }

  try {
    const layout = await extractPdfTextWithLayout(buffer)
    layoutText = layout.text
    multiColumn = layout.multiColumn
  } catch {
    /* fallback below */
  }

  // Sur une mise en page multi-colonnes, pdf-parse entrelace les colonnes :
  // la reconstruction par colonnes (layout) fait alors autorité. Sinon, on
  // garde le texte le mieux noté.
  const bestText =
    multiColumn && layoutText
      ? layoutText
      : scoreExtractedPdfText(layoutText) > scoreExtractedPdfText(pdfParseText)
        ? layoutText
        : pdfParseText

  return repairSpacedOutText(bestText)
}

async function renderPdfPagesToImages(buffer: Buffer): Promise<Buffer[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  await configurePdfJs(pdfjs)
  const { createCanvas } = await import('@napi-rs/canvas')

  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise
  const pageCount = Math.min(doc.numPages, MAX_OCR_PDF_PAGES)
  const images: Buffer[] = []
  const scale = PDF_OCR_RENDER_SCALE

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const page = await doc.getPage(pageNumber)
    const viewport = page.getViewport({ scale })
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
    const context = canvas.getContext('2d')

    await page.render({
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise

    images.push(canvas.toBuffer('image/png'))
  }

  return images
}

async function ocrScannedPdf(
  buffer: Buffer,
): Promise<{ rawText: string; confidence: number; multiColumn: boolean }> {
  try {
    const images = await withTimeout(
      renderPdfPagesToImages(buffer),
      OCR_TIMEOUT_MS,
      'PDF render timeout',
    )
    return ocrImageBuffers(images)
  } catch {
    return { rawText: '', confidence: 0, multiColumn: false }
  }
}

function emptyDetails(partial: Partial<OcrExtractDetails> = {}): OcrExtractDetails {
  return {
    rawText: '',
    confidence: 0,
    method: 'unsupported',
    multiColumn: false,
    columnCount: 1,
    warnings: [],
    errors: [],
    ...partial,
  }
}

export class OcrService {
  async extractText(buffer: Buffer, mimeType: string): Promise<{ rawText: string; confidence: number }> {
    const detailed = await this.extractTextDetailed(buffer, mimeType)
    return { rawText: detailed.rawText, confidence: detailed.confidence }
  }

  /** Extraction avec métadonnées (debug, validation terrain). */
  async extractTextDetailed(buffer: Buffer, mimeType: string): Promise<OcrExtractDetails> {
    if (mimeType === 'application/pdf') {
      const warnings: string[] = []
      const errors: string[] = []
      try {
        let multiColumn = false
        let pageCount: number | undefined
        try {
          const layout = await extractPdfTextWithLayout(buffer)
          multiColumn = layout.multiColumn
        } catch {
          warnings.push('Impossible d’analyser la mise en page PDF (layout).')
        }

        try {
          const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
          await configurePdfJs(pdfjs)
          const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise
          pageCount = doc.numPages
        } catch {
          /* optionnel */
        }

        const nativeText = await extractPdfNativeText(buffer)
        if (!shouldFallbackToPdfOcr(nativeText)) {
          const nativeScore = scoreExtractedPdfText(nativeText)
          return emptyDetails({
            rawText: nativeText,
            confidence: Math.min(0.92, 0.65 + nativeScore * 0.15),
            method: multiColumn ? 'pdf-layout' : 'pdf-native',
            multiColumn,
            columnCount: multiColumn ? 2 : 1,
            pageCount,
            warnings,
          })
        }

        warnings.push('Texte natif insuffisant — bascule OCR Tesseract sur le PDF.')
        const ocrResult = await ocrScannedPdf(buffer)
        if (ocrResult.rawText.trim()) {
          return emptyDetails({
            rawText: ocrResult.rawText,
            confidence: ocrResult.confidence,
            method: 'pdf-ocr',
            multiColumn: ocrResult.multiColumn || multiColumn,
            columnCount: ocrResult.multiColumn || multiColumn ? 2 : 1,
            pageCount,
            warnings,
          })
        }

        if (nativeText) {
          warnings.push('OCR PDF vide — repli sur le texte natif partiel.')
          return emptyDetails({
            rawText: nativeText,
            confidence: 0.35,
            method: 'pdf-native',
            multiColumn,
            columnCount: multiColumn ? 2 : 1,
            pageCount,
            warnings,
          })
        }

        errors.push('PDF illisible : aucun texte natif ni OCR.')
        return emptyDetails({ method: 'pdf-ocr', pageCount, warnings, errors })
      } catch (error) {
        const ocrResult = await ocrScannedPdf(buffer)
        if (ocrResult.rawText.trim()) {
          return emptyDetails({
            rawText: ocrResult.rawText,
            confidence: ocrResult.confidence,
            method: 'pdf-ocr',
            multiColumn: ocrResult.multiColumn,
            columnCount: ocrResult.multiColumn ? 2 : 1,
            warnings: ['Erreur extraction native — OCR de secours utilisé.'],
          })
        }
        return emptyDetails({
          errors: [error instanceof Error ? error.message : 'PDF illisible'],
        })
      }
    }

    if (mimeType.startsWith('image/')) {
      const result = await ocrImageBuffer(buffer)
      const warnings: string[] = []
      if (!result.rawText.trim()) warnings.push('Aucun texte détecté sur l’image.')
      if (result.confidence < 0.5) {
        warnings.push(
          'Qualité de scan faible — le préremplissage sera limité. Utilisez un PDF exporté en texte ou une photo plus nette, bien éclairée et cadrée.',
        )
      }
      return emptyDetails({
        rawText: result.rawText,
        confidence: result.confidence,
        method: 'tesseract',
        multiColumn: result.multiColumn,
        columnCount: result.multiColumn ? 2 : 1,
        warnings,
      })
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const rawText = await extractDocxText(buffer)
      return emptyDetails({
        rawText,
        confidence: rawText.length > 40 ? 0.8 : 0.2,
        method: 'docx',
        warnings: rawText.length <= 40 ? ['Texte DOCX très court.'] : [],
      })
    }

    if (mimeType === 'text/plain') {
      return emptyDetails({
        rawText: buffer.toString('utf8'),
        confidence: 1,
        method: 'text',
      })
    }

    return emptyDetails({ errors: [`Format non supporté : ${mimeType}`] })
  }

  async parseStructured(rawText: string, documentType: DocumentType = 'CV', ocrConfidence?: number) {
    if (documentType === 'CV') {
      return runResumePipeline(rawText, { ocrConfidence, llm: geminiLlmEnhancer })
    }
    return parseDocumentText(rawText, documentType)
  }
}

export const ocrService = new OcrService()
