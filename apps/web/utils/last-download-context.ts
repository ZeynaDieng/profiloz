export type LastDownloadKind = 'cv' | 'letter'

export type LastDownloadContext = {
  kind: LastDownloadKind
  filename: string
  downloadedAt: string
}

const STORAGE_KEY = 'profiloz:last-download'

function writeSession(value: string) {
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(STORAGE_KEY, value)
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value)
}

function readSession(): string | null {
  if (typeof sessionStorage !== 'undefined') {
    const fromSession = sessionStorage.getItem(STORAGE_KEY)
    if (fromSession) return fromSession
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY)
  }
  return null
}

export function saveLastDownloadContext(context: LastDownloadContext) {
  writeSession(JSON.stringify(context))
}

export function loadLastDownloadContext(): LastDownloadContext | null {
  const raw = readSession()
  if (!raw) return null
  try {
    return JSON.parse(raw) as LastDownloadContext
  } catch {
    return null
  }
}
