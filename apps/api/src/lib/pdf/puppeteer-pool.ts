import { existsSync } from 'fs'

const SYSTEM_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

const MAX_CONCURRENT = Number(process.env.PDF_MAX_CONCURRENT ?? 2)
const BROWSER_IDLE_MS = Number(process.env.PDF_BROWSER_IDLE_MS ?? 60_000)

type PuppeteerBrowser = Awaited<
  ReturnType<(typeof import('puppeteer'))['default']['launch']>
>
type PuppeteerPage = Awaited<ReturnType<PuppeteerBrowser['newPage']>>

class Semaphore {
  private active = 0
  private queue: Array<() => void> = []

  constructor(private readonly max: number) {}

  async acquire() {
    if (this.active < this.max) {
      this.active += 1
      return
    }
    await new Promise<void>((resolve) => this.queue.push(resolve))
    this.active += 1
  }

  release() {
    this.active = Math.max(0, this.active - 1)
    const next = this.queue.shift()
    if (next) next()
  }
}

const semaphore = new Semaphore(MAX_CONCURRENT)
let browser: PuppeteerBrowser | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null
let launchPromise: Promise<PuppeteerBrowser> | null = null

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

function scheduleBrowserClose() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    void closeBrowser()
  }, BROWSER_IDLE_MS)
}

async function closeBrowser() {
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
  if (!browser) return
  const current = browser
  browser = null
  launchPromise = null
  await current.close().catch(() => undefined)
}

async function getBrowser(): Promise<PuppeteerBrowser> {
  if (browser?.connected) return browser
  browser = null

  if (!launchPromise) {
    launchPromise = (async () => {
      const puppeteer = await import('puppeteer')
      const executablePath = await resolveBrowserExecutable()
      const instance = await puppeteer.default.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      })
      instance.on('disconnected', () => {
        browser = null
        launchPromise = null
      })
      browser = instance
      return instance
    })()
  }

  return launchPromise
}

export function isTransientPuppeteerError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /timeout|ERR_|Navigation|Target closed|net::|Session closed/i.test(message)
}

export async function withPuppeteerPage<T>(run: (page: PuppeteerPage) => Promise<T>): Promise<T> {
  await semaphore.acquire()
  try {
    const activeBrowser = await getBrowser()
    const page = await activeBrowser.newPage()
    try {
      return await run(page)
    } finally {
      await page.close().catch(() => undefined)
    }
  } finally {
    semaphore.release()
    scheduleBrowserClose()
  }
}

export async function resetPuppeteerPoolForTests() {
  await closeBrowser()
}
