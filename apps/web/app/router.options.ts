import type { RouterConfig } from '@nuxt/schema'

const HEADER_OFFSET = 72
/** Délai max pour trouver la section ciblée (#tarifs, #faq…) quand on arrive d'une autre page. */
const HASH_TARGET_TIMEOUT_MS = 3000

/**
 * Attend que la section existe : en venant d'une autre page, l'accueil n'est pas encore affiché
 * au moment du défilement, et la page restait en haut au lieu de descendre jusqu'à la section.
 */
function waitForElement(selector: string): Promise<boolean> {
  return new Promise((resolve) => {
    const started = performance.now()
    const check = () => {
      if (document.querySelector(selector)) return resolve(true)
      if (performance.now() - started > HASH_TARGET_TIMEOUT_MS) return resolve(false)
      requestAnimationFrame(check)
    }
    check()
  })
}

export default {
  async scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      const found = await waitForElement(to.hash)
      if (found) {
        return { el: to.hash, top: HEADER_OFFSET, behavior: 'smooth' }
      }
    }

    return { top: 0, left: 0 }
  },
} satisfies RouterConfig
