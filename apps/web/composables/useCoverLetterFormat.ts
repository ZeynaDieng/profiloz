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
      if (/^(mme|madame|m\.|monsieur)\b/i.test(name)) {
        return `${name},`
      }
      return `${name},`
    }
    return 'Madame, Monsieur,'
  })

  const cleanPosition = computed(() => {
    const raw = snapshot.value.position?.trim() || ''
    return raw.replace(/^candidature\s*(:|-|·|—)?\s*(au\s+poste\s+de\s+|pour\s+le\s+poste\s+de\s+|au\s+poste\s+d['’]|pour\s+le\s+poste\s+d['’])?/i, '').trim()
  })

  const paragraphs = computed(() => {
    const rawBlocks = snapshot.value.content
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)

    const cleaned: string[] = []

    for (const block of rawBlocks) {
      // 1. Filtrer les lignes d'en-tête (ex: "À l'attention de...", "Objet :...")
      if (/^(à l'attention de|a l'attention de|destinataire\s*:)/i.test(block)) continue
      if (/^objet\s*:/i.test(block)) continue

      // 2. Filtrer les formules de salutation dupliquées (ex: "Madame, Monsieur,", "Chère Mme...", etc.)
      if (/^(madame,\s*monsieur|monsieur,\s*madame|madame,|monsieur,|chère?\s+)/i.test(block) && block.length < 60) continue

      // 3. Filtrer les formules de politesse finales dupliquées en fin de texte
      if (/^(veuillez|je vous|dans l'attente|espérant|en vous remerciant).*salutations/i.test(block)) continue
      if (/^(veuillez agréer|je vous prie d'agréer)/i.test(block)) continue

      cleaned.push(block)
    }

    return cleaned
  })

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
    const raw = snapshot.value.recruiterName?.trim()
    if (raw) {
      // Si la valeur est juste une civilité simple ("Monsieur", "Madame", "M.", "Mme"),
      // on ne l'ajoute pas dans l'en-tête d'adresse au-dessus de l'entreprise (pour éviter "Monsieur" au-dessus de l'entreprise + "Monsieur," en salutation).
      const isSimpleCivility = /^(m\.|mme|monsieur|madame|madame,\s*monsieur)$/i.test(raw)
      if (!isSimpleCivility) {
        lines.push(raw)
      }
    }
    if (snapshot.value.companyName) lines.push(snapshot.value.companyName)
    if (snapshot.value.companyAddress) lines.push(snapshot.value.companyAddress)
    return lines
  })

  return {
    formattedDate,
    greeting,
    cleanPosition,
    paragraphs,
    closing,
    senderLines,
    recipientLines,
  }
}
