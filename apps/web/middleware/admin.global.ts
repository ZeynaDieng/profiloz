/** Protège /admin/* — réservé au propriétaire Profilo'Z (role ADMIN). */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return
  if (import.meta.server) return

  const authStore = useAuthStore()
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) {
    return navigateTo({ path: '/connexion', query: { redirect: to.fullPath } })
  }

  await authStore.refreshProfile()
  if (!authStore.isPlatformAdmin) {
    return navigateTo('/tableau-de-bord')
  }
})
