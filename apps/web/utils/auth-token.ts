export function isAccessTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!)) as { exp?: number }
    if (!payload.exp) return false
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

export function getStoredAccessToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  const token = localStorage.getItem('profiloz:access-token')
  if (!token || isAccessTokenExpired(token)) return null
  return token
}
