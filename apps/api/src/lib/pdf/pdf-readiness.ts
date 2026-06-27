import { resolveAppUrl } from './app-url'

export type PdfRenderReadiness = {
  ok: boolean
  appUrl: string
  targetUrl: string
  status?: number
  error?: string
}

export async function checkPdfRenderReadiness(timeoutMs = 5_000): Promise<PdfRenderReadiness> {
  const appUrl = resolveAppUrl().replace(/\/$/, '')
  const targetUrl = `${appUrl}/imprimer/cv`

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timer)

    return {
      ok: response.status < 500,
      appUrl,
      targetUrl,
      status: response.status,
    }
  } catch (error) {
    return {
      ok: false,
      appUrl,
      targetUrl,
      error: error instanceof Error ? error.message : 'unknown',
    }
  }
}

export async function waitForPdfRenderReady(options?: {
  timeoutMs?: number
  intervalMs?: number
}): Promise<PdfRenderReadiness> {
  const timeoutMs = options?.timeoutMs ?? 60_000
  const intervalMs = options?.intervalMs ?? 2_000
  const deadline = Date.now() + timeoutMs
  let last: PdfRenderReadiness | undefined

  while (Date.now() < deadline) {
    last = await checkPdfRenderReadiness(Math.min(intervalMs, deadline - Date.now()))
    if (last.ok) return last
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  return (
    last ?? {
      ok: false,
      appUrl: resolveAppUrl(),
      targetUrl: `${resolveAppUrl().replace(/\/$/, '')}/imprimer/cv`,
      error: 'timeout',
    }
  )
}
