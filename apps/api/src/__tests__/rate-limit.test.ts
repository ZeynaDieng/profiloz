import { checkRateLimit, resetRateLimitsForTests } from '../lib/rate-limit'
import { afterEach, describe, expect, it } from 'vitest'

describe('checkRateLimit', () => {
  afterEach(() => {
    resetRateLimitsForTests()
  })

  it('autorise les requêtes sous la limite', () => {
    const first = checkRateLimit('pdf:test', { limit: 3, windowMs: 60_000 })
    const second = checkRateLimit('pdf:test', { limit: 3, windowMs: 60_000 })

    expect(first.allowed).toBe(true)
    expect(first.remaining).toBe(2)
    expect(second.allowed).toBe(true)
    expect(second.remaining).toBe(1)
  })

  it('bloque au-delà de la limite', () => {
    checkRateLimit('pdf:block', { limit: 2, windowMs: 60_000 })
    checkRateLimit('pdf:block', { limit: 2, windowMs: 60_000 })
    const third = checkRateLimit('pdf:block', { limit: 2, windowMs: 60_000 })

    expect(third.allowed).toBe(false)
    expect(third.remaining).toBe(0)
  })
})
