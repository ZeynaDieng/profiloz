export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  function checkBreakout() {
    try {
      const isReturnOrSuccessPage =
        window.location.pathname.includes('/succes') ||
        window.location.pathname.includes('/creer/')

      if (!isReturnOrSuccessPage) return

      // 1. Si la page s'affiche dans une iframe (ex: modal PayTech)
      if (window.top && window.top !== window.self) {
        window.top.location.href = window.location.href
        return
      }

      // 2. Si la page s'affiche dans une fenêtre pop-up enfant (opener)
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.location.href = window.location.href
          window.close()
        } catch (_) {}
      }
    } catch (e) {
      console.warn('[iframe-breakout] Error:', e)
    }
  }

  nuxtApp.hook('page:finish', () => {
    checkBreakout()
  })

  // Vérification immédiate au premier chargement du script
  checkBreakout()
})
