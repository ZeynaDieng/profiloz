/**
 * Formate un numéro de téléphone brut en un format lisible et professionnel.
 * Exemples :
 * - "771234567" -> "+221 77 123 45 67"
 * - "221771234567" -> "+221 77 123 45 67"
 * - "+221771234567" -> "+221 77 123 45 67"
 * - "0612345678" -> "06 12 34 56 78"
 * - "+33612345678" -> "+33 6 12 34 56 78"
 */
export function formatPhoneNumber(raw: string | null | undefined): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return trimmed

  // 1. Sénégal (+221 ou 9 chiffres commençant par 7, 3, 8)
  if (digits.startsWith('221') && digits.length === 12) {
    const subscriber = digits.slice(3)
    return `+221 ${subscriber.slice(0, 2)} ${subscriber.slice(2, 5)} ${subscriber.slice(5, 7)} ${subscriber.slice(7, 9)}`
  }

  if (!hasPlus && digits.length === 9 && /^(70|75|76|77|78|33|88)/.test(digits)) {
    return `+221 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
  }

  // 2. France (+33 ou 10 chiffres commençant par 0)
  if (digits.startsWith('33') && digits.length === 11) {
    const subscriber = digits.slice(2)
    return `+33 ${subscriber.slice(0, 1)} ${subscriber.slice(1, 3)} ${subscriber.slice(3, 5)} ${subscriber.slice(5, 7)} ${subscriber.slice(7, 9)}`
  }

  if (!hasPlus && digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`
  }

  // 3. Côte d'Ivoire (+225 + 10 chiffres)
  if (digits.startsWith('225') && digits.length === 13) {
    const subscriber = digits.slice(3)
    return `+225 ${subscriber.slice(0, 2)} ${subscriber.slice(2, 4)} ${subscriber.slice(4, 6)} ${subscriber.slice(6, 8)} ${subscriber.slice(8, 10)}`
  }

  // 4. Numéro international générique avec +
  if (hasPlus) {
    if (digits.startsWith('221') && digits.length > 3) {
      const rest = digits.slice(3)
      if (rest.length === 9) {
        return `+221 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`
      }
    }
    return `+${digits.replace(/(\d{2,3})(?=\d)/g, '$1 ')}`
  }

  // 5. Numéro local générique (groupes de 2 chiffres)
  if (digits.length >= 8 && digits.length <= 10) {
    return digits.replace(/(\d{2})(?=\d)/g, '$1 ')
  }

  return trimmed
}
