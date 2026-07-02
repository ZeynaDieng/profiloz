import type { RouteLocationNormalizedLoaded } from 'vue-router'

export function buildChangeTemplateHref(options?: {
  returnTo?: string
  id?: string
  flow?: string
}): string {
  const params = new URLSearchParams()
  if (options?.returnTo) params.set('returnTo', options.returnTo)
  if (options?.id) params.set('id', options.id)
  if (options?.flow) params.set('flow', options.flow)
  const qs = params.toString()
  return qs ? `/creer/modele?${qs}` : '/creer/modele'
}

export function changeTemplateHrefFromRoute(route: RouteLocationNormalizedLoaded): string {
  if (route.path === '/creer/editeur') {
    return buildChangeTemplateHref({
      returnTo: 'editor',
      id: typeof route.query.id === 'string' ? route.query.id : undefined,
    })
  }
  if (route.path === '/creer/modele') return '/creer/modele'
  return buildChangeTemplateHref({ returnTo: route.path })
}

export function resolveTemplatePickerReturn(route: RouteLocationNormalizedLoaded): string | null {
  const returnTo = route.query.returnTo
  if (returnTo === 'editor') {
    const id = typeof route.query.id === 'string' ? route.query.id : undefined
    return id ? `/creer/editeur?id=${encodeURIComponent(id)}` : '/creer/editeur'
  }
  if (typeof returnTo === 'string' && returnTo.startsWith('/creer/')) {
    return returnTo
  }
  return null
}
