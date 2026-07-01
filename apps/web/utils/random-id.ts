import { randomUUID as nodeRandomUUID } from 'node:crypto'

/** UUID v4 compatible navigateur (sans Web Crypto). */
function fallbackRandomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

/** Identifiant aléatoire sûr en SSR (Nitro) et côté client. */
export function createRandomId(): string {
  if (import.meta.server) {
    return nodeRandomUUID()
  }

  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return fallbackRandomId()
}
