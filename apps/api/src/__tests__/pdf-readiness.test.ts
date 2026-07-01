import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPublicAppPath, buildPublicAppPathForRequest, resolveAppUrl, resolvePublicAppUrl, resolvePublicAppUrlForRequest } from '../lib/pdf/app-url'
import { checkPdfRenderReadiness } from '../lib/pdf/pdf-readiness'

describe('resolveAppUrl', () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env }
    delete process.env.APP_URL
    delete process.env.PDF_RENDER_INTERNAL_URL
    delete process.env.PUBLIC_APP_URL
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

  it('utilise le service web interne quand APP_URL est un domaine public en production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    process.env.APP_URL = 'https://profiloz.com'
    expect(resolveAppUrl()).toBe('http://web:3000')
  })

  it('priorise PDF_RENDER_INTERNAL_URL', () => {
    process.env.APP_URL = 'https://profiloz.com'
    process.env.PDF_RENDER_INTERNAL_URL = 'http://web:3000'
    expect(resolveAppUrl()).toBe('http://web:3000')
  })
})

describe('resolvePublicAppUrl', () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env }
    delete process.env.APP_URL
    delete process.env.PUBLIC_APP_URL
    delete process.env.NUXT_PUBLIC_APP_URL
    delete process.env.CORS_ORIGIN
  })

  afterEach(() => {
    process.env = env
  })

  it('ignore APP_URL docker interne et utilise PUBLIC_APP_URL', () => {
    process.env.APP_URL = 'http://web:3000'
    process.env.PUBLIC_APP_URL = 'http://localhost:3000'
    expect(resolvePublicAppUrl()).toBe('http://localhost:3000')
  })

  it('construit une URL de redirection PayTech valide', () => {
    process.env.PUBLIC_APP_URL = 'http://localhost:3000'
    expect(buildPublicAppPath('/paiement/succes', { ref: 'pz_test', returnTo: '/creer/editeur' })).toBe(
      'http://localhost:3000/paiement/succes?ref=pz_test&returnTo=%2Fcreer%2Fediteur',
    )
  })

  it('priorise Origin profiloz.com même si PUBLIC_APP_URL pointe vers .sn', () => {
    process.env.PUBLIC_APP_URL = 'https://profiloz.sn'
    expect(resolvePublicAppUrlForRequest('https://profiloz.com')).toBe('https://profiloz.com')
    expect(
      buildPublicAppPathForRequest('https://profiloz.com', '/paiement/succes', { ref: 'pz_test' }),
    ).toBe('https://profiloz.com/paiement/succes?ref=pz_test')
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
