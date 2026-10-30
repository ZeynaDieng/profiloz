import { createRandomId } from '~/utils/random-id'
import { getPaidGuestSessionId } from '~/utils/guest-dossier-state'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  authStore.loadFromStorage()

  if (!import.meta.client) return

  void authStore.refreshProfile()
  void registerGuestSession()
})

async function registerGuestSession() {
  const paidId = getPaidGuestSessionId()
  let id = localStorage.getItem('profiloz:guest-session')

  if (paidId && id !== paidId) {
    id = paidId
    localStorage.setItem('profiloz:guest-session', id)
  }

  if (!id) {
    id = paidId ?? createRandomId()
    localStorage.setItem('profiloz:guest-session', id)
  }

  const { post } = useApiClient()
  try {
    await post('/guest/session', { sessionId: id })
  } catch {
    // Session locale conservée si l'API est temporairement indisponible
  }
}
