type PdfLogPayload = {
  event: 'pdf_generate_start' | 'pdf_generate_success' | 'pdf_generate_error'
  kind: 'resume' | 'cover_letter'
  durationMs?: number
  templateSlug?: string
  guestSessionId?: string
  userId?: string
  error?: string
}

export function logPdfEvent(payload: PdfLogPayload) {
  console.log(JSON.stringify({ scope: 'pdf', at: new Date().toISOString(), ...payload }))
}
