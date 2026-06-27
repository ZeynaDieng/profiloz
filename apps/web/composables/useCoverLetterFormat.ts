import type { CoverLetterSnapshot } from '~/types/cover-letter'
import { DEFAULT_CLOSING_TEXT } from '~/types/cover-letter'

export function useCoverLetterFormat(letter: MaybeRefOrGetter<CoverLetterSnapshot>) {
  const snapshot = computed(() => toValue(letter))

  const formattedDate = computed(() =>
    new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
  )

  const greeting = computed(() => {
    const name = snapshot.value.recruiterName?.trim()
    if (name) {
      const title = /^m\.?\s/i.test(name) ? '' : 'Madame '
      return `${title}${name},`
    }
    return 'Madame, Monsieur,'
  })

  const paragraphs = computed(() =>
    snapshot.value.content
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean),
  )

  const closing = computed(() => snapshot.value.closingText?.trim() || DEFAULT_CLOSING_TEXT)

  const senderLines = computed(() => {
    const lines: string[] = []
    if (snapshot.value.senderName) lines.push(snapshot.value.senderName)
    if (snapshot.value.senderLocation) lines.push(snapshot.value.senderLocation)
    if (snapshot.value.senderPhone) lines.push(snapshot.value.senderPhone)
    if (snapshot.value.senderEmail) lines.push(snapshot.value.senderEmail)
    return lines
  })

  const recipientLines = computed(() => {
    const lines: string[] = []
    if (snapshot.value.companyName) lines.push(snapshot.value.companyName)
    if (snapshot.value.companyAddress) lines.push(snapshot.value.companyAddress)
    return lines
  })

  return {
    formattedDate,
    greeting,
    paragraphs,
    closing,
    senderLines,
    recipientLines,
  }
}
