import { ref } from 'vue'

export function useAi() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl || '/api/v1'

  async function enhanceText(text: string, context?: string): Promise<string | null> {
    if (!text || !text.trim()) return text
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${apiBase}/ai/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context }),
      })
      if (!res.ok) {
        throw new Error('Erreur lors de l’amélioration du texte par l’IA')
      }
      const data = await res.json()
      return data.enhancedText || text
    } catch (err: any) {
      error.value = err.message || 'Erreur IA'
      return null
    } finally {
      loading.value = false
    }
  }

  async function suggestBullets(jobTitle: string): Promise<string[]> {
    if (!jobTitle || !jobTitle.trim()) return []
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${apiBase}/ai/suggest-bullets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle }),
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la suggestion de puces par l’IA')
      }
      const data = await res.json()
      return Array.isArray(data.bullets) ? data.bullets : []
    } catch (err: any) {
      error.value = err.message || 'Erreur IA'
      return []
    } finally {
      loading.value = false
    }
  }

  async function generateLetter(input: {
    jobOfferText: string
    candidateInfo?: string
    targetCompany?: string
    targetPosition?: string
  }): Promise<{ content: string; subject: string } | null> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${apiBase}/ai/generate-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la génération de la lettre de motivation')
      }
      return await res.json()
    } catch (err: any) {
      error.value = err.message || 'Erreur IA'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    enhanceText,
    suggestBullets,
    generateLetter,
  }
}
