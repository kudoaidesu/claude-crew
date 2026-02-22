import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { config } from '../config.js'
import { createLogger } from './logger.js'

const log = createLogger('usage-monitor')

// --- Types ---

export type UsageProvider = 'claude' | 'codex'

export interface ParsedUsage {
  summary: string
  usagePercent?: number
  resetAt?: string
  details: Record<string, string>
}

export interface UsageSnapshot {
  timestamp: string
  provider: UsageProvider
  raw: string
  parsed: ParsedUsage | null
  error?: string
}

export interface UsageReport {
  claude: UsageSnapshot | null
  codex: UsageSnapshot | null
  scrapedAt: string
}

// --- JSONL Storage ---

const usageFilePath = join(config.queue.dataDir, 'usage.jsonl')

function ensureDir(): void {
  const dir = dirname(usageFilePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function appendSnapshot(snapshot: UsageSnapshot): void {
  ensureDir()
  appendFileSync(usageFilePath, JSON.stringify(snapshot) + '\n', 'utf-8')
}

function readAllSnapshots(): UsageSnapshot[] {
  if (!existsSync(usageFilePath)) return []
  const lines = readFileSync(usageFilePath, 'utf-8')
    .split('\n')
    .filter((line) => line.trim())
  return lines.map((line) => JSON.parse(line) as UsageSnapshot)
}

// --- Browser Management ---

interface PlaywrightModule {
  chromium: {
    launchPersistentContext: (
      userDataDir: string,
      options: Record<string, unknown>,
    ) => Promise<BrowserContext>
  }
}

interface BrowserContext {
  pages: () => Page[]
  newPage: () => Promise<Page>
  close: () => Promise<void>
}

interface Page {
  goto: (url: string, options?: Record<string, unknown>) => Promise<unknown>
  url: () => string
  waitForTimeout: (ms: number) => Promise<void>
  evaluate: <T>(fn: () => T) => Promise<T>
}

async function createBrowserContext(): Promise<BrowserContext> {
  const { chromium } = (await import('playwright')) as unknown as PlaywrightModule
  const userDataDir = config.usageMonitor.chromeUserDataDir

  if (!existsSync(userDataDir)) {
    mkdirSync(userDataDir, { recursive: true })
  }

  return chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
    timeout: config.usageMonitor.timeoutMs,
  })
}

// --- Scraping ---

async function scrapeClaudeUsage(page: Page): Promise<UsageSnapshot> {
  const timestamp = new Date().toISOString()
  try {
    await page.goto(config.usageMonitor.claudeUsageUrl, {
      waitUntil: 'networkidle',
      timeout: config.usageMonitor.timeoutMs,
    })

    if (page.url().includes('/login')) {
      return {
        timestamp,
        provider: 'claude',
        raw: '',
        parsed: null,
        error: '認証切れ — npm run setup:usage で再ログインしてください',
      }
    }

    await page.waitForTimeout(3000)

    const raw = await page.evaluate(() => {
      const main = document.querySelector('main') ?? document.body
      return main.innerText
    })

    const parsed = parseClaudeUsage(raw)
    return { timestamp, provider: 'claude', raw, parsed }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error(`Claude usage scrape failed: ${message}`)
    return { timestamp, provider: 'claude', raw: '', parsed: null, error: message }
  }
}

async function scrapeCodexUsage(page: Page): Promise<UsageSnapshot> {
  const timestamp = new Date().toISOString()
  try {
    await page.goto(config.usageMonitor.codexUsageUrl, {
      waitUntil: 'networkidle',
      timeout: config.usageMonitor.timeoutMs,
    })

    if (page.url().includes('/auth/login') || page.url().includes('/login')) {
      return {
        timestamp,
        provider: 'codex',
        raw: '',
        parsed: null,
        error: '認証切れ — npm run setup:usage で再ログインしてください',
      }
    }

    await page.waitForTimeout(3000)

    const raw = await page.evaluate(() => {
      const main = document.querySelector('main') ?? document.body
      return main.innerText
    })

    const parsed = parseCodexUsage(raw)
    return { timestamp, provider: 'codex', raw, parsed }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error(`Codex usage scrape failed: ${message}`)
    return { timestamp, provider: 'codex', raw: '', parsed: null, error: message }
  }
}

// --- Parsing (defensive) ---

function parseClaudeUsage(raw: string): ParsedUsage | null {
  if (!raw.trim()) return null

  const details: Record<string, string> = {}
  const lines = raw.split('\n').filter((l) => l.trim())

  const percentMatch = raw.match(/(\d{1,3})\s*%/)
  const usagePercent = percentMatch ? Number(percentMatch[1]) : undefined

  const resetMatch = raw.match(/resets?\s+(?:on\s+)?(.+?)(?:\.|$)/i)
  const resetAt = resetMatch ? resetMatch[1].trim() : undefined

  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0 && colonIdx < line.length - 1) {
      const key = line.slice(0, colonIdx).trim()
      const value = line.slice(colonIdx + 1).trim()
      if (key.length < 50 && value.length < 200) {
        details[key] = value
      }
    }
  }

  const summary = lines.slice(0, 5).join(' | ').slice(0, 200)
  return { summary, usagePercent, resetAt, details }
}

function parseCodexUsage(raw: string): ParsedUsage | null {
  if (!raw.trim()) return null

  const details: Record<string, string> = {}
  const lines = raw.split('\n').filter((l) => l.trim())

  const percentMatch = raw.match(/(\d{1,3})\s*%/)
  const usagePercent = percentMatch ? Number(percentMatch[1]) : undefined

  const resetMatch = raw.match(/resets?\s+(?:on\s+)?(.+?)(?:\.|$)/i)
  const resetAt = resetMatch ? resetMatch[1].trim() : undefined

  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0 && colonIdx < line.length - 1) {
      const key = line.slice(0, colonIdx).trim()
      const value = line.slice(colonIdx + 1).trim()
      if (key.length < 50 && value.length < 200) {
        details[key] = value
      }
    }
  }

  const summary = lines.slice(0, 5).join(' | ').slice(0, 200)
  return { summary, usagePercent, resetAt, details }
}

// --- Public API ---

export async function scrapeUsage(): Promise<UsageReport> {
  log.info('Starting usage scrape...')
  let context: BrowserContext | null = null

  try {
    context = await createBrowserContext()
    const page = context.pages()[0] ?? await context.newPage()

    const claude = await scrapeClaudeUsage(page)
    appendSnapshot(claude)

    if (claude.error) {
      log.warn(`Claude: ${claude.error}`)
    } else {
      log.info(`Claude: ${claude.parsed?.summary ?? 'parsed=null'}`)
    }

    const codex = await scrapeCodexUsage(page)
    appendSnapshot(codex)

    if (codex.error) {
      log.warn(`Codex: ${codex.error}`)
    } else {
      log.info(`Codex: ${codex.parsed?.summary ?? 'parsed=null'}`)
    }

    return { claude, codex, scrapedAt: new Date().toISOString() }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error(`Usage scrape failed: ${message}`)
    return { claude: null, codex: null, scrapedAt: new Date().toISOString() }
  } finally {
    if (context) {
      await context.close().catch((err: unknown) => {
        log.warn(`Failed to close browser: ${(err as Error).message}`)
      })
    }
  }
}

export function getLatestUsage(): UsageReport {
  const snapshots = readAllSnapshots()

  let claude: UsageSnapshot | null = null
  let codex: UsageSnapshot | null = null

  for (let i = snapshots.length - 1; i >= 0; i--) {
    const s = snapshots[i]
    if (!claude && s.provider === 'claude') claude = s
    if (!codex && s.provider === 'codex') codex = s
    if (claude && codex) break
  }

  return {
    claude,
    codex,
    scrapedAt: claude?.timestamp ?? codex?.timestamp ?? new Date().toISOString(),
  }
}
