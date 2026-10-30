// @nuxtjs/robots augmente `nitropack`, mais Nitro 2.13 réexporte NitroRouteConfig sous alias depuis
// un chunk interne : l'augmentation ne fusionne pas. On la redéclare sur le module d'origine des types.
import type { RobotsValue } from '@nuxtjs/robots'

declare module 'nitropack/types' {
  interface NitroRouteConfig {
    robots?: RobotsValue | { indexable: boolean; rule: string }
  }
}

export {}
