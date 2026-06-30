/** Protège /tableau-de-bord/* et renvoie vers connexion avec redirect. */
export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/tableau-de-bord')) return
  if (import.meta.server) return

  const authStore = useAuthStore()
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) {
    return navigateTo({ path: '/connexion', query: { redirect: to.fullPath } })
  }
})
