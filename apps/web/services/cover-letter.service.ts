export interface CoverLetter {
  id: string
  title: string
  companyName?: string | null
  position?: string | null
  recruiterName?: string | null
  content: string
  templateId: string
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
    companyName?: string
    position?: string
    recruiterName?: string
    content: string
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
    const result = await post<{ downloadUrl: string }>(`/cover-letters/${id}/pdf`)
    await pdfService.downloadWithAuth(result.downloadUrl)
  }

  return { list, getById, create, update, remove, downloadPdf, getDownloadUrl }
}
