import type { DocumentType, ResumeSnapshot } from '@profiloz/shared'

export function useImportFlow(documentType: DocumentType) {
  const documentService = useDocumentService()

  const state = ref<'idle' | 'processing' | 'preview' | 'error'>('idle')
  const progress = ref(0)
  const fileName = ref('')
  const extractedData = ref<Partial<ResumeSnapshot>>({})
  const errorMessage = ref('')

  async function processFile(file: File) {
    fileName.value = file.name
    state.value = 'processing'
    progress.value = 10
    errorMessage.value = ''

    try {
      const uploaded = await documentService.uploadDocument(file, documentType)
      progress.value = 45

      const result = await documentService.processDocument(uploaded.id)
      progress.value = 100
      extractedData.value = result.parsedData ?? {}
      state.value = 'preview'
    } catch {
      errorMessage.value = "Impossible d'analyser le document. Vérifiez le format et réessayez."
      state.value = 'error'
    }
  }

  function reset() {
    state.value = 'idle'
    progress.value = 0
    fileName.value = ''
    extractedData.value = {}
    errorMessage.value = ''
  }

  return { state, progress, fileName, extractedData, errorMessage, processFile, reset }
}
