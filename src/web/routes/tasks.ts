/**
 * タスク API ルート
 *
 * worker_tasks / task_events テーブルを対象に CRUD + SSE を提供する。
 * SSE ストリームはタスクステータス変化を即座にクライアントへ配信する。
 */
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { getDb } from '../../db/index.js'
import { createLogger } from '../../utils/logger.js'

const log = createLogger('web:tasks')

// ── 型定義 ──────────────────────────────────────────────────────────────────

export interface WorkerTaskRow {
  id: number
  worker_id: string
  worker_name: string
  project_slug: string
  title: string
  description: string | null
  status: string
  priority: string
  execution_mode: string
  retry_count: number
  checkpoint: string | null
  last_error: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export interface TaskEventRow {
  id: number
  task_id: number
  event_type: string
  payload: string | null
  created_at: string
}

// ── SSE クライアント管理 ─────────────────────────────────────────────────────

type SseCallback = (data: string) => void
const sseClients = new Map<string, SseCallback>()

export function broadcastTaskUpdate(taskId: number, status: string): void {
  const payload = JSON.stringify({ taskId, status, timestamp: new Date().toISOString() })
  for (const [, send] of sseClients) {
    try {
      send(payload)
    } catch {
      // クライアント切断は unregister で後始末
    }
  }
}

// ── ルート ──────────────────────────────────────────────────────────────────

export const tasksRoutes = new Hono()

// GET /api/tasks — タスク一覧（ステータス・ワーカーフィルター対応）
tasksRoutes.get('/', (c) => {
  const db = getDb()
  const status = c.req.query('status') || ''
  const workerId = c.req.query('worker_id') || ''
  const limit = Math.min(Number(c.req.query('limit') || '100'), 500)

  let sql = `
    SELECT
      wt.id, wt.worker_id, w.display_name AS worker_name, w.project_slug,
      wt.title, wt.description, wt.status, wt.priority, wt.execution_mode,
      wt.retry_count, wt.checkpoint, wt.last_error,
      wt.created_at, wt.started_at, wt.completed_at,
      te.event_type AS latest_event_type,
      te.payload AS latest_event_payload,
      te.created_at AS latest_event_at
    FROM worker_tasks wt
    JOIN workers w ON w.id = wt.worker_id
    LEFT JOIN task_events te ON te.id = (
      SELECT id FROM task_events WHERE task_id = wt.id ORDER BY id DESC LIMIT 1
    )
    WHERE 1=1
  `
  const params: (string | number)[] = []

  if (status) {
    sql += ' AND wt.status = ?'
    params.push(status)
  }
  if (workerId) {
    sql += ' AND wt.worker_id = ?'
    params.push(workerId)
  }

  sql += ' ORDER BY wt.id DESC LIMIT ?'
  params.push(limit)

  try {
    const rows = db.prepare(sql).all(...params) as Array<Record<string, unknown>>

    // サマリー集計
    const summary = db.prepare(`
      SELECT status, COUNT(*) as count FROM worker_tasks GROUP BY status
    `).all() as Array<{ status: string; count: number }>

    const counts: Record<string, number> = {}
    for (const row of summary) {
      counts[row.status] = row.count
    }

    return c.json({ items: rows, summary: counts })
  } catch (e) {
    log.error(`Failed to fetch tasks: ${e}`)
    return c.json({ error: String(e) }, 500)
  }
})

// GET /api/tasks/stream — SSE リアルタイム更新
tasksRoutes.get('/stream', (c) => {
  const clientId = `task-sse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return streamSSE(c, async (stream) => {
    // クライアント登録
    sseClients.set(clientId, (data: string) => {
      stream.writeSSE({ event: 'task_update', data }).catch(() => {
        // 切断時は無視（finally で unregister される）
      })
    })

    log.info(`Task SSE stream started: ${clientId}`)

    // 接続直後に現在のサマリーを送信
    try {
      const db = getDb()
      const summary = db.prepare(`
        SELECT status, COUNT(*) as count FROM worker_tasks GROUP BY status
      `).all() as Array<{ status: string; count: number }>
      const counts: Record<string, number> = {}
      for (const row of summary) counts[row.status] = row.count
      await stream.writeSSE({ event: 'summary', data: JSON.stringify(counts) })
    } catch { /* DB未初期化時は無視 */ }

    // keep-alive 30秒ごと
    const keepAliveInterval = setInterval(() => {
      stream.writeSSE({ event: 'heartbeat', data: '' }).catch(() => {
        clearInterval(keepAliveInterval)
      })
    }, 30_000)

    try {
      await stream.sleep(24 * 60 * 60 * 1000)
    } catch {
      // クライアント切断
    } finally {
      clearInterval(keepAliveInterval)
      sseClients.delete(clientId)
      log.info(`Task SSE stream ended: ${clientId}`)
    }
  })
})

// GET /api/tasks/:id — タスク詳細（task_events 含む）
tasksRoutes.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) {
    return c.json({ error: 'Invalid task ID' }, 400)
  }

  const db = getDb()

  try {
    const task = db.prepare(`
      SELECT
        wt.id, wt.worker_id, w.display_name AS worker_name, w.project_slug,
        wt.title, wt.description, wt.status, wt.priority, wt.execution_mode,
        wt.retry_count, wt.checkpoint, wt.last_error,
        wt.created_at, wt.started_at, wt.completed_at
      FROM worker_tasks wt
      JOIN workers w ON w.id = wt.worker_id
      WHERE wt.id = ?
    `).get(id) as WorkerTaskRow | undefined

    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }

    const events = db.prepare(`
      SELECT id, task_id, event_type, payload, created_at
      FROM task_events
      WHERE task_id = ?
      ORDER BY id ASC
    `).all(id) as TaskEventRow[]

    return c.json({ task, events })
  } catch (e) {
    log.error(`Failed to fetch task ${id}: ${e}`)
    return c.json({ error: String(e) }, 500)
  }
})

// POST /api/tasks — タスク新規作成（窓口からの投入用）
tasksRoutes.post('/', async (c) => {
  interface CreateTaskBody {
    worker_id: string
    title: string
    description?: string
    priority?: string
    execution_mode?: string
  }

  const body = await c.req.json<CreateTaskBody>()
  const { worker_id, title, description, priority, execution_mode } = body

  if (!worker_id || !title) {
    return c.json({ error: 'worker_id and title are required' }, 400)
  }

  const db = getDb()

  try {
    // ワーカー存在確認
    const worker = db.prepare('SELECT id FROM workers WHERE id = ?').get(worker_id)
    if (!worker) {
      return c.json({ error: 'Worker not found' }, 404)
    }

    const now = new Date().toISOString()
    const result = db.prepare(`
      INSERT INTO worker_tasks (worker_id, title, description, status, priority, execution_mode, retry_count, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?, 0, ?, ?)
    `).run(
      worker_id,
      title,
      description ?? null,
      priority ?? 'medium',
      execution_mode ?? 'safe',
      now,
      now,
    )

    const newId = result.lastInsertRowid as number

    // 作成イベントを記録
    db.prepare(`
      INSERT INTO task_events (task_id, event_type, payload, created_at)
      VALUES (?, 'created', ?, ?)
    `).run(newId, JSON.stringify({ title, priority: priority ?? 'medium' }), now)

    // SSE ブロードキャスト
    broadcastTaskUpdate(newId, 'pending')

    const task = db.prepare(`
      SELECT wt.*, w.display_name AS worker_name, w.project_slug
      FROM worker_tasks wt JOIN workers w ON w.id = wt.worker_id
      WHERE wt.id = ?
    `).get(newId)

    return c.json(task, 201)
  } catch (e) {
    log.error(`Failed to create task: ${e}`)
    return c.json({ error: String(e) }, 500)
  }
})
