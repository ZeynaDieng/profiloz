export function useGuestSession() {
  const guestSessionId = useState<string | null>('guestSessionId', () => null)

  async function ensureSession() {
    if (import.meta.server) return null

    let id = localStorage.getItem('profiloz:guest-session')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('profiloz:guest-session', id)
    }

    guestSessionId.value = id

    const { post } = useApiClient()
    try {
      await post('/guest/session', { sessionId: id })
    } catch {
      // API may be offline during dev
    }

    return id
  }

  onMounted(() => {
    ensureSession()
  })

  return { guestSessionId, ensureSession }
}
