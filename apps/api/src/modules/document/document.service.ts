import { ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@profiloz/shared'
import { documentTypeSchema } from '@profiloz/validators'
import { AppError } from '@/lib/errors'
import { storageProvider } from '@/lib/storage/local-storage.provider'
import type { RequestContext } from '@/lib/request-context'
import { ocrService } from '@/modules/ocr/ocr.service'
import { documentRepository } from './document.repository'
import { randomUUID } from 'crypto'
import path from 'path'

export class DocumentService {
  async upload(file: File, typeRaw: string, ctx: RequestContext) {
    const type = documentTypeSchema.parse(typeRaw)

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new AppError(413, 'Payload Too Large', 'Fichier trop volumineux (max 10 Mo)')
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw new AppError(422, 'Validation Error', 'Format de fichier non supporté')
    }

    const ext = path.extname(file.name) || '.bin'
    const storageKey = `uploads/${ctx.userId ?? ctx.guestSessionDbId ?? 'anon'}/${randomUUID()}${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await storageProvider.upload(buffer, storageKey, file.type)

    return documentRepository.create({
      type,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storageKey,
      userId: ctx.userId,
      guestSessionId: ctx.guestSessionDbId,
    })
  }

  async process(documentId: string) {
    const doc = await documentRepository.findById(documentId)
    if (!doc) throw new AppError(404, 'Not Found', 'Document introuvable')
    if (doc.ocrResult) return doc.ocrResult

    await documentRepository.updateStatus(documentId, 'PROCESSING')
    const buffer = await storageProvider.read(doc.storageKey)
    const { rawText, confidence } = await ocrService.extractText(buffer, doc.mimeType)
    const parsedData = ocrService.parseStructured(rawText)

    const ocrResult = await documentRepository.saveOcrResult(documentId, {
      rawText,
      parsedData,
      confidence,
    })
    await documentRepository.updateStatus(documentId, 'PARSED')
    return ocrResult
  }

  getById(id: string) {
    return documentRepository.findById(id)
  }

  listForUser(userId: string) {
    return documentRepository.listByUser(userId)
  }

  async remove(id: string, userId: string) {
    const doc = await documentRepository.findById(id)
    if (!doc || doc.userId !== userId) {
      throw new AppError(404, 'Not Found', 'Document introuvable')
    }

    await storageProvider.delete(doc.storageKey)
    const result = await documentRepository.delete(id, userId)
    if (result.count === 0) throw new AppError(404, 'Not Found', 'Document introuvable')
  }
}

export const documentService = new DocumentService()
