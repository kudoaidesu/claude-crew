import { existsSync, mkdirSync } from 'node:fs'
import { config } from '../config.js'

async function main(): Promise<void> {
  const { chromium } = await import('playwright')
  const userDataDir = config.usageMonitor.chromeUserDataDir

  if (!existsSync(userDataDir)) {
    mkdirSync(userDataDir, { recursive: true })
  }

  console.log('Usage Monitor 用の Chrome プロファイルをセットアップします。')
  console.log('以下のサイトにログインしてください:')
  console.log(`  1. ${config.usageMonitor.claudeUsageUrl}`)
  console.log(`  2. ${config.usageMonitor.codexUsageUrl}`)
  console.log('ログイン完了後、ブラウザを閉じてください。')

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled'],
  })

  const page = context.pages()[0] ?? await context.newPage()
  await page.goto(config.usageMonitor.claudeUsageUrl)

  await new Promise<void>((resolve) => {
    context.on('close', () => resolve())
  })

  console.log('プロファイルを保存しました。Usage Monitor の準備完了です。')
}

main().catch((err: unknown) => {
  console.error('セットアップ失敗:', err)
  process.exit(1)
})
