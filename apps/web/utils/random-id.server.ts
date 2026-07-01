import { randomUUID } from 'node:crypto'

/** Identifiant aléatoire côté serveur (SSR / Nitro). */
export function createRandomId(): string {
  return randomUUID()
}
