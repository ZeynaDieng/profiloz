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
    const currentId = localStorage.getItem('profiloz:guest-session')
    if (currentId && currentId !== trimmed) {
      const oldKey = `profiloz:resume:draft:guest:${currentId}`
      const newKey = `profiloz:resume:draft:guest:${trimmed}`
      const resumeData = localStorage.getItem(oldKey) || localStorage.getItem('profiloz:resume:draft')
      if (resumeData) localStorage.setItem(newKey, resumeData)
    }
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
      const paidId = readPaidGuestSessionId()
      let id = localStorage.getItem('profiloz:guest-session')

      // Toujours privilégier la session liée au paiement (évite session brouillon ≠ session payée).
      if (paidId && id !== paidId) {
        if (id) {
          const oldKey = `profiloz:resume:draft:guest:${id}`
          const newKey = `profiloz:resume:draft:guest:${paidId}`
          const resumeData = localStorage.getItem(oldKey) || localStorage.getItem('profiloz:resume:draft')
          if (resumeData) localStorage.setItem(newKey, resumeData)
        }
        id = paidId
        localStorage.setItem('profiloz:guest-session', id)
        lastSyncedSessionId = null
      }

      if (!id) {
        if (paidId) {
          id = paidId
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
