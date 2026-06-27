import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveAppUrl } from '../lib/pdf/app-url'
import { checkPdfRenderReadiness } from '../lib/pdf/pdf-readiness'

describe('resolveAppUrl', () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env }
    delete process.env.APP_URL
    delete process.env.NUXT_PUBLIC_APP_URL
    delete process.env.CORS_ORIGIN
  })

  afterEach(() => {
    process.env = env
  })

  it('priorise APP_URL', () => {
    process.env.APP_URL = 'http://web:3000'
    process.env.CORS_ORIGIN = 'http://localhost'
    expect(resolveAppUrl()).toBe('http://web:3000')
  })

  it('retombe sur localhost en dev', () => {
    expect(resolveAppUrl()).toBe('http://127.0.0.1:3000')
  })
})

describe('checkPdfRenderReadiness', () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env, APP_URL: 'http://web:3000' }
  })

  afterEach(() => {
    process.env = env
    vi.unstubAllGlobals()
  })

  it('signale ok quand la page répond', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html></html>', { status: 200 })),
    )

    const result = await checkPdfRenderReadiness()
    expect(result.ok).toBe(true)
    expect(result.targetUrl).toBe('http://web:3000/imprimer/cv')
  })

  it('signale une erreur réseau', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED')
      }),
    )

    const result = await checkPdfRenderReadiness()
    expect(result.ok).toBe(false)
    expect(result.error).toContain('ECONNREFUSED')
  })
})
