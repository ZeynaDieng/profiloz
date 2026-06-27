import type { ResumeSnapshot } from '@profiloz/shared'
import { useApiClient } from '~/composables/useApiClient'
import { getStoredAccessToken } from '~/utils/auth-token'
import { buildResumePdfFilename, encodeContentDispositionFilename } from '~/utils/resumePdfFilename'

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

  async function downloadWithAuth(relativePath: string, filename = 'cv Profiloz.pdf') {
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
    const filename = buildResumePdfFilename(snapshot)
    const result = await generateFromSnapshot(snapshot)
    const downloadUrl = `${result.downloadUrl}?filename=${encodeContentDispositionFilename(filename)}`
    await downloadWithAuth(downloadUrl, filename)
    return { ...result, filename }
  }

  async function downloadResumeCv(resumeId: string, snapshot?: Pick<ResumeSnapshot, 'personalInfo'>) {
    const filename = snapshot ? buildResumePdfFilename(snapshot as ResumeSnapshot) : 'cv Profiloz.pdf'
    const result = await post<{
      jobId: string
      status: string
      downloadUrl: string
      expiresAt: string
    }>(`/resumes/${resumeId}/pdf`)
    const downloadUrl = `${result.downloadUrl}?filename=${encodeContentDispositionFilename(filename)}`
    await downloadWithAuth(downloadUrl, filename)
    return { ...result, filename }
  }

  async function downloadDossier(resumeId: string, snapshot?: Pick<ResumeSnapshot, 'personalInfo'>) {
    const rawName = snapshot?.personalInfo?.fullName?.trim() || 'Profiloz'
    const safeName = rawName
      .replace(/[/\\:*?"<>|]/g, ' ')
      .replace(/[-–—_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const filename = `dossier ${safeName}.pdf`
    const result = await post<{
      jobId: string
      status: string
      downloadUrl: string
      expiresAt: string
    }>(`/resumes/${resumeId}/dossier/pdf`)
    const downloadUrl = `${result.downloadUrl}?filename=${encodeContentDispositionFilename(filename)}`
    await downloadWithAuth(downloadUrl, filename)
    return { ...result, filename }
  }

  return {
    generateFromSnapshot,
    downloadWithAuth,
    generateAndDownload,
    downloadResumeCv,
    downloadDossier,
    getDownloadUrl,
  }
}
