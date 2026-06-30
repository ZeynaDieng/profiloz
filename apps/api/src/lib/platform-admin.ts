import { prisma } from '@/lib/prisma'

export function getPlatformOwnerEmail(): string | null {
  const raw = process.env.PROFILOZ_OWNER_EMAIL?.trim().toLowerCase()
  return raw || null
}

export function isPlatformOwnerEmail(email: string): boolean {
  const ownerEmail = getPlatformOwnerEmail()
  if (!ownerEmail) return false
  return email.trim().toLowerCase() === ownerEmail
}

/** Promouvoit le propriétaire Profilo'Z (e-mail configuré via PROFILOZ_OWNER_EMAIL). */
export async function ensurePlatformOwnerRole(userId: string, email: string) {
  if (!isPlatformOwnerEmail(email)) return false
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'ADMIN' },
  })
  return true
}

export async function getUserAuthPayload(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, firstName: true, lastName: true },
  })
  if (!user) return null
  await ensurePlatformOwnerRole(user.id, user.email)
  const refreshed = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, firstName: true, lastName: true },
  })
  return refreshed
}
