import { createCoverLetterSchema, updateCoverLetterSchema } from '@profiloz/validators'
import { AppError } from '@/lib/errors'
import { pdfService } from '@/modules/pdf/pdf.service'
import { coverLetterRepository } from './cover-letter.repository'

function toDto(letter: {
  id: string
  title: string
  companyName: string | null
  position: string | null
  recruiterName: string | null
  content: string
  templateId: string
  resumeId: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: letter.id,
    title: letter.title,
    companyName: letter.companyName,
    position: letter.position,
    recruiterName: letter.recruiterName,
    content: letter.content,
    templateId: letter.templateId,
    resumeId: letter.resumeId,
    createdAt: letter.createdAt.toISOString(),
    updatedAt: letter.updatedAt.toISOString(),
  }
}

export class CoverLetterService {
  list(userId: string) {
    return coverLetterRepository.listByUser(userId)
  }

  async get(id: string, userId: string) {
    const letter = await coverLetterRepository.findById(id, userId)
    if (!letter) throw new AppError(404, 'Not Found', 'Lettre introuvable')
    return toDto(letter)
  }

  async create(userId: string, body: unknown) {
    const input = createCoverLetterSchema.parse(body)
    const letter = await coverLetterRepository.create(userId, {
      title: input.title,
      companyName: input.companyName,
      position: input.position,
      recruiterName: input.recruiterName,
      content: input.content,
      templateId: input.templateId,
      ...(input.resumeId ? { resume: { connect: { id: input.resumeId } } } : {}),
    })
    return toDto(letter)
  }

  async update(id: string, userId: string, body: unknown) {
    const existing = await coverLetterRepository.findById(id, userId)
    if (!existing) throw new AppError(404, 'Not Found', 'Lettre introuvable')

    const input = updateCoverLetterSchema.parse(body)
    await coverLetterRepository.update(id, userId, {
      title: input.title,
      companyName: input.companyName,
      position: input.position,
      recruiterName: input.recruiterName,
      content: input.content,
      templateId: input.templateId,
      ...(input.resumeId !== undefined
        ? input.resumeId
          ? { resume: { connect: { id: input.resumeId } } }
          : { resume: { disconnect: true } }
        : {}),
    })

    return this.get(id, userId)
  }

  async remove(id: string, userId: string) {
    const result = await coverLetterRepository.delete(id, userId)
    if (result.count === 0) throw new AppError(404, 'Not Found', 'Lettre introuvable')
  }

  async generatePdf(id: string, userId: string) {
    const letter = await coverLetterRepository.findById(id, userId)
    if (!letter) throw new AppError(404, 'Not Found', 'Lettre introuvable')

    const { jobId, expiresAt } = await pdfService.generateCoverLetterPdf({
      title: letter.title,
      companyName: letter.companyName,
      position: letter.position,
      recruiterName: letter.recruiterName,
      content: letter.content,
    })

    return {
      jobId,
      status: 'completed',
      downloadUrl: `/pdf/download/${jobId}`,
      expiresAt: expiresAt.toISOString(),
    }
  }
}

export const coverLetterService = new CoverLetterService()
