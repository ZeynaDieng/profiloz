export function useApiClient() {
  const config = useRuntimeConfig()

  function getHeaders(contentType = 'application/json'): Record<string, string> {
    const headers: Record<string, string> = {}
    if (contentType) headers['Content-Type'] = contentType

    if (import.meta.client) {
      const guestSessionId = localStorage.getItem('profiloz:guest-session')
      if (guestSessionId) headers['X-Guest-Session-Id'] = guestSessionId

      const authStore = useAuthStore()
      authStore.syncSession()

      const token = getStoredAccessToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  function handleUnauthorized(error: unknown) {
    if (!import.meta.client) return
    const problem = error as { status?: number; detail?: string }
    if (problem.status !== 401) return

    const authStore = useAuthStore()
    if (authStore.isAuthenticated) {
      authStore.logout()
    }
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
    apiBaseUrl: config.public.apiBaseUrl,
  }
}
