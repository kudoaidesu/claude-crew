/**
 * エージェントメモリ — マークダウンファイル管理
 *
 * 各エージェント（フロントデスク + プロジェクトワーカー）に
 * 永続的な記憶領域を提供する。人間が直接編集可能。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProjectConfig } from '../config.js'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const MEMORY_DIR = join(projectRoot, 'data', 'agent-memory')

export interface AgentMemory {
  slug: string
  content: string
  lastModified: number
}

function ensureDir(): void {
  if (!existsSync(MEMORY_DIR)) mkdirSync(MEMORY_DIR, { recursive: true })
}

export function getMemoryPath(slug: string): string {
  return join(MEMORY_DIR, `${slug}.md`)
}

export function readAgentMemory(slug: string): AgentMemory | null {
  const filePath = getMemoryPath(slug)
  if (!existsSync(filePath)) return null

  try {
    const content = readFileSync(filePath, 'utf-8')
    const mtime = statSync(filePath).mtimeMs
    return { slug, content, lastModified: mtime }
  } catch {
    return null
  }
}

export function writeAgentMemory(slug: string, content: string): void {
  ensureDir()
  writeFileSync(getMemoryPath(slug), content, 'utf-8')
}

/**
 * projects.json のプロジェクト一覧をもとに、
 * 未作成のメモリファイルをテンプレートから自動生成する。
 */
export function ensureMemoryFiles(projects: ProjectConfig[]): void {
  ensureDir()

  // フロントデスク
  if (!existsSync(getMemoryPath('front-desk'))) {
    writeAgentMemory('front-desk', FRONT_DESK_TEMPLATE(projects))
  }

  // 各プロジェクト
  for (const p of projects) {
    if (!existsSync(getMemoryPath(p.slug))) {
      writeAgentMemory(p.slug, PROJECT_TEMPLATE(p))
    }
  }
}

// ── テンプレート ──────────────────────────────────────

function FRONT_DESK_TEMPLATE(projects: ProjectConfig[]): string {
  const projectList = projects.map(p => `- **${p.slug}**: ${p.repo} (${p.localPath})`).join('\n')
  return `# フロントデスク記憶

## 役割
複数プロジェクトを横断管理し、ユーザーの指示を解釈して適切なワーカーに委任する。

## 管理プロジェクト
${projectList || '(未登録)'}

## ユーザーの傾向
<!-- 対話から学んだ傾向をここに記録 -->

## 最近の判断
<!-- 重要な委任判断や横断的な決定を記録 -->
`
}

function PROJECT_TEMPLATE(p: ProjectConfig): string {
  return `# ${p.slug} ワーカー記憶

## プロジェクト情報
- **リポジトリ**: ${p.repo}
- **ローカルパス**: ${p.localPath}

## 技術スタック
<!-- このプロジェクトで使われている技術を記録 -->

## 重要な設計判断
<!-- アーキテクチャ上の決定事項を記録 -->

## 最近の作業
<!-- 直近の作業内容・状態を記録 -->

## 注意事項
<!-- プロジェクト固有の制約や注意点 -->
`
}
