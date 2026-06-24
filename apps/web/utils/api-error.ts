export function parseApiAuthError(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') {
    return 'Impossible de contacter le serveur. Vérifiez que l’API est démarrée.'
  }

  const problem = err as {
    status?: number
    statusCode?: number
    detail?: string
    message?: string
    errors?: Array<{ field: string; message: string }>
  }

  const status = problem.status ?? problem.statusCode

  if (problem.errors?.length) {
    return problem.errors.map((e) => translateValidationMessage(e.message)).join('. ')
  }

  if (status === 401) {
    return problem.detail ?? 'Email ou mot de passe incorrect.'
  }

  if (status === 404) {
    return 'Le serveur API est inaccessible. Relancez `pnpm dev` (web :3000, API :3001).'
  }

  if (problem.detail) {
    return problem.detail
  }

  if (problem.message?.includes('Page not found')) {
    return 'Le serveur API est inaccessible. Relancez `pnpm dev` (web :3000, API :3001).'
  }

  return fallback
}

function translateValidationMessage(message: string): string {
  if (message === 'String must contain at least 1 character(s)') {
    return 'Ce champ est requis'
  }
  if (message === 'Invalid email') {
    return 'Format e-mail invalide'
  }
  return message
}

export function formatValidationErrors(errors?: Array<{ message: string }>, fallback = 'Données invalides'): string {
  if (!errors?.length) return fallback
  return errors.map((e) => translateValidationMessage(e.message)).join('. ')
}
