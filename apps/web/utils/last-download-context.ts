export type LastDownloadKind = 'cv' | 'letter'

export type LastDownloadContext = {
  kind: LastDownloadKind
  filename: string
  downloadedAt: string
}

const STORAGE_KEY = 'profiloz:last-download'

export function saveLastDownloadContext(context: LastDownloadContext) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context))
}

export function loadLastDownloadContext(): LastDownloadContext | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as LastDownloadContext
  } catch {
    return null
  }
}
