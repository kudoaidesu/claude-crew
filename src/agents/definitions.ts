/**
 * エージェント定義 — projects.json + メモリからサブエージェントを動的生成
 *
 * フロントデスクモードで利用。各プロジェクトにワーカーエージェントを配置し、
 * Codex MCPアドバイザーを全ワーカーからアクセス可能にする。
 */
import type { ProjectConfig } from '../config.js'
import { readAgentMemory } from './memory.js'

/**
 * Agent SDK の AgentDefinition 型（sdk.d.ts から抽出）
 * import せず再定義することで SDK の内部型に依存しない
 */
export interface AgentDefinition {
  description: string
  prompt: string
  tools?: string[]
  disallowedTools?: string[]
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit'
  maxTurns?: number
  skills?: string[]
}

/** 単一プロジェクトのワーカーエージェント定義を生成 */
export function buildWorkerAgent(project: ProjectConfig): AgentDefinition {
  const memory = readAgentMemory(project.slug)
  const memorySection = memory
    ? `\n## ワーカー記憶\n${memory.content}`
    : ''

  return {
    description:
      `${project.slug} プロジェクト (${project.repo}) の開発タスクを担当するワーカー。` +
      `コード変更、レビュー、バグ修正、機能追加を実行する。` +
      `作業ディレクトリ: ${project.localPath}`,
    prompt: [
      `あなたは「${project.slug}」プロジェクト専属のワーカーエージェントです。`,
      ``,
      `## プロジェクト情報`,
      `- リポジトリ: ${project.repo}`,
      `- ローカルパス: ${project.localPath}`,
      ``,
      `## 作業ルール`,
      `- 必ず ${project.localPath} を起点に絶対パスで操作してください`,
      `- プロジェクトの CLAUDE.md を読んでコーディング規約に従ってください`,
      `- 作業結果は明確に報告してください`,
      ``,
      `## Codex アドバイザー`,
      `設計判断やコードレビューで第三者の意見が必要な場合、Codex MCP を利用できます。`,
      `- 新規相談: mcp__codex-mcp__codex({ prompt: "...", model: "gpt-5.4", cwd: "${project.localPath}" })`,
      `- 継続: mcp__codex-mcp__codex-reply({ conversationId: "<SESSION_ID>", prompt: "..." })`,
      `- sandbox は read-only（デフォルト）。Codex はファイルを変更しません。`,
      `- レスポンス末尾の [SESSION_ID: xxx] を保持し、フォローアップに使用してください。`,
      memorySection,
    ].join('\n'),
    disallowedTools: ['Task'],  // サブエージェントのネスト防止
    model: 'inherit',
    maxTurns: 50,
  }
}

/** 全プロジェクトのワーカーエージェント定義を一括生成 */
export function buildAllAgents(projects: ProjectConfig[]): Record<string, AgentDefinition> {
  const agents: Record<string, AgentDefinition> = {}
  for (const project of projects) {
    agents[`worker-${project.slug}`] = buildWorkerAgent(project)
  }
  return agents
}

/** フロントデスク用の appendSystemPrompt を生成 */
export function buildFrontDeskPrompt(projects: ProjectConfig[]): string {
  const memory = readAgentMemory('front-desk')
  const memorySection = memory
    ? `\n## フロントデスク記憶\n${memory.content}`
    : ''

  const workerList = projects
    .map(p => `- **worker-${p.slug}**: ${p.repo} (${p.localPath})`)
    .join('\n')

  return [
    `あなたは pocket-cc のフロントデスクエージェントです。`,
    `複数プロジェクトを横断管理し、ワーカーエージェントに作業を委任します。`,
    ``,
    `## 利用可能なワーカー`,
    workerList || '(未登録)',
    ``,
    `## 委任方法`,
    `Task tool で worker-{slug} を指定してください:`,
    `  例: Task agent="worker-pocket-cc" prompt="Issue #42 を修正して"`,
    ``,
    `## Codex アドバイザー`,
    `設計レビュー・セキュリティ監査・アーキテクチャ相談に Codex を活用できます。`,
    `- mcp__codex-mcp__codex({ prompt: "...", model: "gpt-5.4" })`,
    `- セッションIDを保持して継続会話が可能`,
    `- ワーカーにも Codex 利用を指示できます`,
    ``,
    `## ガイドライン`,
    `- 特定プロジェクトの作業はワーカーに委任`,
    `- 横断的な質問や管理タスクは自分で対応`,
    `- 重要な設計判断は Codex にセカンドオピニオンを求める`,
    `- 結果をユーザーに明確に報告`,
    memorySection,
  ].join('\n')
}
