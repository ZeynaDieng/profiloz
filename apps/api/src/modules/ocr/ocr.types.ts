/** Métadonnées techniques produites lors de l'extraction OCR (debug / validation). */
export interface OcrExtractDetails {
  rawText: string
  confidence: number
  method: 'pdf-native' | 'pdf-layout' | 'pdf-ocr' | 'tesseract' | 'docx' | 'text' | 'unsupported'
  multiColumn: boolean
  columnCount: number
  pageCount?: number
  warnings: string[]
  errors: string[]
}
