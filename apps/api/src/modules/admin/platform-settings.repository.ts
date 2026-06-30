import { prisma } from '@/lib/prisma'

export async function getPlatformSetting<T>(key: string): Promise<T | null> {
  const row = await prisma.platformSetting.findUnique({ where: { key } })
  return (row?.value as T | undefined) ?? null
}

export async function upsertPlatformSetting(key: string, value: unknown) {
  return prisma.platformSetting.upsert({
    where: { key },
    create: { key, value: value as never },
    update: { value: value as never },
  })
}

export async function listPlatformSettings() {
  const rows = await prisma.platformSetting.findMany({ orderBy: { key: 'asc' } })
  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}
