/** URL API pour la page /imprimer/* (SSR dans Docker → service api interne). */
export function resolvePrintRenderApiBase(config: {
  apiInternalBaseUrl?: string
  publicApiBaseUrl: string
}): string {
  const internal = config.apiInternalBaseUrl?.trim()
  if (import.meta.server) {
    if (internal) return internal.replace(/\/$/, '')
    // Fallback Docker Compose (évite le fetch vers l'URL publique depuis le conteneur web)
    if (process.env.NUXT_API_INTERNAL_BASE_URL?.trim()) {
      return process.env.NUXT_API_INTERNAL_BASE_URL.trim().replace(/\/$/, '')
    }
    return 'http://api:3001/api/v1'
  }
  return config.publicApiBaseUrl.replace(/\/$/, '')
}
