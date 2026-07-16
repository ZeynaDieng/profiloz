import { waitForPdfRenderReady } from '../lib/pdf/pdf-readiness'
import { resolveAppUrl } from '../lib/pdf/app-url'

async function main() {
  const appUrl = resolveAppUrl()
  console.log(`Waiting for PDF render page at ${appUrl}/imprimer/cv ...`)

  const timeoutMs = process.env.STRICT_PDF_READINESS === 'true' ? 90_000 : 2_000
  const result = await waitForPdfRenderReady({ timeoutMs, intervalMs: 2_000 })
  if (result.ok) {
    console.log(`PDF render target ready (HTTP ${result.status ?? 'ok'})`)
    return
  }

  const detail = result.error ?? `HTTP ${result.status ?? 'unknown'}`
  console.error(`PDF render target unavailable: ${detail}`)
  if (process.env.STRICT_PDF_READINESS === 'true') {
    process.exit(1)
  }
  console.warn('Continuing startup (set STRICT_PDF_READINESS=true to fail hard).')
}

main().catch((error) => {
  console.error(error)
  process.exit(process.env.STRICT_PDF_READINESS === 'true' ? 1 : 0)
})
