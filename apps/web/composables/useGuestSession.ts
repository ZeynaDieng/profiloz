import { createRandomId } from '~/utils/random-id'

let inflightEnsure: Promise<string | null> | null = null
let lastSyncedSessionId: string | null = null

export function useGuestSession() {
  const guestSessionId = useState<string | null>('guestSessionId', () => null)

  function applyGuestSessionId(id: string) {
    if (import.meta.server || !id.trim()) return
    const trimmed = id.trim()
    localStorage.setItem('profiloz:guest-session', trimmed)
    guestSessionId.value = trimmed
    if (lastSyncedSessionId !== trimmed) {
      lastSyncedSessionId = null
    }
  }

  async function ensureSession() {
    if (import.meta.server) return null
    if (inflightEnsure) return inflightEnsure

    inflightEnsure = (async () => {
      let id = localStorage.getItem('profiloz:guest-session')
      if (!id) {
        id = createRandomId()
        localStorage.setItem('profiloz:guest-session', id)
      }

      guestSessionId.value = id

      if (lastSyncedSessionId === id) {
        return id
      }

      const { post } = useApiClient()
      try {
        await post('/guest/session', { sessionId: id })
        lastSyncedSessionId = id
      } catch {
        // Conserver la session locale même si l'API est temporairement indisponible.
      }

      return id
    })()

    try {
      return await inflightEnsure
    } finally {
      inflightEnsure = null
    }
  }

  function resetGuestSessionSync() {
    lastSyncedSessionId = null
  }

  onMounted(() => {
    ensureSession().catch(() => {})
  })

  return { guestSessionId, applyGuestSessionId, ensureSession, resetGuestSessionSync }
}
