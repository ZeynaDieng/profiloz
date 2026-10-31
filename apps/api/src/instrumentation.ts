/**
 * Démarrage du serveur Next (une fois par instance) : tâches de fond de l'API.
 * Le code Node (e-mails…) vit dans instrumentation-node.ts, jamais chargé par le runtime edge.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node')
  }
}
