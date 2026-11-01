import { PrismaClient } from '@prisma/client'

/** Bump when Prisma schema changes so dev HMR does not keep a stale client. */
const PRISMA_CLIENT_CACHE_KEY = 'prismaClient_v20261101_reviews' as const

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
}
