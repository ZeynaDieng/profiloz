import { randomUUID } from 'crypto'
import type { MediaKind } from '@prisma/client'
import { adminMediaUpdateSchema } from '@profiloz/validators'
import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { storageProvider } from '@/lib/storage'
import { logAdminAction } from '@/modules/admin/admin-audit.service'
import { paginationMeta, parsePagination } from '@/modules/admin/admin.utils'

const MAX_MEDIA_BYTES = 25 * 1024 * 1024

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const DOCUMENT_TYPES = ['application/pdf']

function detectKind(mimeType: string): MediaKind {
  if (IMAGE_TYPES.includes(mimeType)) return 'IMAGE'
  if (VIDEO_TYPES.includes(mimeType)) return 'VIDEO'
  if (DOCUMENT_TYPES.includes(mimeType)) return 'DOCUMENT'
  return 'OTHER'
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180)
}

function buildPublicUrl(id: string) {
  return `/api/v1/media/assets/${id}/file`
}

export class MediaService {
  async listFolders() {
    const rows = await prisma.mediaFolder.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { assets: true } } },
    })
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      parentId: row.parentId,
      assetCount: row._count.assets,
      createdAt: row.createdAt.toISOString(),
    }))
  }

  async listAssets(searchParams: URLSearchParams) {
    const parsed = parsePagination(searchParams)
    const page = parsed.page ?? 1
    const limit = parsed.limit ?? 24
    const q = parsed.q
    const folderId = searchParams.get('folderId')
    const kind = searchParams.get('kind')

    const where: Record<string, unknown> = {}
    if (folderId) where.folderId = folderId === 'root' ? null : folderId
    if (kind) where.kind = kind.toUpperCase()
    if (q) {
      where.OR = [
        { filename: { contains: q, mode: 'insensitive' } },
        { alt: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, rows] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          folder: { select: { id: true, name: true } },
          uploadedBy: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
    ])

    return {
      data: rows.map((row) => ({
        id: row.id,
        filename: row.filename,
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
        kind: row.kind.toLowerCase(),
        alt: row.alt,
        folderId: row.folderId,
        folder: row.folder,
        publicUrl: row.publicUrl,
        uploadedBy: row.uploadedBy?.email ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      meta: paginationMeta(page, limit, total),
    }
  }

  async getAsset(id: string) {
    const row = await prisma.mediaAsset.findUnique({
      where: { id },
      include: { folder: true },
    })
    if (!row) throw new AppError(404, 'Not Found', 'Média introuvable')
    return row
  }

  async upload(file: File, actorId: string, folderId?: string | null) {
    if (file.size > MAX_MEDIA_BYTES) {
      throw new AppError(413, 'Payload Too Large', 'Fichier trop volumineux (max 25 Mo)')
    }

    const id = randomUUID()
    const filename = sanitizeFilename(file.name || 'file')
    const storageKey = `media/${id}/${filename}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await storageProvider.upload(buffer, storageKey, file.type || 'application/octet-stream')

    const asset = await prisma.mediaAsset.create({
      data: {
        id,
        filename,
        storageKey,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        kind: detectKind(file.type || ''),
        folderId: folderId || null,
        uploadedById: actorId,
        publicUrl: buildPublicUrl(id),
      },
    })

    await logAdminAction({
      actorId,
      action: 'media.upload',
      targetType: 'media_asset',
      targetId: asset.id,
      metadata: { filename, kind: asset.kind },
    })

    return {
      id: asset.id,
      filename: asset.filename,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      kind: asset.kind.toLowerCase(),
      publicUrl: asset.publicUrl,
      createdAt: asset.createdAt.toISOString(),
    }
  }

  async updateAsset(id: string, body: unknown, actorId: string) {
    const input = adminMediaUpdateSchema.parse(body)
    const existing = await prisma.mediaAsset.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Not Found', 'Média introuvable')

    const row = await prisma.mediaAsset.update({
      where: { id },
      data: {
        alt: input.alt,
        folderId: input.folderId,
      },
    })

    await logAdminAction({
      actorId,
      action: 'media.update',
      targetType: 'media_asset',
      targetId: id,
    })

    return row
  }

  async deleteAsset(id: string, actorId: string) {
    const existing = await prisma.mediaAsset.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Not Found', 'Média introuvable')

    await storageProvider.delete(existing.storageKey).catch(() => undefined)
    await prisma.mediaAsset.delete({ where: { id } })

    await logAdminAction({
      actorId,
      action: 'media.delete',
      targetType: 'media_asset',
      targetId: id,
    })

    return { ok: true }
  }

  async readAssetFile(id: string) {
    const asset = await this.getAsset(id)
    const buffer = await storageProvider.read(asset.storageKey)
    return { buffer, contentType: asset.mimeType, filename: asset.filename }
  }
}

export const mediaService = new MediaService()
