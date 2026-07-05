import { defineStore } from 'pinia'
import { isAccessTokenExpired } from '~/utils/auth-token'
import { clearLegacyResumeDraft } from '~/utils/resume-draft-storage'
import { createRandomId } from '~/utils/random-id'
import type { AuthUser } from '~/types/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    accessToken: null as string | null,
    isAuthenticated: false,
    impersonating: false,
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
      this.impersonating = Boolean(localStorage.getItem('profiloz:admin-backup'))
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
      this.impersonating = false
      if (import.meta.client) {
        localStorage.removeItem('profiloz:access-token')
        localStorage.removeItem('profiloz:user')
        localStorage.removeItem('profiloz:admin-backup')
        localStorage.removeItem('profiloz:guest-session')
        clearLegacyResumeDraft()
        localStorage.setItem('profiloz:guest-session', createRandomId())
        useResumeStore().rehydrateFromStorage()
      }
    },
    async login(email: string, password: string) {
      const { post } = useApiClient()
      const guestSessionId = import.meta.client ? localStorage.getItem('profiloz:guest-session') : null
      const result = await post<{ user: AuthUser; accessToken: string }>('/auth/login', {
        email,
        password,
        guestSessionId: guestSessionId ?? undefined,
      })
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
    startImpersonation(user: AuthUser, accessToken: string) {
      if (import.meta.client && !this.impersonating) {
        localStorage.setItem('profiloz:admin-backup', JSON.stringify({
          user: this.user,
          accessToken: this.accessToken,
        }))
      }
      this.setSession({ ...user, role: user.role ?? 'USER' }, accessToken)
      this.impersonating = true
    },
    stopImpersonation() {
      if (!import.meta.client) return
      const raw = localStorage.getItem('profiloz:admin-backup')
      if (!raw) return
      const backup = JSON.parse(raw) as { user: AuthUser; accessToken: string }
      localStorage.removeItem('profiloz:admin-backup')
      this.setSession(backup.user, backup.accessToken)
      this.impersonating = false
    },
  },
})
