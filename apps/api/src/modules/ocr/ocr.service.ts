import { parseResumeText } from './ocr.parser'

export class OcrService {
  async extractText(buffer: Buffer, mimeType: string): Promise<{ rawText: string; confidence: number }> {
    if (mimeType === 'application/pdf') {
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(buffer)
      return { rawText: data.text ?? '', confidence: 0.85 }
    }

    if (mimeType.startsWith('image/')) {
      try {
        const { createWorker } = await import('tesseract.js')
        const worker = await createWorker('fra+eng')
        const {
          data: { text, confidence },
        } = await worker.recognize(buffer)
        await worker.terminate()
        return { rawText: text, confidence: (confidence ?? 50) / 100 }
      } catch {
        return { rawText: '', confidence: 0 }
      }
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return { rawText: buffer.toString('utf8').replace(/[^\x20-\x7EÀ-ÿ\n\r\t]/g, ' '), confidence: 0.4 }
    }

    return { rawText: '', confidence: 0 }
  }

  parseStructured(rawText: string) {
    return parseResumeText(rawText)
  }
}

export const ocrService = new OcrService()
