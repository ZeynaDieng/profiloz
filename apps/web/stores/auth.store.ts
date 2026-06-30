import { defineStore } from 'pinia'
import { isAccessTokenExpired } from '~/utils/auth-token'
import { clearLegacyResumeDraft } from '~/utils/resume-draft-storage'
import type { AuthUser } from '~/types/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    accessToken: null as string | null,
    isAuthenticated: false,
  }),
  getters: {
    isPlatformAdmin: (state) => state.user?.role === 'ADMIN',
  },
  actions: {
    setSession(user: AuthUser, accessToken: string) {
      this.user = user
      this.accessToken = accessToken
      this.isAuthenticated = true
      if (import.meta.client) {
        localStorage.setItem('profiloz:access-token', accessToken)
        localStorage.setItem('profiloz:user', JSON.stringify(user))
        clearLegacyResumeDraft()
        useResumeStore().rehydrateFromStorage()
      }
    },
    loadFromStorage() {
      if (!import.meta.client) return
      const token = localStorage.getItem('profiloz:access-token')
      const userRaw = localStorage.getItem('profiloz:user')
      if (!token || !userRaw || isAccessTokenExpired(token)) {
        this.logout()
        return
      }
      this.accessToken = token
      this.user = JSON.parse(userRaw) as AuthUser
      this.isAuthenticated = true
      if (!this.user.role) this.user.role = 'USER'
    },
    async refreshProfile() {
      if (!this.isAuthenticated) return
      const { get } = useApiClient()
      try {
        const result = await get<{ user: AuthUser }>('/auth/me')
        this.user = result.user
        if (import.meta.client) {
          localStorage.setItem('profiloz:user', JSON.stringify(result.user))
        }
      } catch {
        // ignore
      }
    },
    /** Déconnecte si le token en mémoire a expiré pendant la session */
    syncSession() {
      if (!import.meta.client || !this.isAuthenticated) return
      const token = localStorage.getItem('profiloz:access-token')
      if (!token || isAccessTokenExpired(token)) {
        this.logout()
      }
    },
    logout() {
      this.user = null
      this.accessToken = null
      this.isAuthenticated = false
      if (import.meta.client) {
        localStorage.removeItem('profiloz:access-token')
        localStorage.removeItem('profiloz:user')
        localStorage.removeItem('profiloz:guest-session')
        clearLegacyResumeDraft()
        localStorage.setItem('profiloz:guest-session', crypto.randomUUID())
        useResumeStore().rehydrateFromStorage()
      }
    },
    async login(email: string, password: string) {
      const { post } = useApiClient()
      const result = await post<{ user: AuthUser; accessToken: string }>('/auth/login', { email, password })
      this.setSession({ ...result.user, role: result.user.role ?? 'USER' }, result.accessToken)
      return result
    },
    async register(email: string, password: string, resumeSnapshot?: unknown) {
      const { post } = useApiClient()
      const guestSessionId = import.meta.client ? localStorage.getItem('profiloz:guest-session') : null
      const result = await post<{ user: AuthUser; accessToken: string; migratedResumeId?: string }>(
        '/auth/register',
        {
          email,
          password,
          guestSessionId: guestSessionId ?? undefined,
          resumeSnapshot,
        },
      )
      this.setSession({ ...result.user, role: result.user.role ?? 'USER' }, result.accessToken)
      return result
    },
  },
})
