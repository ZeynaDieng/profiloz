import { afterEach, describe, expect, it } from 'vitest'
import { resetRateLimitsForTests } from '../lib/rate-limit'
import { assertAiRateLimit, rateLimitAiKey } from '../lib/rate-limit-ai'

describe('rateLimitAi', () => {
  afterEach(() => {
    resetRateLimitsForTests()
  })

  it('génère la clé de rate limit selon la présence de userId ou guestSessionId', () => {
    const req = new Request('http://localhost/api/v1/ai/enhance')
    expect(rateLimitAiKey(req, { userId: 'user-1' })).toBe('user:user-1')
    expect(rateLimitAiKey(req, { guestSessionId: 'guest-1' })).toBe('guest:guest-1')
    expect(rateLimitAiKey(req, {})).toBe('anonymous')
  })

  it('bloque lorsque la limite IA est dépassée', () => {
    const req = new Request('http://localhost/api/v1/ai/enhance')
    const ctx = { guestSessionId: 'guest-limit-test' }

    // 20 autorisées par défaut pour les invités
    for (let i = 0; i < 20; i++) {
      expect(() => assertAiRateLimit(req, ctx)).not.toThrow()
    }

    // La 21ème doit lancer une AppError 429
    expect(() => assertAiRateLimit(req, ctx)).toThrowError(/Limite de génération IA atteinte/)
  })
})
