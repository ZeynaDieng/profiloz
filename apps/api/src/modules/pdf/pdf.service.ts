import type { ResumeSnapshot } from '@profiloz/shared'
import { PDF_TTL_HOURS } from '@profiloz/shared'
import { prisma } from '@/lib/prisma'
import { resolveAppUrl } from '@/lib/pdf/app-url'
import { logPdfEvent } from '@/lib/pdf/pdf-logger'
import { isTransientPuppeteerError, withPuppeteerPage } from '@/lib/pdf/puppeteer-pool'
import { storageProvider } from '@/lib/storage'
import { pdfCacheService } from '@/lib/redis/pdf-cache'
import { randomUUID } from 'crypto'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDateRange(start?: string, end?: string, isCurrent?: boolean): string {
  if (!start && !end && !isCurrent) return ''
  const endLabel = isCurrent ? 'Présent' : end ?? ''
  return start ? `${start} – ${endLabel}` : endLabel
}

function formatEducationPeriod(start?: string, end?: string): string {
  const startLabel = start?.trim() ?? ''
  const endLabel = end?.trim() ?? ''
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`
  return startLabel || endLabel
}

function formatParagraph(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br/>')
}

export function renderResumeHtml(snapshot: ResumeSnapshot): string {
  const accent = snapshot.templateConfig.accentColor ?? '#0051d5'
  const p = snapshot.personalInfo

  const experienceHtml = snapshot.experiences
    .map((e) => {
      const period = formatDateRange(e.startDate, e.endDate, e.isCurrent)
      return `
      <div class="item">
        <div class="item-head">
          <strong>${escapeHtml(e.position)} — ${escapeHtml(e.company)}</strong>
          ${period ? `<span>${escapeHtml(period)}</span>` : ''}
        </div>
        ${e.location ? `<p>${escapeHtml(e.location)}</p>` : ''}
        ${e.description?.trim() ? `<p>${formatParagraph(e.description)}</p>` : ''}
      </div>`
    })
    .join('')

  const educationHtml = snapshot.educations
    .map((e) => {
      const period = formatEducationPeriod(e.startDate, e.endDate)
      return `
      <div class="item">
        <strong>${escapeHtml(e.degree)}</strong>
        ${e.institution ? `<p>${escapeHtml(e.institution)}</p>` : ''}
        ${e.field ? `<p>${escapeHtml(e.field)}</p>` : ''}
        ${period ? `<p>${escapeHtml(period)}</p>` : ''}
      </div>`
    })
    .join('')

  const skillsHtml = snapshot.skills.map((s) => `<span class="tag">${escapeHtml(s.name)}</span>`).join('')
  const languagesHtml = snapshot.languages?.length
    ? `<section><h2>Langues</h2><p>${snapshot.languages.map((l) => escapeHtml(l.name)).join(', ')}</p></section>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: Inter, Arial, sans-serif; color: #0b1c30; font-size: 11pt; line-height: 1.5; }
    header { border-bottom: 2px solid ${accent}; padding-bottom: 12px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 24pt; text-transform: uppercase; }
    .subtitle { color: ${accent}; font-weight: 600; margin-top: 4px; }
    .contact { color: #45464d; font-size: 10pt; margin-top: 8px; }
    h2 { font-size: 11pt; text-transform: uppercase; border-bottom: 1px solid #c6c6cd; padding-bottom: 4px; margin: 20px 0 10px; }
    .item { margin-bottom: 12px; }
    .item-head { display: flex; justify-content: space-between; gap: 12px; }
    .tag { display: inline-block; background: #eff4ff; padding: 2px 8px; border-radius: 4px; margin: 0 6px 6px 0; font-size: 9pt; }
    p { margin: 4px 0; color: #45464d; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(p.fullName ?? 'Votre nom')}</h1>
    <div class="subtitle">${escapeHtml(p.jobTitle ?? '')}</div>
    <div class="contact">
      ${[p.email, p.phone, p.location, p.linkedinUrl].filter((v): v is string => Boolean(v)).map(escapeHtml).join(' • ')}
    </div>
  </header>
  ${snapshot.summary ? `<section><h2>Profil</h2><p>${formatParagraph(snapshot.summary)}</p></section>` : ''}
  ${experienceHtml ? `<section><h2>Expérience</h2>${experienceHtml}</section>` : ''}
  ${educationHtml ? `<section><h2>Formation</h2>${educationHtml}</section>` : ''}
  ${skillsHtml ? `<section><h2>Compétences</h2>${skillsHtml}</section>` : ''}
  ${languagesHtml}
</body>
</html>`
}

async function renderPdfFromPrintUrl(printUrl: string): Promise<Buffer> {
  const blockedUrlPrefixes = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://fonts.bunny.net',
  ]

  return withPuppeteerPage(async (page) => {
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      const url = request.url()
      if (blockedUrlPrefixes.some((prefix) => url.startsWith(prefix))) {
        void request.abort()
        return
      }
      void request.continue()
    })

    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
    await page.goto(printUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 })

    const errorHandle = await page.$('[data-cv-error="true"]')
    if (errorHandle) {
      const errorText = await page
        .$eval('[data-cv-error="true"]', (el) => el.textContent?.trim() || '')
        .catch(() => '')
      throw new Error(
        errorText
          ? `La page d'impression n'a pas pu charger le CV (${errorText})`
          : "La page d'impression n'a pas pu charger le CV",
      )
    }

    await page.waitForSelector('[data-cv-ready="true"]', { timeout: 30_000 })
    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise<void>((resolve) => setTimeout(resolve, 2000)),
        ])
      }
    })

    return Buffer.from(
      await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      }),
    )
  })
}

async function renderResumePdfFromHtml(snapshot: ResumeSnapshot): Promise<Buffer> {
  return htmlToPdf(renderResumeHtml(snapshot))
}

async function withTransientRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (!isTransientPuppeteerError(error)) throw error
    return operation()
  }
}

async function mergePdfBuffers(buffers: Buffer[]): Promise<Buffer> {
  if (buffers.length === 1) return buffers[0]!
  const { PDFDocument } = await import('pdf-lib')
  const merged = await PDFDocument.create()
  for (const buffer of buffers) {
    const doc = await PDFDocument.load(buffer)
    const pages = await merged.copyPages(doc, doc.getPageIndices())
    for (const page of pages) merged.addPage(page)
  }
  return Buffer.from(await merged.save())
}

export interface CoverLetterPdfInput {
  templateSlug: string
  title: string
  senderName?: string | null
  senderEmail?: string | null
  senderPhone?: string | null
  senderLocation?: string | null
  companyName?: string | null
  companyAddress?: string | null
  position?: string | null
  recruiterName?: string | null
  content: string
  closingText?: string | null
}

/** @deprecated Utiliser generateCoverLetterPdf avec la page /imprimer/lettre */
export function renderCoverLetterHtml(letter: CoverLetterPdfInput): string {
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const greeting = letter.recruiterName
    ? `Madame ${escapeHtml(letter.recruiterName)},`
    : 'Madame, Monsieur,'

  const paragraphs = letter.content
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br/>')}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 25mm; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #0b1c30; font-size: 11pt; line-height: 1.7; }
    .meta { text-align: right; color: #45464d; font-size: 10pt; margin-bottom: 32px; }
    .subject { font-weight: bold; margin: 24px 0; }
    p { margin: 0 0 14px; text-align: justify; }
    .closing { margin-top: 24px; }
  </style>
</head>
<body>
  <div class="meta">${date}</div>
  ${letter.companyName ? `<p>${escapeHtml(letter.companyName)}</p>` : ''}
  <p>${greeting}</p>
  ${letter.position ? `<p class="subject">Objet : Candidation — ${escapeHtml(letter.position)}</p>` : ''}
  ${paragraphs}
  <p class="closing">Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
</body>
</html>`
}

async function htmlToPdf(html: string): Promise<Buffer> {
  return withPuppeteerPage(async (page) => {
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    return Buffer.from(
      await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } }),
    )
  })
}

type GenerateContext = {
  userId?: string
  guestSessionDbId?: string
}

type SnapshotJobOwner = {
  userId?: string
  guestSessionDbId?: string
  resumeId?: string
}

function buildPdfExpiresAt(): Date {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + PDF_TTL_HOURS)
  return expiresAt
}

async function maybeConsumeSnapshotCredit(owner?: SnapshotJobOwner) {
  if (!owner) return
  if (owner.userId && owner.resumeId) return
  const { paymentService } = await import('@/modules/payment/payment.service')
  await paymentService.consumeSnapshotDownload({
    userId: owner.userId,
    guestSessionDbId: owner.guestSessionDbId,
  })
}

export class PdfService {
  /** Démarre la génération PDF CV (async) — évite les timeouts nginx sur requêtes longues. */
  async startSnapshotPdfJob(
    snapshot: ResumeSnapshot,
    guestSessionDbId?: string,
    ctx?: GenerateContext,
    owner?: SnapshotJobOwner,
  ) {
    const expiresAt = buildPdfExpiresAt()

    const cachedPdf = await pdfCacheService.get(snapshot, 'resume')
    if (cachedPdf) {
      const storageKey = `pdf/${randomUUID()}.pdf`
      await storageProvider.upload(cachedPdf, storageKey, 'application/pdf')
      const job = await prisma.pdfJob.create({
        data: {
          guestSessionId: guestSessionDbId,
          storageKey,
          status: 'completed',
          completedAt: new Date(),
          expiresAt,
        },
      })
      await maybeConsumeSnapshotCredit(owner)
      return { jobId: job.id, status: 'completed' as const, expiresAt }
    }

    const job = await prisma.pdfJob.create({
      data: {
        guestSessionId: guestSessionDbId,
        status: 'processing',
        expiresAt,
      },
    })

    void this.runSnapshotPdfJob(job.id, snapshot, guestSessionDbId, ctx, owner)

    return { jobId: job.id, status: 'processing' as const, expiresAt }
  }

  private async runSnapshotPdfJob(
    jobId: string,
    snapshot: ResumeSnapshot,
    guestSessionDbId?: string,
    ctx?: GenerateContext,
    owner?: SnapshotJobOwner,
  ) {
    const startedAt = Date.now()
    logPdfEvent({
      event: 'pdf_generate_start',
      kind: 'resume',
      templateSlug: snapshot.templateSlug,
      userId: ctx?.userId,
      guestSessionId: guestSessionDbId,
    })

    try {
      const renderId = randomUUID()
      const snapshotKey = `pdf-render/${renderId}.json`
      await storageProvider.upload(Buffer.from(JSON.stringify(snapshot), 'utf-8'), snapshotKey, 'application/json')

      const printUrl = `${resolveAppUrl()}/imprimer/cv?renderId=${renderId}`
      let pdfBuffer: Buffer
      try {
        pdfBuffer = await withTransientRetry(() => renderPdfFromPrintUrl(printUrl))
      } finally {
        await storageProvider.delete(snapshotKey)
      }

      await pdfCacheService.set(snapshot, 'resume', pdfBuffer)

      const storageKey = `pdf/${randomUUID()}.pdf`
      await storageProvider.upload(pdfBuffer, storageKey, 'application/pdf')
      const expiresAt = buildPdfExpiresAt()

      await prisma.pdfJob.update({
        where: { id: jobId },
        data: {
          storageKey,
          status: 'completed',
          completedAt: new Date(),
          expiresAt,
        },
      })

      await maybeConsumeSnapshotCredit(owner)

      logPdfEvent({
        event: 'pdf_generate_success',
        kind: 'resume',
        templateSlug: snapshot.templateSlug,
        userId: ctx?.userId,
        guestSessionId: guestSessionDbId,
        durationMs: Date.now() - startedAt,
      })
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown'
      await prisma.pdfJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage: detail.slice(0, 500),
          completedAt: new Date(),
        },
      })
      logPdfEvent({
        event: 'pdf_generate_error',
        kind: 'resume',
        templateSlug: snapshot.templateSlug,
        userId: ctx?.userId,
        guestSessionId: guestSessionDbId,
        durationMs: Date.now() - startedAt,
        error: detail,
      })
    }
  }

  /** @deprecated Préférer startSnapshotPdfJob pour éviter les timeouts HTTP. */
  async generateFromSnapshot(snapshot: ResumeSnapshot, guestSessionDbId?: string, ctx?: GenerateContext) {
    const startedAt = Date.now()

    // Vérifier le cache Redis
    const cachedPdf = await pdfCacheService.get(snapshot, 'resume')
    if (cachedPdf) {
      logPdfEvent({
        event: 'pdf_cache_hit',
        kind: 'resume',
        templateSlug: snapshot.templateSlug,
        userId: ctx?.userId,
        guestSessionId: guestSessionDbId,
        durationMs: Date.now() - startedAt,
      })

      const storageKey = `pdf/${randomUUID()}.pdf`
      await storageProvider.upload(cachedPdf, storageKey, 'application/pdf')

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + PDF_TTL_HOURS)

      const job = await prisma.pdfJob.create({
        data: {
          guestSessionId: guestSessionDbId,
          storageKey,
          status: 'completed',
          completedAt: new Date(),
          expiresAt,
        },
      })

      return { jobId: job.id, storageKey, expiresAt, cached: true }
    }

    logPdfEvent({
      event: 'pdf_generate_start',
      kind: 'resume',
      templateSlug: snapshot.templateSlug,
      userId: ctx?.userId,
      guestSessionId: guestSessionDbId,
    })

    const renderId = randomUUID()
    const snapshotKey = `pdf-render/${renderId}.json`
    await storageProvider.upload(Buffer.from(JSON.stringify(snapshot), 'utf-8'), snapshotKey, 'application/json')

    const printUrl = `${resolveAppUrl()}/imprimer/cv?renderId=${renderId}`
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await withTransientRetry(() => renderPdfFromPrintUrl(printUrl))
    } catch (printError) {
      const printDetail = printError instanceof Error ? printError.message : 'unknown'
      logPdfEvent({
        event: 'pdf_generate_error',
        kind: 'resume',
        templateSlug: snapshot.templateSlug,
        userId: ctx?.userId,
        guestSessionId: guestSessionDbId,
        durationMs: Date.now() - startedAt,
        error: printDetail,
      })
      throw new Error(`Impossible de générer le PDF (${printDetail}).`)
    } finally {
      await storageProvider.delete(snapshotKey)
    }

    // Stocker dans le cache pour les prochaines requêtes
    await pdfCacheService.set(snapshot, 'resume', pdfBuffer)

    const storageKey = `pdf/${randomUUID()}.pdf`
    await storageProvider.upload(pdfBuffer, storageKey, 'application/pdf')

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + PDF_TTL_HOURS)

    const job = await prisma.pdfJob.create({
      data: {
        guestSessionId: guestSessionDbId,
        storageKey,
        status: 'completed',
        completedAt: new Date(),
        expiresAt,
      },
    })

    logPdfEvent({
      event: 'pdf_generate_success',
      kind: 'resume',
      templateSlug: snapshot.templateSlug,
      userId: ctx?.userId,
      guestSessionId: guestSessionDbId,
      durationMs: Date.now() - startedAt,
    })

    return { jobId: job.id, storageKey, expiresAt, cached: false }
  }

  async startCoverLetterPdfJob(
    letter: CoverLetterPdfInput,
    ctx?: GenerateContext,
    owner?: SnapshotJobOwner,
  ) {
    const expiresAt = buildPdfExpiresAt()
    const guestSessionDbId = ctx?.guestSessionDbId

    const cachedPdf = await pdfCacheService.get(letter, 'cover_letter')
    if (cachedPdf) {
      const storageKey = `pdf/${randomUUID()}.pdf`
      await storageProvider.upload(cachedPdf, storageKey, 'application/pdf')
      const job = await prisma.pdfJob.create({
        data: {
          guestSessionId: guestSessionDbId,
          storageKey,
          status: 'completed',
          completedAt: new Date(),
          expiresAt,
        },
      })
      await maybeConsumeSnapshotCredit(owner)
      return { jobId: job.id, status: 'completed' as const, expiresAt }
    }

    const job = await prisma.pdfJob.create({
      data: {
        guestSessionId: guestSessionDbId,
        status: 'processing',
        expiresAt,
      },
    })

    void this.runCoverLetterPdfJob(job.id, letter, ctx, owner)

    return { jobId: job.id, status: 'processing' as const, expiresAt }
  }

  private async runCoverLetterPdfJob(
    jobId: string,
    letter: CoverLetterPdfInput,
    ctx?: GenerateContext,
    owner?: SnapshotJobOwner,
  ) {
    const startedAt = Date.now()
    const guestSessionDbId = ctx?.guestSessionDbId

    logPdfEvent({
      event: 'pdf_generate_start',
      kind: 'cover_letter',
      templateSlug: letter.templateSlug,
      userId: ctx?.userId,
      guestSessionId: guestSessionDbId,
    })

    try {
      const renderId = randomUUID()
      const snapshotKey = `pdf-render/${renderId}.json`
      await storageProvider.upload(Buffer.from(JSON.stringify(letter), 'utf-8'), snapshotKey, 'application/json')

      const printUrl = `${resolveAppUrl()}/imprimer/lettre?renderId=${renderId}`
      let pdfBuffer: Buffer
      try {
        pdfBuffer = await withTransientRetry(() => renderPdfFromPrintUrl(printUrl))
      } finally {
        await storageProvider.delete(snapshotKey)
      }

      await pdfCacheService.set(letter, 'cover_letter', pdfBuffer)

      const storageKey = `pdf/${randomUUID()}.pdf`
      await storageProvider.upload(pdfBuffer, storageKey, 'application/pdf')
      const expiresAt = buildPdfExpiresAt()

      await prisma.pdfJob.update({
        where: { id: jobId },
        data: {
          storageKey,
          status: 'completed',
          completedAt: new Date(),
          expiresAt,
        },
      })

      await maybeConsumeSnapshotCredit(owner)

      logPdfEvent({
        event: 'pdf_generate_success',
        kind: 'cover_letter',
        templateSlug: letter.templateSlug,
        userId: ctx?.userId,
        guestSessionId: guestSessionDbId,
        durationMs: Date.now() - startedAt,
      })
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown'
      await prisma.pdfJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage: detail.slice(0, 500),
          completedAt: new Date(),
        },
      })
      logPdfEvent({
        event: 'pdf_generate_error',
        kind: 'cover_letter',
        templateSlug: letter.templateSlug,
        userId: ctx?.userId,
        guestSessionId: guestSessionDbId,
        durationMs: Date.now() - startedAt,
        error: detail,
      })
    }
  }

  async generateCoverLetterPdf(letter: CoverLetterPdfInput, ctx?: GenerateContext) {
    const startedAt = Date.now()

    // Vérifier le cache Redis
    const cachedPdf = await pdfCacheService.get(letter, 'cover_letter')
    if (cachedPdf) {
      logPdfEvent({
        event: 'pdf_cache_hit',
        kind: 'cover_letter',
        templateSlug: letter.templateSlug,
        userId: ctx?.userId,
        durationMs: Date.now() - startedAt,
      })

      const storageKey = `pdf/${randomUUID()}.pdf`
      await storageProvider.upload(cachedPdf, storageKey, 'application/pdf')

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + PDF_TTL_HOURS)

      const job = await prisma.pdfJob.create({
        data: {
          guestSessionId: ctx?.guestSessionDbId,
          storageKey,
          status: 'completed',
          completedAt: new Date(),
          expiresAt,
        },
      })

      return { jobId: job.id, expiresAt, cached: true }
    }

    logPdfEvent({
      event: 'pdf_generate_start',
      kind: 'cover_letter',
      templateSlug: letter.templateSlug,
      userId: ctx?.userId,
      guestSessionId: ctx?.guestSessionDbId,
    })

    const renderId = randomUUID()
    const snapshotKey = `pdf-render/${renderId}.json`
    await storageProvider.upload(Buffer.from(JSON.stringify(letter), 'utf-8'), snapshotKey, 'application/json')

    const printUrl = `${resolveAppUrl()}/imprimer/lettre?renderId=${renderId}`
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await withTransientRetry(() => renderPdfFromPrintUrl(printUrl))
    } catch (printError) {
      const printDetail = printError instanceof Error ? printError.message : 'unknown'
      logPdfEvent({
        event: 'pdf_generate_error',
        kind: 'cover_letter',
        templateSlug: letter.templateSlug,
        userId: ctx?.userId,
        durationMs: Date.now() - startedAt,
        error: printDetail,
      })
      throw new Error(`Impossible de générer le PDF de la lettre (${printDetail}).`)
    } finally {
      await storageProvider.delete(snapshotKey)
    }

    // Stocker dans le cache pour les prochaines requêtes
    await pdfCacheService.set(letter, 'cover_letter', pdfBuffer)

    try {
      const storageKey = `pdf/${randomUUID()}.pdf`
      await storageProvider.upload(pdfBuffer, storageKey, 'application/pdf')

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + PDF_TTL_HOURS)

      const job = await prisma.pdfJob.create({
        data: {
          guestSessionId: ctx?.guestSessionDbId,
          storageKey,
          status: 'completed',
          completedAt: new Date(),
          expiresAt,
        },
      })

      logPdfEvent({
        event: 'pdf_generate_success',
        kind: 'cover_letter',
        templateSlug: letter.templateSlug,
        userId: ctx?.userId,
        guestSessionId: ctx?.guestSessionDbId,
        durationMs: Date.now() - startedAt,
      })

      return { jobId: job.id, expiresAt, cached: false }
    } catch (error) {
      logPdfEvent({
        event: 'pdf_generate_error',
        kind: 'cover_letter',
        templateSlug: letter.templateSlug,
        userId: ctx?.userId,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'unknown',
      })
      throw error
    }
  }

  /**
   * Rend un PDF (CV ou lettre) en buffer via la page d'impression Nuxt,
   * sans persister de job. Le snapshot de rendu est nettoyé après usage.
   */
  private async renderPrintBuffer(payload: unknown, printPath: 'cv' | 'lettre'): Promise<Buffer> {
    const renderId = randomUUID()
    const snapshotKey = `pdf-render/${renderId}.json`
    await storageProvider.upload(Buffer.from(JSON.stringify(payload), 'utf-8'), snapshotKey, 'application/json')
    const printUrl = `${resolveAppUrl()}/imprimer/${printPath}?renderId=${renderId}`
    try {
      return await renderPdfFromPrintUrl(printUrl)
    } finally {
      await storageProvider.delete(snapshotKey)
    }
  }

  /**
   * Génère le dossier de candidature unifié : CV + lettres liées fusionnés
   * en un seul PDF téléchargeable.
   */
  async generateDossierPdf(
    snapshot: ResumeSnapshot,
    letters: CoverLetterPdfInput[],
    ctx?: GenerateContext & { resumeId?: string },
  ) {
    const startedAt = Date.now()

    // Créer un objet combiné pour le cache
    const dossierPayload = { ...snapshot, letters }

    // Vérifier le cache Redis
    const cachedPdf = await pdfCacheService.get(dossierPayload, 'dossier')
    if (cachedPdf) {
      logPdfEvent({
        event: 'pdf_cache_hit',
        kind: 'resume',
        templateSlug: snapshot.templateSlug,
        userId: ctx?.userId,
        durationMs: Date.now() - startedAt,
      })

      const storageKey = `pdf/${randomUUID()}.pdf`
      await storageProvider.upload(cachedPdf, storageKey, 'application/pdf')

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + PDF_TTL_HOURS)

      const job = await prisma.pdfJob.create({
        data: {
          resumeId: ctx?.resumeId ?? null,
          storageKey,
          status: 'completed',
          completedAt: new Date(),
          expiresAt,
        },
      })

      return { jobId: job.id, expiresAt, cached: true }
    }

    logPdfEvent({
      event: 'pdf_generate_start',
      kind: 'resume',
      templateSlug: snapshot.templateSlug,
      userId: ctx?.userId,
    })

    let merged: Buffer
    try {
      const cvBuffer = await withTransientRetry(() => this.renderPrintBuffer(snapshot, 'cv'))
      const letterBuffers: Buffer[] = []
      for (const letter of letters) {
        letterBuffers.push(await withTransientRetry(() => this.renderPrintBuffer(letter, 'lettre')))
      }
      merged = await mergePdfBuffers([cvBuffer, ...letterBuffers])
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown'
      logPdfEvent({
        event: 'pdf_generate_error',
        kind: 'resume',
        templateSlug: snapshot.templateSlug,
        userId: ctx?.userId,
        durationMs: Date.now() - startedAt,
        error: detail,
      })
      throw new Error(
        `Impossible de générer le dossier (${detail}). ` +
          'Vérifiez que l\'application web est démarrée (pnpm run dev sur le port 3000).',
      )
    }

    // Stocker dans le cache pour les prochaines requêtes
    await pdfCacheService.set(dossierPayload, 'dossier', merged)

    const storageKey = `pdf/${randomUUID()}.pdf`
    await storageProvider.upload(merged, storageKey, 'application/pdf')

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + PDF_TTL_HOURS)

    const job = await prisma.pdfJob.create({
      data: {
        resumeId: ctx?.resumeId ?? null,
        storageKey,
        status: 'completed',
        completedAt: new Date(),
        expiresAt,
      },
    })

    logPdfEvent({
      event: 'pdf_generate_success',
      kind: 'resume',
      templateSlug: snapshot.templateSlug,
      userId: ctx?.userId,
      durationMs: Date.now() - startedAt,
    })

    return { jobId: job.id, expiresAt, cached: false }
  }

  async getJob(jobId: string) {
    return prisma.pdfJob.findUnique({ where: { id: jobId } })
  }

  async readPdf(storageKey: string) {
    return storageProvider.read(storageKey)
  }
}

export const pdfService = new PdfService()
