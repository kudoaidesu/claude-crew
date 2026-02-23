/**
 * チャットAPI — Agent SDK連携 + SSEストリーミング
 */
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { detectDanger } from '../danger-detect.js'
import { createLogger } from '../../utils/logger.js'

const log = createLogger('web:chat')

// Agent SDK の型（動的import用）
interface SdkMessage {
  type: string
  subtype?: string
  session_id?: string
  message?: {
    role: string
    content: Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown> }>
  }
  result?: string
  total_cost_usd?: number
  is_error?: boolean
  num_turns?: number
  duration_ms?: number
  // stream_event
  event?: {
    type: string
    delta?: { type: string; text?: string }
    content_block?: { type: string; name?: string }
  }
}

interface SdkModule {
  query: (params: { prompt: string; options: Record<string, unknown> }) => AsyncIterable<SdkMessage>
}

let sdkModule: SdkModule | null = null

async function loadSdk(): Promise<SdkModule> {
  if (sdkModule) return sdkModule
  delete process.env.CLAUDECODE
  sdkModule = await import('@anthropic-ai/claude-agent-sdk') as SdkModule
  return sdkModule
}

// アクティブセッション管理（インメモリ）
const sessions = new Map<string, { sessionId: string; project: string; lastUsed: number }>()

export const chatRoutes = new Hono()

// POST /api/chat — SSEストリーミングでClaudeの応答を返す
chatRoutes.post('/', async (c) => {
  const body = await c.req.json<{
    message: string
    project?: string
    sessionId?: string
    model?: string
  }>()

  if (!body.message?.trim()) {
    return c.json({ error: 'message is required' }, 400)
  }

  const cwd = body.project || process.cwd()
  const model = body.model || 'sonnet'

  log.info(`Chat request: "${body.message.slice(0, 60)}..." cwd=${cwd} model=${model}`)

  return streamSSE(c, async (stream) => {
    try {
      const sdk = await loadSdk()

      const options: Record<string, unknown> = {
        cwd,
        model,
        maxTurns: 50,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        includePartialMessages: true,
        settingSources: [],
      }

      if (body.sessionId) {
        options.resume = body.sessionId
      }

      let sessionId = body.sessionId || ''

      const queryStream = sdk.query({ prompt: body.message, options })

      for await (const msg of queryStream) {
        // セッションID取得
        if (msg.session_id && !sessionId) {
          sessionId = msg.session_id
          await stream.writeSSE({ event: 'session', data: JSON.stringify({ sessionId }) })
        }

        // system/init
        if (msg.type === 'system' && msg.subtype === 'init') {
          if (msg.session_id) sessionId = msg.session_id
          await stream.writeSSE({ event: 'session', data: JSON.stringify({ sessionId }) })
        }

        // ストリーミングテキスト
        if (msg.type === 'stream_event' && msg.event) {
          const evt = msg.event
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta' && evt.delta.text) {
            await stream.writeSSE({ event: 'text', data: evt.delta.text })
          }
          // ツール使用開始
          if (evt.type === 'content_block_start' && evt.content_block?.type === 'tool_use') {
            await stream.writeSSE({
              event: 'tool',
              data: JSON.stringify({ name: evt.content_block.name, status: 'start' }),
            })
          }
        }

        // assistant（ツール使用検知 + 危険コマンド事後報告）
        if (msg.type === 'assistant' && msg.message?.content) {
          for (const block of msg.message.content) {
            if (block.type === 'tool_use' && block.name === 'Bash' && block.input) {
              const cmd = (block.input as Record<string, string>).command || ''
              const danger = detectDanger(cmd)
              if (danger) {
                log.warn(`Dangerous command executed: ${danger.label} — ${danger.command}`)
                await stream.writeSSE({
                  event: 'warning',
                  data: JSON.stringify(danger),
                })
              }
            }
          }
        }

        // 最終結果
        if (msg.type === 'result') {
          if (msg.session_id) sessionId = msg.session_id
          await stream.writeSSE({
            event: 'result',
            data: JSON.stringify({
              text: msg.result || '',
              sessionId,
              cost: msg.total_cost_usd,
              turns: msg.num_turns,
              durationMs: msg.duration_ms,
              isError: msg.is_error,
            }),
          })
        }
      }

      // セッション保存
      if (sessionId) {
        sessions.set(sessionId.slice(0, 12), {
          sessionId,
          project: cwd,
          lastUsed: Date.now(),
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      log.error(`Chat error: ${message}`)
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({ message }),
      })
    }
  })
})

// GET /api/sessions — セッション一覧
chatRoutes.get('/sessions', (c) => {
  const list = Array.from(sessions.entries()).map(([key, val]) => ({
    id: key,
    sessionId: val.sessionId,
    project: val.project,
    lastUsed: val.lastUsed,
  }))
  return c.json(list)
})
