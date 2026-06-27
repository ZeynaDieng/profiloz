import { PrismaClient, TemplateSlug } from '@prisma/client'

/** Bump when Prisma schema changes so dev HMR does not keep a stale client. */
const PRISMA_CLIENT_CACHE_KEY = 'prismaClient_v20250625_templates' as const

const globalForPrisma = globalThis as unknown as {
  [PRISMA_CLIENT_CACHE_KEY]?: PrismaClient
}

export const prisma =
  globalForPrisma[PRISMA_CLIENT_CACHE_KEY] ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma[PRISMA_CLIENT_CACHE_KEY] = prisma

  const templateSlugs = Object.values(TemplateSlug)
  if (!templateSlugs.includes('EXECUTIF') || !templateSlugs.includes('CADRE')) {
    console.error(
      '[prisma] Client Prisma obsolète (modèles CADRE/EXECUTIF manquants). Exécutez `pnpm --filter @profiloz/api db:generate` puis redémarrez l’API.',
    )
  }
}
