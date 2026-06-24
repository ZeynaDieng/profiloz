import type { ResumeSnapshot } from '@profiloz/shared'

export function usePdfService() {
  const { post, getDownloadUrl } = useApiClient()

  async function generateFromSnapshot(snapshot: ResumeSnapshot) {
    return post<{
      jobId: string
      status: string
      downloadUrl: string
      expiresAt: string
    }>('/pdf/generate-from-snapshot', { snapshot })
  }

  async function downloadWithAuth(relativePath: string, filename = 'mon_cv_profiloz.pdf') {
    const url = getDownloadUrl(relativePath)
    const headers: Record<string, string> = {}

    if (import.meta.client) {
      const token = getStoredAccessToken()
      if (token) headers.Authorization = `Bearer ${token}`

      const guestSessionId = localStorage.getItem('profiloz:guest-session')
      if (guestSessionId) headers['X-Guest-Session-Id'] = guestSessionId
    }

    const response = await fetch(url, { headers })
    if (!response.ok) throw new Error('PDF download failed')

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  }

  async function generateAndDownload(snapshot: ResumeSnapshot) {
    const result = await generateFromSnapshot(snapshot)
    await downloadWithAuth(result.downloadUrl)
    return result
  }

  return { generateFromSnapshot, downloadWithAuth, generateAndDownload, getDownloadUrl }
}
