function measureSpacedOutScore(text: string): number {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length < 8) return 0
  const singles = words.filter((word) => word.length === 1 && /[a-zA-Zàâäéèêëïîôùûüç0-9]/i.test(word)).length
  return singles / words.length
}

function repairSpacedOutLine(line: string): string {
  const parts = line.split(/\s+/).filter(Boolean)
  if (parts.length < 6 || measureSpacedOutScore(line) < 0.25) return line

  let out = ''
  let buffer = ''

  const flushBuffer = () => {
    if (!buffer) return
    out += out ? ` ${buffer}` : buffer
    buffer = ''
  }

  for (const part of parts) {
    if (part.length === 1 && /[,.;:!?]/.test(part)) {
      buffer += part
      continue
    }

    if (part.length === 1 && /[a-zA-Zàâäéèêëïîôùûüç0-9@'’-]/i.test(part)) {
      if (buffer && /[a-z0-9àâäéèêëïîôùûüç]$/i.test(buffer) && /[A-Z]/.test(part)) {
        flushBuffer()
      }
      buffer += part
      continue
    }

    flushBuffer()
    out += out ? ` ${part}` : part
  }

  flushBuffer()
  return out
}

function polishRepairedText(text: string): string {
  let polished = text

  polished = polished.replace(/([a-z])([A-Z][A-Za-zÀ-ÿ'-]{1,})/g, '$1 $2')

  const email = polished.match(/[a-zA-Z0-9._+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+/i)?.[0]
  if (email) {
    const localPart = email.split('@')[0] ?? ''
    const idx = polished.indexOf(email)
    let before = polished.slice(0, idx).trimEnd()
    const after = polished.slice(idx + email.length).trimStart()

    if (localPart && before.toLowerCase().endsWith(localPart.toLowerCase())) {
      before = before.slice(0, before.length - localPart.length).trimEnd()
    }

    polished = [before, email, after].filter(Boolean).join('\n')
  }

  const phone = polished.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/,
  )?.[0]
  if (phone) {
    polished = polished.replace(phone, `\n${phone}\n`)
  }

  polished = polished.replace(/,([A-Za-zÀ-ÿ])/g, ', $1')
  polished = polished.replace(/([.!?])([A-ZÀ-Ÿ«"])/g, '$1 $2')

  return polished.replace(/[ \t]+/g, ' ').replace(/\n /g, '\n').replace(/ \n/g, '\n').trim()
}

export function repairSpacedOutText(text: string): string {
  if (measureSpacedOutScore(text) < 0.25) return text

  const repaired = text
    .split('\n')
    .map((line) => repairSpacedOutLine(line))
    .join('\n')

  return polishRepairedText(repaired)
}

export function scoreExtractedPdfText(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0

  const lineCount = trimmed.split('\n').filter((line) => line.trim()).length
  const spacedOutPenalty = measureSpacedOutScore(trimmed) * 3
  const lineBonus = Math.min(lineCount, 12) / 12

  return trimmed.length / 500 + lineBonus - spacedOutPenalty
}
