import type { RouterConfig } from '@nuxt/schema'

const HEADER_OFFSET = 72

export default {
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve({
              el: to.hash,
              top: HEADER_OFFSET,
              behavior: 'smooth',
            })
          })
        })
      })
    }

    return { top: 0, left: 0 }
  },
} satisfies RouterConfig
