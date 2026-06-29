const STORAGE_KEY = 'profiloz:payment-return-to'

export function savePaymentReturnTo(path: string) {
  if (typeof sessionStorage === 'undefined') return
  if (!path.startsWith('/') || path.startsWith('//')) return
  sessionStorage.setItem(STORAGE_KEY, path)
}

export function peekPaymentReturnTo(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem(STORAGE_KEY)
}

export function consumePaymentReturnTo(): string | null {
  const value = peekPaymentReturnTo()
  if (value) sessionStorage.removeItem(STORAGE_KEY)
  return value
}

export function resolvePaymentReturnTo(queryReturnTo: unknown): string | null {
  if (typeof queryReturnTo === 'string' && queryReturnTo.startsWith('/') && !queryReturnTo.startsWith('//')) {
    consumePaymentReturnTo()
    return queryReturnTo
  }
  return consumePaymentReturnTo()
}

export function isGuestPdfReturnPath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path
  return pathname === '/creer/editeur' || pathname === '/creer/lettre/editeur'
}

export function isLetterReturnPath(path: string): boolean {
  return (path.split('?')[0] ?? path) === '/creer/lettre/editeur'
}
