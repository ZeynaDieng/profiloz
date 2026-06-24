import type { DocumentType, ResumeSnapshot } from '@profiloz/shared'

export function useDocumentService() {
  const { upload, post, get } = useApiClient()

  async function uploadDocument(file: File, type: DocumentType) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return upload<{ id: string; status: string; originalName: string }>('/documents/upload', formData)
  }

  async function processDocument(id: string) {
    return post<{ parsedData: Partial<ResumeSnapshot>; confidence?: number }>(`/documents/${id}/process`)
  }

  async function getOcrResult(id: string) {
    return get<{ parsedData: Partial<ResumeSnapshot>; rawText: string; confidence?: number }>(
      `/documents/${id}/ocr-result`,
    )
  }

  async function listDocuments() {
    return get<{
      data: Array<{
        id: string
        type: string
        status: string
        originalName: string
        sizeBytes: number
        createdAt: string
      }>
    }>('/documents')
  }

  async function remove(id: string) {
    const { delete: del } = useApiClient()
    await del(`/documents/${id}`)
  }

  return { uploadDocument, processDocument, getOcrResult, listDocuments, remove }
}
