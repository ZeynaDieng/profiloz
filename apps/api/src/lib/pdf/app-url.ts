const DOCKER_INTERNAL_HOSTS = new Set(['web', 'api', 'postgres', 'redis'])

function trimUrl(raw?: string): string | undefined {
  const value = raw?.trim()
  return value || undefined
}

/** Normalise une URL absolue http(s), sans slash final. */
export function normalizeAbsoluteUrl(raw?: string): string | null {
  const value = trimUrl(raw)
  if (!value) return null

  let candidate = value
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `http://${candidate}`
  }

  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    parsed.hash = ''
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

/** URL joignable par Puppeteer (/imprimer/cv). En Docker : http://web:3000 */
export function resolveAppUrl(): string {
  return (
    normalizeAbsoluteUrl(process.env.APP_URL) ??
    normalizeAbsoluteUrl(process.env.NUXT_PUBLIC_APP_URL) ??
    normalizeAbsoluteUrl(process.env.CORS_ORIGIN?.split(',')[0]) ??
    'http://127.0.0.1:3000'
  )
}

/** URL publique du front (redirections PayTech, liens utilisateur). Exclut les hôtes Docker internes. */
export function resolvePublicAppUrl(): string {
  const candidates = [
    process.env.PUBLIC_APP_URL,
    process.env.NUXT_PUBLIC_APP_URL,
    process.env.CORS_ORIGIN?.split(',')[0],
    process.env.APP_URL,
  ]

  for (const raw of candidates) {
    const normalized = normalizeAbsoluteUrl(raw)
    if (!normalized) continue
    const { hostname } = new URL(normalized)
    if (DOCKER_INTERNAL_HOSTS.has(hostname)) continue
    return normalized
  }

  return 'http://127.0.0.1:3000'
}

/** Hôtes publics connus pour les redirections PayTech (domaine visité par l'utilisateur). */
function isTrustedPublicHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true
  if (hostname === 'profiloz.com' || hostname.endsWith('.profiloz.com')) return true
  if (hostname === 'profiloz.sn' || hostname.endsWith('.profiloz.sn')) return true
  return false
}

/** URL publique du front pour une requête entrante (priorise Origin si domaine Profilo'Z). */
export function resolvePublicAppUrlForRequest(requestOrigin?: string | null): string {
  const normalizedOrigin = normalizeAbsoluteUrl(requestOrigin ?? undefined)
  if (normalizedOrigin) {
    const { protocol, hostname } = new URL(normalizedOrigin)
    if (protocol === 'https:' && isTrustedPublicHostname(hostname)) {
      return normalizedOrigin
    }
    if (process.env.NODE_ENV === 'development' && isTrustedPublicHostname(hostname)) {
      return normalizedOrigin
    }
  }
  return resolvePublicAppUrl()
}

export function buildPublicAppPath(path: string, query?: Record<string, string | undefined>): string {
  const base = resolvePublicAppUrl()
  const url = new URL(path.startsWith('/') ? path : `/${path}`, `${base}/`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

export function buildPublicAppPathForRequest(
  requestOrigin: string | null | undefined,
  path: string,
  query?: Record<string, string | undefined>,
): string {
  const base = resolvePublicAppUrlForRequest(requestOrigin)
  const url = new URL(path.startsWith('/') ? path : `/${path}`, `${base}/`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) url.searchParams.set(key, value)
    }
  }
  return url.toString()
}
