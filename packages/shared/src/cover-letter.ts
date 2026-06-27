export function buildCoverLetterTitle(senderName?: string | null): string {
  const name = senderName?.trim()
  return name ? `Lettre de motivation — ${name}` : 'Lettre de motivation'
}
