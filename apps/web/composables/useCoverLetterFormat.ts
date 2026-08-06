import type { CoverLetterSnapshot } from '~/types/cover-letter'
import { DEFAULT_CLOSING_TEXT } from '~/types/cover-letter'
import { formatPhoneNumber } from '~/utils/phone-formatter'

export function formatRecruiterName(raw: string | null | undefined): string {
  if (!raw) return ''
  let cleaned = raw.trim().replace(/\s+/g, ' ')
  if (!cleaned) return ''

  // 1. Normalisation des civilités usuelles au début
  cleaned = cleaned
    .replace(/^(mr|mr\.|m\.)\b/i, 'M.')
    .replace(/^(mme|mme\.)\b/i, 'Mme')
    .replace(/^(mlle|mlle\.)\b/i, 'Mlle')
    .replace(/^(dr|dr\.)\b/i, 'Dr.')
    .replace(/^(pr|pr\.)\b/i, 'Pr.')
    .replace(/^monsieur\b/i, 'Monsieur')
    .replace(/^madame\b/i, 'Madame')

  // 2. Capitalisation intelligente de chaque mot
  const lowercaseWords = new Set(['la', 'de', 'du', 'des', 'le', 'et', 'en', 'à'])
  const words = cleaned.split(' ')

  const formattedWords = words.map((w, index) => {
    if (!w) return ''
    const lower = w.toLowerCase()

    if (/^(M\.|Mme|Mlle|Dr\.|Pr\.|Monsieur|Madame)$/.test(w)) {
      return w
    }

    if (index > 0 && lowercaseWords.has(lower)) {
      return lower
    }

    return lower.charAt(0).toUpperCase() + lower.slice(1)
  })

  return formattedWords.join(' ')
}

export function useCoverLetterFormat(letter: MaybeRefOrGetter<CoverLetterSnapshot>) {
  const snapshot = computed(() => toValue(letter))

  const formattedDate = computed(() => {
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const loc = snapshot.value.senderLocation?.trim()
    if (loc) {
      const city = loc.split(',')[0].trim()
      return `Fait à ${city}, le ${dateStr}`
    }
    return `Fait le ${dateStr}`
  })

  const formattedRecruiterName = computed(() => {
    return formatRecruiterName(snapshot.value.recruiterName)
  })

  const greeting = computed(() => {
    const name = formattedRecruiterName.value
    if (name) {
      return `${name},`
    }
    return 'Madame, Monsieur,'
  })

  const cleanPosition = computed(() => {
    let raw = snapshot.value.position?.trim() || ''
    while (/^(candidature\s*(:|-|·|—)?\s*)?(au\s+poste\s+de\s+|pour\s+le\s+poste\s+de\s+|au\s+poste\s+d['’]|pour\s+le\s+poste\s+d['’])?/i.test(raw) && raw.length > 0) {
      const next = raw.replace(/^(candidature\s*(:|-|·|—)?\s*)?(au\s+poste\s+de\s+|pour\s+le\s+poste\s+de\s+|au\s+poste\s+d['’]|pour\s+le\s+poste\s+d['’])?/i, '').trim()
      if (next === raw) break
      raw = next
    }
    return raw
  })

  const formattedSubject = computed(() => {
    const title = cleanPosition.value
    if (!title) return ''
    if (/^[aeiouyhàâéèêëîïôùûü]/i.test(title)) {
      return `Candidature au poste d'${title}`
    }
    return `Candidature au poste de ${title}`
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

  const closing = computed(() => {
    const rawClosing = snapshot.value.closingText?.trim() || DEFAULT_CLOSING_TEXT
    const name = formattedRecruiterName.value
    if (name && !/^(madame,\s*monsieur|madame\s*\/\s*monsieur|monsieur,\s*madame)$/i.test(name)) {
      // Remplacer automatiquement "Madame, Monsieur" dans la formule de politesse par le destinataire (ex: Mme Ndiaye, M. Cisse)
      return rawClosing.replace(/madame,\s*monsieur/gi, name)
    }
    return rawClosing
  })

  const senderLines = computed(() => {
    const lines: string[] = []
    if (snapshot.value.senderName) lines.push(snapshot.value.senderName)
    if (snapshot.value.senderLocation) lines.push(snapshot.value.senderLocation)
    if (snapshot.value.senderPhone) lines.push(formatPhoneNumber(snapshot.value.senderPhone))
    if (snapshot.value.senderEmail) lines.push(snapshot.value.senderEmail)
    return lines
  })

  const recipientLines = computed(() => {
    const lines: string[] = []
    const raw = formattedRecruiterName.value
    if (raw) {
      const isSimpleCivility = /^(m\.|mme|mlle|dr\.|pr\.|monsieur|madame|madame,\s*monsieur)$/i.test(raw)
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
    formattedSubject,
    paragraphs,
    closing,
    senderLines,
    recipientLines,
  }
}
