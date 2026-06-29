import { describe, expect, it, vi } from 'vitest'
import { AppError, problemResponse } from '../lib/errors'

describe('problemResponse', () => {
  it('returns detail for AppError-like objects when instanceof fails', async () => {
    const error = Object.assign(new Error('Crédits insuffisants'), {
      status: 402,
      title: 'Payment Required',
      detail: 'Aucun crédit disponible.',
    })

    const response = problemResponse(error as AppError)
    const body = await response.json()

    expect(response.status).toBe(402)
    expect(body.detail).toBe('Aucun crédit disponible.')
  })

  it('returns a production-safe detail for unexpected errors', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const response = problemResponse(new Error('boom'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.detail).toContain('Réessayez')

    vi.unstubAllEnvs()
  })
})
