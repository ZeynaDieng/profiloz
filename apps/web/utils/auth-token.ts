export function isAccessTokenExpired(token: string): boolean {
  if (!token || typeof token !== 'string') return true

  try {
    const parts = token.split('.')
    if (parts.length < 2 || !parts[1]) return true

    // Décodage sécurisé Base64URL (remplacement - et _ + ajout du padding =)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')

    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    )

    const payload = JSON.parse(jsonPayload) as { exp?: number }
    if (!payload.exp) return false

    // Marge de tolérance de 5 secondes
    return payload.exp * 1000 <= Date.now() + 5000
  } catch {
    // Ne pas déconnecter brutalement sur une erreur de décodage côté client si le token est présent
    return false
  }
}

export function getStoredAccessToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  const token = localStorage.getItem('profiloz:access-token')
  if (!token || isAccessTokenExpired(token)) return null
  return token
}
