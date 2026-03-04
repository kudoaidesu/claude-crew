/**
 * Permission Bridge — canUseTool コールバックと Web UI をつなぐ Deferred Promise パターン
 *
 * SDK の canUseTool は同期的に Promise を返す必要がある。
 * この Bridge が Promise を作成・保持し、UI からの応答で resolve する。
 *
 * ライフサイクル:
 *   canUseTool 発火 → createPendingRequest() → SSE で UI に送信
 *     → ユーザー応答 → POST /api/chat/respond → resolveRequest()
 *     → canUseTool の Promise が resolve → SDK 続行
 */
import { createLogger } from '../../utils/logger.js'

const log = createLogger('web:permission-bridge')

// ── 型定義 ──────────────────────────────────────────

export interface PermissionResult {
  behavior: 'allow' | 'deny'
  updatedInput?: Record<string, unknown>
  message?: string
}

export interface PendingRequest {
  requestId: string
  streamId: string
  toolName: string
  input: Record<string, unknown>
  createdAt: number
  resolve: (result: PermissionResult) => void
  reject: (error: Error) => void
}

// ── 定数 ──────────────────────────────────────────

const REQUEST_TIMEOUT_MS = 5 * 60 * 1000 // 5 分

// ── ストア ──────────────────────────────────────────

const pendingRequests = new Map<string, PendingRequest>()
const timeoutTimers = new Map<string, ReturnType<typeof setTimeout>>()

// ── 公開API ──────────────────────────────────────────

/**
 * Deferred Promise を作成し、保留リクエストとして登録する。
 * canUseTool コールバック内から呼ばれる。
 */
export function createPendingRequest(
  streamId: string,
  toolName: string,
  input: Record<string, unknown>,
  signal?: AbortSignal,
): { requestId: string; promise: Promise<PermissionResult> } {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  let resolve!: (result: PermissionResult) => void
  let reject!: (error: Error) => void
  const promise = new Promise<PermissionResult>((res, rej) => {
    resolve = res
    reject = rej
  })

  const pending: PendingRequest = {
    requestId,
    streamId,
    toolName,
    input,
    createdAt: Date.now(),
    resolve,
    reject,
  }

  pendingRequests.set(requestId, pending)

  // タイムアウト自動 deny
  const timer = setTimeout(() => {
    if (pendingRequests.has(requestId)) {
      log.warn(`Request ${requestId} timed out (${toolName})`)
      resolveRequest(requestId, { behavior: 'deny', message: 'Response timeout (5 min)' })
    }
  }, REQUEST_TIMEOUT_MS)
  timeoutTimers.set(requestId, timer)

  // AbortSignal による自動 deny
  if (signal) {
    const onAbort = () => {
      if (pendingRequests.has(requestId)) {
        log.info(`Request ${requestId} aborted via signal (${toolName})`)
        resolveRequest(requestId, { behavior: 'deny', message: 'Aborted' })
      }
    }
    signal.addEventListener('abort', onAbort, { once: true })
  }

  log.info(`Created pending request ${requestId} for ${toolName} (stream: ${streamId})`)
  return { requestId, promise }
}

/**
 * 保留リクエストを resolve する。UI の応答を受けて呼ばれる。
 */
export function resolveRequest(requestId: string, result: PermissionResult): boolean {
  const pending = pendingRequests.get(requestId)
  if (!pending) return false

  cleanup(requestId)
  pending.resolve(result)
  log.info(`Resolved request ${requestId} (${pending.toolName}): ${result.behavior}`)
  return true
}

/**
 * 保留リクエストを deny で resolve する。
 */
export function rejectRequest(requestId: string, message: string): boolean {
  return resolveRequest(requestId, { behavior: 'deny', message })
}

/**
 * 指定ストリームの全保留リクエストを deny で解決する。
 * ストリーム終了時に呼ばれる。
 */
export function cleanupStreamRequests(streamId: string): void {
  for (const [requestId, pending] of pendingRequests) {
    if (pending.streamId === streamId) {
      log.info(`Cleaning up request ${requestId} for ended stream ${streamId}`)
      resolveRequest(requestId, { behavior: 'deny', message: 'Stream ended' })
    }
  }
}

/**
 * 保留リクエストを取得する（バリデーション用）。
 */
export function getRequest(requestId: string): PendingRequest | undefined {
  return pendingRequests.get(requestId)
}

/**
 * テスト用: 全保留リクエストをクリアする。
 */
export function clearAll(): void {
  for (const [requestId] of pendingRequests) {
    cleanup(requestId)
  }
  pendingRequests.clear()
}

// ── 内部 ──────────────────────────────────────────

function cleanup(requestId: string): void {
  pendingRequests.delete(requestId)
  const timer = timeoutTimers.get(requestId)
  if (timer) {
    clearTimeout(timer)
    timeoutTimers.delete(requestId)
  }
}
