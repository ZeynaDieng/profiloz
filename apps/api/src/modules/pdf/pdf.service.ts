import type { ResumeSnapshot } from '@profiloz/shared'
import { PDF_TTL_HOURS } from '@profiloz/shared'
import { prisma } from '@/lib/prisma'
import { storageProvider } from '@/lib/storage/local-storage.provider'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'

const SYSTEM_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

async function resolveBrowserExecutable(): Promise<string> {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }

  const puppeteer = await import('puppeteer')
  try {
    const bundledPath = puppeteer.default.executablePath()
    if (existsSync(bundledPath)) return bundledPath
  } catch {
    // Bundled Chrome not installed for this Puppeteer version.
  }

  for (const path of SYSTEM_CHROME_PATHS) {
    if (existsSync(path)) return path
  }

  throw new Error(
    'Chrome introuvable. Installez Google Chrome ou exécutez: pnpm --filter @profiloz/api exec puppeteer browsers install chrome',
  )
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderResumeHtml(snapshot: ResumeSnapshot): string {
  const accent = snapshot.templateConfig.accentColor ?? '#0051d5'
  const p = snapshot.personalInfo

  const experienceHtml = snapshot.experiences
    .map(
      (e) => `
      <div class="item">
        <div class="item-head">
          <strong>${escapeHtml(e.position)} — ${escapeHtml(e.company)}</strong>
          <span>${escapeHtml(e.startDate ?? '')} – ${e.isCurrent ? 'Présent' : escapeHtml(e.endDate ?? '')}</span>
        </div>
        ${e.description ? `<p>${escapeHtml(e.description)}</p>` : ''}
      </div>`,
    )
    .join('')

  const educationHtml = snapshot.educations
    .map(
      (e) => `
      <div class="item">
        <strong>${escapeHtml(e.degree)}</strong>
        <p>${escapeHtml(e.institution)}${e.endDate ? ` • ${escapeHtml(e.endDate)}` : ''}</p>
      </div>`,
    )
    .join('')

  const skillsHtml = snapshot.skills.map((s) => `<span class="tag">${escapeHtml(s.name)}</span>`).join('')

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
  ${snapshot.summary ? `<section><h2>Profil</h2><p>${escapeHtml(snapshot.summary)}</p></section>` : ''}
  ${experienceHtml ? `<section><h2>Expérience</h2>${experienceHtml}</section>` : ''}
  ${educationHtml ? `<section><h2>Formation</h2>${educationHtml}</section>` : ''}
  ${skillsHtml ? `<section><h2>Compétences</h2>${skillsHtml}</section>` : ''}
</body>
</html>`
}

export interface CoverLetterPdfInput {
  title: string
  companyName?: string | null
  position?: string | null
  recruiterName?: string | null
  content: string
}

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
  ${letter.position ? `<p class="subject">Objet : Candidature — ${escapeHtml(letter.position)}</p>` : ''}
  ${paragraphs}
  <p class="closing">Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
</body>
</html>`
}

async function htmlToPdf(html: string): Promise<Buffer> {
  const puppeteer = await import('puppeteer')
  const executablePath = await resolveBrowserExecutable()
  const browser = await puppeteer.default.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    return Buffer.from(
      await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } }),
    )
  } finally {
    await browser.close()
  }
}

export class PdfService {
  async generateFromSnapshot(snapshot: ResumeSnapshot, guestSessionDbId?: string) {
    const html = renderResumeHtml(snapshot)
    let pdfBuffer: Buffer

    try {
      pdfBuffer = await htmlToPdf(html)
    } catch (error) {
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'unknown'}`)
    }

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

    return { jobId: job.id, storageKey, expiresAt }
  }

  async generateCoverLetterPdf(letter: CoverLetterPdfInput) {
    const html = renderCoverLetterHtml(letter)
    const pdfBuffer = await htmlToPdf(html)
    const storageKey = `pdf/${randomUUID()}.pdf`
    await storageProvider.upload(pdfBuffer, storageKey, 'application/pdf')

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + PDF_TTL_HOURS)

    const job = await prisma.pdfJob.create({
      data: {
        storageKey,
        status: 'completed',
        completedAt: new Date(),
        expiresAt,
      },
    })

    return { jobId: job.id, expiresAt }
  }

  async getJob(jobId: string) {
    return prisma.pdfJob.findUnique({ where: { id: jobId } })
  }

  async readPdf(storageKey: string) {
    return storageProvider.read(storageKey)
  }
}

export const pdfService = new PdfService()
