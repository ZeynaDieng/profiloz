import { MSG } from '@profiloz/shared'

export function parseApiAuthError(err: unknown, fallback = MSG.error.generic): string {
  if (!err || typeof err !== 'object') {
    return MSG.network.contactFailed
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
    return problem.detail ?? MSG.auth.loginError
  }

  if (status === 404) {
    return MSG.network.serverUnavailable
  }

  if (status === 408 || status === 504) {
    return MSG.network.timeout
  }

  if (status === 503) {
    return MSG.network.serverUnavailable
  }

  if (problem.detail) {
    return translateValidationMessage(problem.detail)
  }

  if (problem.message?.includes('Page not found')) {
    return MSG.network.serverUnavailable
  }

  if (problem.message?.includes('fetch') || problem.message?.includes('network')) {
    return MSG.network.offline
  }

  return fallback
}

function translateValidationMessage(message: string): string {
  const map: Record<string, string> = {
    'String must contain at least 1 character(s)': MSG.validation.required,
    'Invalid email': MSG.validation.email,
    'Invalid url': MSG.validation.url,
    'Required': MSG.validation.required,
    'This field is required': MSG.validation.required,
  }
  return map[message] ?? message
}

export function formatValidationErrors(
  errors?: Array<{ message: string }>,
  fallback = MSG.validation.invalidData,
): string {
  if (!errors?.length) return fallback
  return errors.map((e) => translateValidationMessage(e.message)).join('. ')
}

export function parseRegisterError(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return MSG.auth.registerError
  }

  const problem = err as {
    status?: number
    detail?: string
    errors?: Array<{ field: string; message: string }>
  }

  if (problem.status === 409) {
    return MSG.auth.accountExists
  }

  if (problem.errors?.length) {
    return formatValidationErrors(problem.errors)
  }

  if (problem.detail) {
    return translateValidationMessage(problem.detail)
  }

  return MSG.auth.registerError
}
