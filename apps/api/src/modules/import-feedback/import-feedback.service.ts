import { prisma } from '@/lib/prisma'
import { sanitizeJsonForDb } from '@/lib/text-sanitize'
import { importFeedbackSchema } from '@profiloz/validators'
import type { ResumeSnapshot } from '@profiloz/shared'
import type { RequestContext } from '@/lib/request-context'
import {
  aggregateFieldDiffStats,
  computeImportFieldDiffs,
  stripExtractionMeta,
  type ImportFeedbackFieldDiff,
} from './field-diff'

export class ImportFeedbackService {
  async record(body: unknown, ctx: RequestContext) {
    const input = importFeedbackSchema.parse(body)
    const original = stripExtractionMeta(input.originalParsed) as Partial<ResumeSnapshot>
    const corrected = stripExtractionMeta(input.correctedData) as Partial<ResumeSnapshot>
    const fieldDiffs = computeImportFieldDiffs(original, corrected)

    return prisma.importFeedback.create({
      data: {
        documentId: input.documentId,
        userId: ctx.userId,
        guestSessionId: ctx.guestSessionDbId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        templateSlug: input.templateSlug,
        originalParsed: sanitizeJsonForDb(original) as object,
        correctedData: sanitizeJsonForDb(corrected) as object,
        fieldDiffs: sanitizeJsonForDb(fieldDiffs) as object,
        overallConfidence: input.overallConfidence,
      },
    })
  }

  async getAdminInsights() {
    const [total, recent] = await Promise.all([
      prisma.importFeedback.count(),
      prisma.importFeedback.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          createdAt: true,
          fileName: true,
          mimeType: true,
          templateSlug: true,
          fieldDiffs: true,
          overallConfidence: true,
        },
      }),
    ])

    const allDiffs = recent.map((row) => row.fieldDiffs as unknown as ImportFeedbackFieldDiff[])
    const byCategory = aggregateFieldDiffStats(allDiffs)

    const byMime = new Map<string, number>()
    for (const row of recent) {
      const key = row.mimeType ?? 'unknown'
      byMime.set(key, (byMime.get(key) ?? 0) + 1)
    }

    return {
      total,
      recentSampleSize: recent.length,
      byCategory,
      byMimeType: [...byMime.entries()].map(([mimeType, count]) => ({ mimeType, count })),
      recent: recent.slice(0, 20).map((row) => ({
        id: row.id,
        at: row.createdAt.toISOString(),
        fileName: row.fileName,
        mimeType: row.mimeType,
        templateSlug: row.templateSlug,
        correctionCount: (row.fieldDiffs as unknown as ImportFeedbackFieldDiff[]).length,
        overallConfidence: row.overallConfidence,
      })),
    }
  }
}

export const importFeedbackService = new ImportFeedbackService()
