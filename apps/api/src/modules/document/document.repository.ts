import type { DocumentStatus, DocumentType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export class DocumentRepository {
  create(data: {
    type: DocumentType
    originalName: string
    mimeType: string
    sizeBytes: number
    storageKey: string
    userId?: string
    guestSessionId?: string
  }) {
    return prisma.document.create({ data })
  }

  findById(id: string) {
    return prisma.document.findUnique({ where: { id }, include: { ocrResult: true } })
  }

  updateStatus(id: string, status: DocumentStatus) {
    return prisma.document.update({ where: { id }, data: { status } })
  }

  listByUser(userId: string) {
    return prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { ocrResult: true },
    })
  }

  delete(id: string, userId: string) {
    return prisma.document.deleteMany({
      where: { id, userId },
    })
  }

  saveOcrResult(documentId: string, data: { rawText: string; parsedData: object; confidence?: number }) {
    return prisma.ocrResult.create({
      data: {
        documentId,
        rawText: data.rawText,
        parsedData: data.parsedData,
        confidence: data.confidence,
      },
    })
  }
}

export const documentRepository = new DocumentRepository()
