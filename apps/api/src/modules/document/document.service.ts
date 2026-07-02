import { ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES, type DocumentType } from '@profiloz/shared'
import { documentTypeSchema } from '@profiloz/validators'
import { AppError } from '@/lib/errors'
import { sanitizeJsonForDb, sanitizeTextForDb } from '@/lib/text-sanitize'
import { storageProvider } from '@/lib/storage'
import type { RequestContext } from '@/lib/request-context'
import { ocrService } from '@/modules/ocr/ocr.service'
import { runResumePipeline } from '@/modules/ocr/pipeline'
import { documentRepository } from './document.repository'
import { randomUUID } from 'crypto'
import path from 'path'

function emptyTextMessage(mimeType: string, documentType: DocumentType): string {
  if (mimeType === 'application/pdf') {
    if (documentType === 'COVER_LETTER') {
      return 'Impossible de lire cette lettre. Utilisez un PDF exporté en texte, un DOCX ou une photo nette.'
    }
    if (documentType === 'DIPLOMA') {
      return 'Impossible de lire ce diplôme. Utilisez une photo nette (JPG/PNG), un PDF exporté en texte, ou un scan de meilleure qualité.'
    }
    if (documentType === 'CERTIFICATE') {
      return 'Impossible de lire cette attestation. Utilisez une photo nette (JPG/PNG) ou un PDF exporté en texte.'
    }
    return 'Ce PDF ne contient pas de texte lisible. Exportez votre CV en PDF texte ou importez un fichier DOCX.'
  }
  if (mimeType.startsWith('image/')) {
    if (documentType === 'DIPLOMA') {
      return 'Impossible de lire le texte sur cette photo de diplôme. Reprenez la photo avec un meilleur éclairage et cadrage.'
    }
    return 'Impossible de lire le texte sur cette image. Essayez un PDF ou DOCX, ou une photo plus nette.'
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'Impossible de lire ce fichier Word. Réenregistrez-le en DOCX et réessayez.'
  }
  return 'Impossible d’extraire le texte de ce document.'
}

export class DocumentService {
  async upload(file: File, typeRaw: string, ctx: RequestContext) {
    const type = documentTypeSchema.parse(typeRaw)

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new AppError(413, 'Payload Too Large', 'Fichier trop volumineux (max 10 Mo)')
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw new AppError(
        422,
        'Validation Error',
        'Format non supporté. Utilisez PDF, DOCX, JPG ou PNG.',
      )
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

  async process(documentId: string, options?: { force?: boolean }) {
    const doc = await documentRepository.findById(documentId)
    if (!doc) throw new AppError(404, 'Not Found', 'Document introuvable')
    if (doc.ocrResult && !options?.force) return doc.ocrResult

    await documentRepository.updateStatus(documentId, 'PROCESSING')

    try {
      const buffer = await storageProvider.read(doc.storageKey)
      let rawText = ''
      let confidence = 0
      const warnings: string[] = []
      const errors: string[] = []

      try {
        const extracted = await ocrService.extractTextDetailed(buffer, doc.mimeType)
        rawText = extracted.rawText
        confidence = extracted.confidence
        warnings.push(...extracted.warnings)
        errors.push(...extracted.errors)
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Erreur de lecture du fichier')
      }

      if (!rawText.trim()) {
        warnings.push(emptyTextMessage(doc.mimeType, doc.type))
        warnings.push('Import partiel : complétez votre profil manuellement à l’étape de relecture.')
      }

      let parsed: Awaited<ReturnType<typeof runResumePipeline>>
      try {
        parsed = (
          doc.type === 'CV'
            ? await runResumePipeline(rawText, { ocrConfidence: confidence })
            : await ocrService.parseStructured(rawText, doc.type, confidence)
        ) as Awaited<ReturnType<typeof runResumePipeline>>
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Erreur lors de l’analyse structurelle')
        parsed = {
          personalInfo: {},
          _extraction: {
            confidence: { overall: 0, personalInfo: {}, experiences: [], educations: [], skills: [], languages: [] },
            review: [],
            detectedSections: [],
            engine: 'heuristic',
            warnings: [],
            errors: [],
            partialImport: true,
          },
        } as Awaited<ReturnType<typeof runResumePipeline>>
      }

      const extraction = parsed._extraction
        ? {
            ...parsed._extraction,
            warnings: [...(parsed._extraction.warnings ?? []), ...warnings],
            errors: errors.length ? errors : parsed._extraction.errors,
            partialImport: !rawText.trim() || warnings.length > 0 || errors.length > 0,
          }
        : undefined

      const parsedData = sanitizeJsonForDb(
        extraction ? { ...parsed, _extraction: extraction } : parsed,
      )

      const ocrResult = await documentRepository.saveOcrResult(documentId, {
        rawText: sanitizeTextForDb(rawText),
        parsedData,
        confidence,
      })
      await documentRepository.updateStatus(documentId, 'PARSED')
      return ocrResult
    } catch (error) {
      await documentRepository.updateStatus(documentId, 'FAILED')
      if (error instanceof AppError) throw error
      throw new AppError(422, 'Unprocessable Entity', 'Impossible d’analyser ce document. Réessayez avec un autre fichier.')
    }
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
