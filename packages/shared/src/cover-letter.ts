export function buildCoverLetterTitle(senderName?: string | null): string {
  const name = senderName?.trim()
  return name ? `Lettre de motivation — ${name}` : 'Lettre de motivation'
}

// Formule d'appel seule sur sa ligne : « Madame, Monsieur, », « Mme Ndiaye, », « Cher recruteur, »…
const GREETING_LINE =
  /^(?:(?:madame|monsieur|mesdames|messieurs)(?:\s*[,/]\s*(?:madame|monsieur|mesdames|messieurs))*|(?:chère?s?|bonjour)\b[^.!?\n]{0,60}|(?:m\.|mme|mlle|dr\.?|pr\.?)\s+[^,.!?\n]{1,40})\s*,?\s*$/i

// Paragraphe de politesse finale ou signature (« Je vous prie d'agréer… », « Cordialement », « Bien à vous »)
const CLOSING_PARAGRAPH =
  /\b(?:agréer|salutations|considération distinguée|sentiments (?:distingués|respectueux)|cordialement|bien à vous|respectueusement)\b/i

/**
 * Corps de lettre écrit par l'IA, sans formule d'appel ni formule de politesse finale :
 * le modèle de lettre les affiche déjà, sinon elles apparaissent en double.
 */
export function stripLetterFormulas(raw: string): string {
  const paragraphs = raw
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  // Formule d'appel : seule sur la première ligne du premier paragraphe
  if (paragraphs.length > 0) {
    const [firstLine, ...rest] = paragraphs[0]!.split('\n')
    if (GREETING_LINE.test(firstLine!.trim())) {
      const remaining = rest.join('\n').trim()
      if (remaining) paragraphs[0] = remaining
      else paragraphs.shift()
    }
  }

  // Fin de lettre : on retire la signature et les phrases de politesse, en gardant le contenu
  // d'un paragraphe qui mêle une vraie phrase et une formule finale
  while (paragraphs.length > 1) {
    const last = paragraphs[paragraphs.length - 1]!
    // Signature : un nom seul, ex. « Awa Diop » (2 à 4 mots qui commencent par une majuscule)
    const isSignature = /^(?:\p{Lu}[\p{L}'’-]*\.?\s+){1,3}\p{Lu}[\p{L}'’-]*$/u.test(last)
    if (isSignature) {
      paragraphs.pop()
      continue
    }
    if (!CLOSING_PARAGRAPH.test(last)) break
    const kept = last
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => !CLOSING_PARAGRAPH.test(sentence))
      .join(' ')
      .trim()
    if (kept) {
      paragraphs[paragraphs.length - 1] = kept
      break
    }
    paragraphs.pop()
  }

  return paragraphs.join('\n\n')
}
