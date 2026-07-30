export function useApiClient() {
  const config = useRuntimeConfig()

  function getHeaders(contentType = 'application/json'): Record<string, string> {
    const headers: Record<string, string> = {}
    if (contentType) headers['Content-Type'] = contentType

    if (import.meta.client) {
      const guestSessionId = localStorage.getItem('profiloz:guest-session')
      if (guestSessionId) headers['X-Guest-Session-Id'] = guestSessionId

      const token = getStoredAccessToken()
      if (token) {
        try {
          const parts = token.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              localStorage.removeItem('profiloz:access-token')
            } else {
              headers.Authorization = `Bearer ${token}`
            }
          } else {
            headers.Authorization = `Bearer ${token}`
          }
        } catch {
          headers.Authorization = `Bearer ${token}`
        }
      }
    }

    return headers
  }

  function handleUnauthorized(error: unknown) {
    if (!import.meta.client) return
    const problem = error as { status?: number; detail?: string }
    if (problem.status !== 401) return

    localStorage.removeItem('profiloz:access-token')
  }

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData
    const headers = {
      ...getHeaders(isFormData ? '' : 'application/json'),
      ...(options.headers as Record<string, string>),
    }
    if (isFormData) delete headers['Content-Type']

    const response = await fetch(`${config.public.apiBaseUrl}${path}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      handleUnauthorized(error)
      throw error
    }

    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }

  async function upload<T>(path: string, formData: FormData): Promise<T> {
    return request<T>(path, { method: 'POST', body: formData })
  }

  function getDownloadUrl(path: string) {
    const base = config.public.apiBaseUrl.replace(/\/$/, '')
    if (path.startsWith('http')) return path

    let normalized = path
    if (normalized.startsWith('/api/v1')) {
      normalized = normalized.slice('/api/v1'.length)
    }
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`
    }

    return `${base}${normalized}`
  }

  async function download(path: string, filename: string) {
    const headers = getHeaders('')
    delete headers['Content-Type']
    const response = await fetch(`${config.public.apiBaseUrl}${path}`, { headers })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      handleUnauthorized(error)
      throw error
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    delete: async (path: string) => {
      const headers = getHeaders('')
      delete headers['Content-Type']
      const response = await fetch(`${config.public.apiBaseUrl}${path}`, { method: 'DELETE', headers })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        handleUnauthorized(error)
        throw error
      }
    },
    upload,
    getDownloadUrl,
    download,
    apiBaseUrl: config.public.apiBaseUrl,
  }
}
