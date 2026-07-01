import { createRandomId } from '~/utils/random-id'

export function useGuestSession() {
  const guestSessionId = useState<string | null>('guestSessionId', () => null)

  function applyGuestSessionId(id: string) {
    if (import.meta.server || !id.trim()) return
    localStorage.setItem('profiloz:guest-session', id.trim())
    guestSessionId.value = id.trim()
  }

  async function ensureSession() {
    if (import.meta.server) return null

    let id = localStorage.getItem('profiloz:guest-session')
    if (!id) {
      id = createRandomId()
      localStorage.setItem('profiloz:guest-session', id)
    }

    guestSessionId.value = id

    const { post } = useApiClient()
    try {
      await post('/guest/session', { sessionId: id })
    } catch (first) {
      try {
        await post('/guest/session', { sessionId: id })
      } catch {
        throw first
      }
    }

    return id
  }

  onMounted(() => {
    ensureSession().catch(() => {})
  })

  return { guestSessionId, applyGuestSessionId, ensureSession }
}
