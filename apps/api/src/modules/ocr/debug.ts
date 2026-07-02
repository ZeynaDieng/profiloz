import type { ExtractionSectionKind } from '@profiloz/shared'
import { normalizeLines } from './ocr.parser'
import { ocrService } from './ocr.service'
import type { OcrExtractDetails } from './ocr.types'
import { runResumePipeline, type ResumeExtraction } from './pipeline'
import { splitBlocks, type SectionBlock } from './pipeline/blocks'
import { assessQuality, type QualityReport } from '../../__tests__/corpus/quality'

export interface OcrDebugReport {
  fileName: string
  mimeType: string
  fileSizeBytes: number
  processedAt: string
  durationMs: number
  extraction: OcrExtractDetails
  lines: string[]
  headerLines: string[]
  blocks: SectionBlock[]
  detectedSections: ExtractionSectionKind[]
  parsed: ResumeExtraction
  quality: QualityReport
  /** Aperçu base64 du document (images / 1re page PDF rendue) — admin uniquement. */
  previewDataUrl?: string
}

async function buildPreviewDataUrl(buffer: Buffer, mimeType: string): Promise<string | undefined> {
  if (mimeType.startsWith('image/')) {
    return `data:${mimeType};base64,${buffer.toString('base64')}`
  }
  if (mimeType === 'application/pdf') {
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
      const { createCanvas } = await import('@napi-rs/canvas')
      const { pathToFileURL } = await import('url')
      const { join } = await import('path')
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
          join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
        ).href
      }
      const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise
      const page = await doc.getPage(1)
      const viewport = page.getViewport({ scale: 1.2 })
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
      const context = canvas.getContext('2d')
      await page.render({
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise
      return `data:image/png;base64,${canvas.toBuffer('image/png').toString('base64')}`
    } catch {
      return undefined
    }
  }
  return undefined
}

/**
 * Pipeline debug complet : OCR → lignes → blocs → extraction → qualité.
 * Réservé à l'administration (diagnostic terrain).
 */
export async function runOcrDebug(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<OcrDebugReport> {
  const started = Date.now()
  const extraction = await ocrService.extractTextDetailed(buffer, mimeType)
  const lines = normalizeLines(extraction.rawText)
  const { headerLines, blocks } = splitBlocks(lines)
  const detectedSections = [...new Set(blocks.map((b) => b.kind))]
  const parsed = await runResumePipeline(extraction.rawText)
  const quality = assessQuality(lines, parsed)
  const previewDataUrl = await buildPreviewDataUrl(buffer, mimeType)

  return {
    fileName,
    mimeType,
    fileSizeBytes: buffer.length,
    processedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    extraction,
    lines,
    headerLines,
    blocks,
    detectedSections,
    parsed,
    quality,
    previewDataUrl,
  }
}
