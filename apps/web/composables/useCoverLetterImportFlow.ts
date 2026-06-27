import type { CoverLetterImportData } from '@profiloz/shared'
import { parseApiAuthError } from '~/utils/api-error'

const PROCESS_TIMEOUT_MS = 120_000

export function useCoverLetterImportFlow() {
  const documentService = useDocumentService()
  const { ensureSession } = useGuestSession()
  const config = useRuntimeConfig()

  const state = ref<'idle' | 'processing' | 'preview' | 'error'>('idle')
  const progress = ref(0)
  const fileName = ref('')
  const extractedData = ref<CoverLetterImportData>({ content: '' })
  const errorMessage = ref('')

  async function processDocumentWithTimeout(id: string) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROCESS_TIMEOUT_MS)

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (import.meta.client) {
      const guestSessionId = localStorage.getItem('profiloz:guest-session')
      if (guestSessionId) headers['X-Guest-Session-Id'] = guestSessionId

      const authStore = useAuthStore()
      authStore.syncSession()
      const token = getStoredAccessToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${config.public.apiBaseUrl}/documents/${id}/process`, {
        method: 'POST',
        headers,
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw error
      }

      return (await response.json()) as { parsedData: CoverLetterImportData; confidence?: number }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw {
          detail:
            'L’analyse a pris trop de temps. Privilégiez un PDF texte ou un DOCX plutôt qu’une photo ou un scan.',
        }
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  async function processFile(file: File) {
    fileName.value = file.name
    state.value = 'processing'
    progress.value = 10
    errorMessage.value = ''

    try {
      await ensureSession()
      progress.value = 20

      const uploaded = await documentService.uploadDocument(file, 'COVER_LETTER')
      progress.value = 45

      const result = await processDocumentWithTimeout(uploaded.id)
      progress.value = 100
      extractedData.value = {
        content: result.parsedData?.content ?? '',
        senderName: result.parsedData?.senderName,
        senderEmail: result.parsedData?.senderEmail,
        senderPhone: result.parsedData?.senderPhone,
        senderLocation: result.parsedData?.senderLocation,
        companyName: result.parsedData?.companyName,
        position: result.parsedData?.position,
        recruiterName: result.parsedData?.recruiterName,
        closingText: result.parsedData?.closingText,
      }
      state.value = 'preview'
    } catch (error) {
      errorMessage.value = parseApiAuthError(
        error,
        "Impossible d'analyser la lettre. Vérifiez le format et réessayez.",
      )
      state.value = 'error'
    }
  }

  function reset() {
    state.value = 'idle'
    progress.value = 0
    fileName.value = ''
    extractedData.value = { content: '' }
    errorMessage.value = ''
  }

  return { state, progress, fileName, extractedData, errorMessage, processFile, reset }
}
