import { createRandomId } from '~/utils/random-id'

let inflightEnsure: Promise<string | null> | null = null
let lastSyncedSessionId: string | null = null

function readPaidGuestSessionId(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem('profiloz:guest-dossier')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { guestSessionId?: unknown; paidAt?: unknown }
    if (typeof parsed.guestSessionId === 'string' && typeof parsed.paidAt === 'string') return parsed.guestSessionId
    return null
  } catch {
    return null
  }
}

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
        // Mobile peut “perdre” profiloz:guest-session entre pages.
        // On réutilise alors la guestSessionId liée au dossier payé (si présente).
        const paid = readPaidGuestSessionId()
        if (paid) {
          id = paid
          localStorage.setItem('profiloz:guest-session', id)
        } else {
          id = createRandomId()
          localStorage.setItem('profiloz:guest-session', id)
        }
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
