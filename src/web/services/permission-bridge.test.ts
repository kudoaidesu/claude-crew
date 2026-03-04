import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createPendingRequest,
  resolveRequest,
  rejectRequest,
  cleanupStreamRequests,
  getRequest,
  clearAll,
  type PermissionResult,
} from './permission-bridge.js'

describe('permission-bridge', () => {
  beforeEach(() => {
    clearAll()
    vi.useFakeTimers()
  })

  afterEach(() => {
    clearAll()
    vi.useRealTimers()
  })

  // ── createPendingRequest ────────────────────────────

  describe('createPendingRequest()', () => {
    it('requestId と promise を返す', () => {
      const { requestId, promise } = createPendingRequest('stream-1', 'Bash', { command: 'ls' })
      expect(requestId).toMatch(/^req-/)
      expect(promise).toBeInstanceOf(Promise)
    })

    it('作成後 getRequest で取得できる', () => {
      const { requestId } = createPendingRequest('stream-1', 'Read', { file_path: '/tmp/a.ts' })
      const pending = getRequest(requestId)
      expect(pending).toBeDefined()
      expect(pending!.toolName).toBe('Read')
      expect(pending!.streamId).toBe('stream-1')
    })
  })

  // ── resolveRequest ──────────────────────────────────

  describe('resolveRequest()', () => {
    it('allow で resolve すると promise が fulfill される', async () => {
      const { requestId, promise } = createPendingRequest('stream-1', 'Bash', { command: 'ls' })
      const result: PermissionResult = { behavior: 'allow' }
      const resolved = resolveRequest(requestId, result)
      expect(resolved).toBe(true)

      const value = await promise
      expect(value).toEqual({ behavior: 'allow' })
    })

    it('deny で resolve すると promise が deny 結果を返す', async () => {
      const { requestId, promise } = createPendingRequest('stream-1', 'Bash', { command: 'rm -rf /' })
      const result: PermissionResult = { behavior: 'deny', message: 'Too dangerous' }
      resolveRequest(requestId, result)

      const value = await promise
      expect(value.behavior).toBe('deny')
      expect(value.message).toBe('Too dangerous')
    })

    it('updatedInput を含めて resolve できる', async () => {
      const { requestId, promise } = createPendingRequest('stream-1', 'AskUserQuestion', { questions: [] })
      const result: PermissionResult = {
        behavior: 'allow',
        updatedInput: { questions: [], answers: { 'Q1': 'A1' } },
      }
      resolveRequest(requestId, result)

      const value = await promise
      expect(value.updatedInput).toEqual({ questions: [], answers: { 'Q1': 'A1' } })
    })

    it('resolve 後は getRequest で取得できない', () => {
      const { requestId } = createPendingRequest('stream-1', 'Bash', { command: 'ls' })
      resolveRequest(requestId, { behavior: 'allow' })
      expect(getRequest(requestId)).toBeUndefined()
    })

    it('存在しない requestId → false を返す', () => {
      const result = resolveRequest('nonexistent', { behavior: 'allow' })
      expect(result).toBe(false)
    })
  })

  // ── rejectRequest ───────────────────────────────────

  describe('rejectRequest()', () => {
    it('deny で resolve する（resolveRequest のラッパー）', async () => {
      const { requestId, promise } = createPendingRequest('stream-1', 'Bash', { command: 'ls' })
      const result = rejectRequest(requestId, 'User denied')
      expect(result).toBe(true)

      const value = await promise
      expect(value.behavior).toBe('deny')
      expect(value.message).toBe('User denied')
    })
  })

  // ── cleanupStreamRequests ───────────────────────────

  describe('cleanupStreamRequests()', () => {
    it('指定ストリームの全リクエストを deny で解決する', async () => {
      const r1 = createPendingRequest('stream-A', 'Bash', { command: 'ls' })
      const r2 = createPendingRequest('stream-A', 'Edit', { file_path: '/a.ts' })
      const r3 = createPendingRequest('stream-B', 'Read', { file_path: '/b.ts' })

      cleanupStreamRequests('stream-A')

      const v1 = await r1.promise
      const v2 = await r2.promise
      expect(v1.behavior).toBe('deny')
      expect(v2.behavior).toBe('deny')

      // stream-B は影響なし
      expect(getRequest(r3.requestId)).toBeDefined()
    })
  })

  // ── タイムアウト ────────────────────────────────────

  describe('timeout', () => {
    it('5分後に自動 deny される', async () => {
      const { requestId, promise } = createPendingRequest('stream-1', 'Bash', { command: 'ls' })

      // 5分経過
      vi.advanceTimersByTime(5 * 60 * 1000)

      const value = await promise
      expect(value.behavior).toBe('deny')
      expect(value.message).toContain('timeout')
      expect(getRequest(requestId)).toBeUndefined()
    })

    it('resolve 前にタイムアウトしても二重 resolve しない', async () => {
      const { requestId, promise } = createPendingRequest('stream-1', 'Bash', { command: 'ls' })

      // 先に resolve
      resolveRequest(requestId, { behavior: 'allow' })
      const value = await promise
      expect(value.behavior).toBe('allow')

      // タイムアウト発火しても問題ない
      vi.advanceTimersByTime(5 * 60 * 1000)
      // エラーが出なければ OK
    })
  })

  // ── AbortSignal ─────────────────────────────────────

  describe('AbortSignal', () => {
    it('signal の abort で自動 deny される', async () => {
      const controller = new AbortController()
      const { promise } = createPendingRequest('stream-1', 'Bash', { command: 'ls' }, controller.signal)

      controller.abort()

      const value = await promise
      expect(value.behavior).toBe('deny')
      expect(value.message).toBe('Aborted')
    })
  })

  // ── clearAll ────────────────────────────────────────

  describe('clearAll()', () => {
    it('全リクエストをクリアする', () => {
      createPendingRequest('stream-1', 'Bash', { command: 'ls' })
      createPendingRequest('stream-2', 'Edit', { file_path: '/a.ts' })
      clearAll()
      // 新しく作成しても問題ないことを確認
      const { requestId } = createPendingRequest('stream-3', 'Read', { file_path: '/b.ts' })
      expect(getRequest(requestId)).toBeDefined()
    })
  })
})
