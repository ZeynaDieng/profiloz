import type { ResumeSnapshot } from '@profiloz/shared'
import { MSG } from '@profiloz/shared'
import type { CoverLetterSnapshot } from '~/types/cover-letter'
import { useApiClient } from '~/composables/useApiClient'
import { getStoredAccessToken } from '~/utils/auth-token'
import { buildCoverLetterPdfFilename } from '~/utils/coverLetterPdfFilename'
import { buildResumePdfFilename, encodeContentDispositionFilename } from '~/utils/resumePdfFilename'

type PdfJobResponse = {
  jobId: string
  status: string
  downloadUrl: string | null
  expiresAt: string
}

type PdfJobStatus = {
  id: string
  status: string
  downloadUrl: string | null
  errorMessage?: string | null
}

const PDF_POLL_INTERVAL_MS = 1000
const PDF_POLL_MAX_ATTEMPTS = 120

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function usePdfService() {
  const { post, get, getDownloadUrl } = useApiClient()

  async function waitForPdfJob(jobId: string): Promise<{ jobId: string; downloadUrl: string }> {
    for (let attempt = 0; attempt < PDF_POLL_MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(PDF_POLL_INTERVAL_MS)

      const job = await get<PdfJobStatus>(`/pdf/jobs/${jobId}`)
      if (job.status === 'completed' && job.downloadUrl) {
        return { jobId: job.id, downloadUrl: job.downloadUrl }
      }
      if (job.status === 'failed') {
        throw {
          status: 503,
          detail: job.errorMessage || MSG.pdf.error,
        }
      }
    }

    throw {
      status: 504,
      detail: MSG.network.timeout,
    }
  }

  async function generateFromSnapshot(snapshot: ResumeSnapshot) {
    const started = await post<PdfJobResponse>('/pdf/generate-from-snapshot', { snapshot })
    if (started.status === 'completed' && started.downloadUrl) {
      return started
    }
    const ready = await waitForPdfJob(started.jobId)
    return {
      ...started,
      status: 'completed',
      downloadUrl: ready.downloadUrl,
    }
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

  async function generateLetterFromSnapshot(snapshot: CoverLetterSnapshot) {
    const started = await post<PdfJobResponse>('/pdf/generate-letter-from-snapshot', { snapshot })
    if (started.status === 'completed' && started.downloadUrl) {
      return started
    }
    const ready = await waitForPdfJob(started.jobId)
    return {
      ...started,
      status: 'completed',
      downloadUrl: ready.downloadUrl,
    }
  }

  async function generateLetterAndDownload(snapshot: CoverLetterSnapshot) {
    const filename = buildCoverLetterPdfFilename(snapshot.senderName)
    const result = await generateLetterFromSnapshot(snapshot)
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
    generateLetterFromSnapshot,
    downloadWithAuth,
    generateAndDownload,
    generateLetterAndDownload,
    downloadResumeCv,
    downloadDossier,
    getDownloadUrl,
  }
}
