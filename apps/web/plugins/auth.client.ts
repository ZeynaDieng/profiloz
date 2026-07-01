import { createRandomId } from '~/utils/random-id'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  authStore.loadFromStorage()

  if (!import.meta.client) return

  void authStore.refreshProfile()
  void registerGuestSession()
})

async function registerGuestSession() {
  let id = localStorage.getItem('profiloz:guest-session')
  if (!id) {
    id = createRandomId()
    localStorage.setItem('profiloz:guest-session', id)
  }

  const config = useRuntimeConfig()
  try {
    await fetch(`${config.public.apiBaseUrl}/guest/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-Session-Id': id,
      },
      body: JSON.stringify({ sessionId: id }),
    })
  } catch {
    // API peut être indisponible au démarrage
  }
}
