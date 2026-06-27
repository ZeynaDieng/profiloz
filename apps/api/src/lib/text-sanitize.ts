/** PostgreSQL UTF-8 rejects null bytes (0x00) in text/JSON columns. */
export function sanitizeTextForDb(text: string): string {
  return text.replace(/\0/g, '')
}

export function sanitizeJsonForDb<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizeTextForDb(value) as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonForDb(item)) as T
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeJsonForDb(entry)]),
    ) as T
  }
  return value
}
