export const DEMO_RESUME_ID = 'demo-aminata'

/** Identifiant local (démo / brouillon) qui ne doit jamais être envoyé à l’API. */
export function isLocalDemoResumeId(id?: string | null): boolean {
  if (!id?.trim()) return false
  return id === DEMO_RESUME_ID || id.startsWith('demo-')
}

/** Retourne l’id persistant serveur, ou undefined pour un brouillon local. */
export function resolvePersistableResumeId(id?: string | null): string | undefined {
  if (!id?.trim() || isLocalDemoResumeId(id)) return undefined
  return id
}
