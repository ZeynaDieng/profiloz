export interface PaginationInput {
  page?: number
  limit?: number
  q?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function parsePagination(searchParams: URLSearchParams): PaginationInput {
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20) || 20))
  const q = searchParams.get('q')?.trim() || undefined
  return { page, limit, q }
}

export function paginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

export function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function startOfWeek(date = new Date()) {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return d
}

export function startOfMonth(date = new Date()) {
  const d = startOfDay(date)
  d.setDate(1)
  return d
}

export function endOfDay(date = new Date()) {
  const d = startOfDay(date)
  d.setDate(d.getDate() + 1)
  return d
}

export function lastNDays(count: number) {
  const days: Date[] = []
  const today = startOfDay()
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  return days
}

export function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function bucketByDay<T extends { createdAt: Date }>(items: T[], days: Date[]) {
  const map = new Map<string, number>()
  for (const day of days) map.set(dayKey(day), 0)
  for (const item of items) {
    const key = dayKey(startOfDay(item.createdAt))
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1)
  }
  return days.map((day) => ({ date: dayKey(day), value: map.get(dayKey(day)) ?? 0 }))
}

export function bucketPaymentsByDay(
  items: Array<{ paidAt: Date | null; amountXof: number; status: string }>,
  days: Date[],
) {
  const countMap = new Map<string, number>()
  const amountMap = new Map<string, number>()
  for (const day of days) {
    const key = dayKey(day)
    countMap.set(key, 0)
    amountMap.set(key, 0)
  }
  for (const item of items) {
    if (item.status !== 'PAID' || !item.paidAt) continue
    const key = dayKey(startOfDay(item.paidAt))
    if (!countMap.has(key)) continue
    countMap.set(key, (countMap.get(key) ?? 0) + 1)
    amountMap.set(key, (amountMap.get(key) ?? 0) + item.amountXof)
  }
  return days.map((day) => ({
    date: dayKey(day),
    count: countMap.get(dayKey(day)) ?? 0,
    amount: amountMap.get(dayKey(day)) ?? 0,
  }))
}

export function formatPersonName(input: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  fullName?: string | null
}) {
  const full = input.fullName?.trim()
    || [input.firstName, input.lastName].filter(Boolean).join(' ').trim()
  return full || input.email || 'Utilisateur'
}

export function isSubscriptionActive(unlimitedUntil: Date | null | undefined) {
  return Boolean(unlimitedUntil && unlimitedUntil.getTime() > Date.now())
}
