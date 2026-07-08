import { buildCoverLetterTitle } from '@profiloz/shared'
import { createCoverLetterSchema, updateCoverLetterSchema } from '@profiloz/validators'
import { AppError } from '@/lib/errors'
import type { CoverLetterPdfInput } from '@/modules/pdf/pdf.service'
import { pdfService } from '@/modules/pdf/pdf.service'
import type { EntitlementOwner } from '@/modules/payment/payment.service'
import { paymentService } from '@/modules/payment/payment.service'
import { coverLetterRepository } from './cover-letter.repository'

function toDto(letter: {
  id: string
  title: string
  senderName: string | null
  senderEmail: string | null
  senderPhone: string | null
  senderLocation: string | null
  companyName: string | null
  companyAddress: string | null
  position: string | null
  recruiterName: string | null
  content: string
  closingText: string | null
  templateId: string
  accentColor: string | null
  resumeId: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: letter.id,
    title: letter.title,
    senderName: letter.senderName,
    senderEmail: letter.senderEmail,
    senderPhone: letter.senderPhone,
    senderLocation: letter.senderLocation,
    companyName: letter.companyName,
    companyAddress: letter.companyAddress,
    position: letter.position,
    recruiterName: letter.recruiterName,
    content: letter.content,
    closingText: letter.closingText,
    templateId: letter.templateId,
    accentColor: letter.accentColor,
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
      title: buildCoverLetterTitle(input.senderName),
      senderName: input.senderName ?? null,
      senderEmail: input.senderEmail || null,
      senderPhone: input.senderPhone ?? null,
      senderLocation: input.senderLocation ?? null,
      companyName: input.companyName ?? null,
      companyAddress: input.companyAddress ?? null,
      position: input.position ?? null,
      recruiterName: input.recruiterName ?? null,
      content: input.content,
      closingText: input.closingText ?? null,
      templateId: input.templateId,
      accentColor: input.accentColor ?? null,
      ...(input.resumeId ? { resume: { connect: { id: input.resumeId } } } : {}),
    })
    return toDto(letter)
  }

  async update(id: string, userId: string, body: unknown) {
    const existing = await coverLetterRepository.findById(id, userId)
    if (!existing) throw new AppError(404, 'Not Found', 'Lettre introuvable')

    const input = updateCoverLetterSchema.parse(body)
    const title =
      input.senderName !== undefined
        ? buildCoverLetterTitle(input.senderName)
        : input.title ?? existing.title

    await coverLetterRepository.update(id, userId, {
      title,
      senderName: input.senderName ?? null,
      senderEmail: input.senderEmail || null,
      senderPhone: input.senderPhone ?? null,
      senderLocation: input.senderLocation ?? null,
      companyName: input.companyName ?? null,
      companyAddress: input.companyAddress ?? null,
      position: input.position ?? null,
      recruiterName: input.recruiterName ?? null,
      content: input.content,
      closingText: input.closingText ?? null,
      templateId: input.templateId,
      accentColor: input.accentColor ?? null,
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

  /** Mappe les lettres liées à un CV en entrées prêtes pour le rendu PDF. */
  async listPdfInputsByResume(resumeId: string, userId: string): Promise<CoverLetterPdfInput[]> {
    const letters = await coverLetterRepository.listByResume(resumeId, userId)
    return letters.map((letter) => ({
      templateSlug: letter.templateId,
      title: letter.title,
      senderName: letter.senderName,
      senderEmail: letter.senderEmail,
      senderPhone: letter.senderPhone,
      senderLocation: letter.senderLocation,
      companyName: letter.companyName,
      companyAddress: letter.companyAddress,
      position: letter.position,
      recruiterName: letter.recruiterName,
      content: letter.content,
      closingText: letter.closingText,
      accentColor: letter.accentColor,
    }))
  }

  async generatePdf(id: string, owner: EntitlementOwner) {
    if (!owner.userId) {
      throw new AppError(401, 'Unauthorized', 'Authentification requise')
    }

    const letter = await coverLetterRepository.findById(id, owner.userId)
    if (!letter) throw new AppError(404, 'Not Found', 'Lettre introuvable')

    if (letter.resumeId) {
      await paymentService.unlockResume(owner, letter.resumeId)
    } else {
      await paymentService.assertSnapshotDownload(owner)
    }

    const { jobId, expiresAt } = await pdfService.generateCoverLetterPdf(
      {
        templateSlug: letter.templateId,
        title: letter.title,
        senderName: letter.senderName,
        senderEmail: letter.senderEmail,
        senderPhone: letter.senderPhone,
        senderLocation: letter.senderLocation,
        companyName: letter.companyName,
        companyAddress: letter.companyAddress,
        position: letter.position,
        recruiterName: letter.recruiterName,
        content: letter.content,
        closingText: letter.closingText,
        accentColor: letter.accentColor,
      },
      { userId: owner.userId },
    )

    return {
      jobId,
      status: 'completed',
      downloadUrl: `/pdf/download/${jobId}`,
      expiresAt: expiresAt.toISOString(),
    }
  }
}

export const coverLetterService = new CoverLetterService()
