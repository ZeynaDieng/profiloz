import type { CoverLetterSnapshot, CoverLetterTemplateSlug } from '~/types/cover-letter'
import { normalizeCoverLetterTemplateSlug } from '~/types/cover-letter'
import {
  buildCoverLetterPdfFilename,
} from '~/utils/coverLetterPdfFilename'
import { encodeContentDispositionFilename } from '~/utils/resumePdfFilename'

export interface CoverLetter {
  id: string
  title: string
  senderName?: string | null
  senderEmail?: string | null
  senderPhone?: string | null
  senderLocation?: string | null
  companyName?: string | null
  companyAddress?: string | null
  position?: string | null
  recruiterName?: string | null
  content: string
  closingText?: string | null
  templateId: string
  accentColor?: string | null
  resumeId?: string | null
  createdAt: string
  updatedAt: string
}

export function useCoverLetterService() {
  const { get, post, getDownloadUrl } = useApiClient()
  const pdfService = usePdfService()

  async function list() {
    return get<{ data: CoverLetter[] }>('/cover-letters')
  }

  async function getById(id: string) {
    return get<CoverLetter>(`/cover-letters/${id}`)
  }

  async function create(payload: {
    title?: string
    senderName?: string
    senderEmail?: string
    senderPhone?: string
    senderLocation?: string
    companyName?: string
    companyAddress?: string
    position?: string
    recruiterName?: string
    content: string
    closingText?: string
    templateId?: CoverLetterTemplateSlug
    accentColor?: string
    resumeId?: string
  }) {
    return post<CoverLetter>('/cover-letters', payload)
  }

  async function update(id: string, payload: Partial<CoverLetter>) {
    const { patch } = useApiClient()
    return patch<CoverLetter>(`/cover-letters/${id}`, payload)
  }

  async function remove(id: string) {
    const config = useRuntimeConfig()
    const headers: Record<string, string> = {}
    if (import.meta.client) {
      const token = localStorage.getItem('profiloz:access-token')
      if (token) headers.Authorization = `Bearer ${token}`
    }
    await fetch(`${config.public.apiBaseUrl}/cover-letters/${id}`, { method: 'DELETE', headers })
  }

  async function downloadPdf(id: string) {
    const letter = await getById(id)
    const filename = buildCoverLetterPdfFilename(letter.senderName)
    const result = await post<{ downloadUrl: string }>(`/cover-letters/${id}/pdf`)
    const downloadUrl = `${result.downloadUrl}?filename=${encodeContentDispositionFilename(filename)}`
    await pdfService.downloadWithAuth(downloadUrl, filename)
    return { filename }
  }

  function toSnapshot(letter: Partial<CoverLetter> & { content: string; accentColor?: string | null }): CoverLetterSnapshot {
    return {
      templateSlug: normalizeCoverLetterTemplateSlug(letter.templateId),
      title: letter.title ?? undefined,
      senderName: letter.senderName ?? undefined,
      senderEmail: letter.senderEmail ?? undefined,
      senderPhone: letter.senderPhone ?? undefined,
      senderLocation: letter.senderLocation ?? undefined,
      companyName: letter.companyName ?? undefined,
      companyAddress: letter.companyAddress ?? undefined,
      position: letter.position ?? undefined,
      recruiterName: letter.recruiterName ?? undefined,
      content: letter.content,
      closingText: letter.closingText ?? undefined,
      accentColor: letter.accentColor ?? undefined,
    }
  }

  return { list, getById, create, update, remove, downloadPdf, getDownloadUrl, toSnapshot }
}
