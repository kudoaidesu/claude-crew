# E2E テストデータ Seeding

E2Eテスト用のテストデータを準備するためのガイド。

## 発動条件
- 「テストデータを作成」「seedスクリプト」
- 「テストが落ちる」（データ不足が原因の場合）
- 「団体未定のイベントがない」などデータ依存エラー

---

## 基本原則

### 1. IDの衝突を避ける

```typescript
// テスト用IDは既存データと衝突しない範囲
const TEST_EVENT_IDS = {
  TEST_EVENT_1: 3001,  // 3000番台を使用
  TEST_EVENT_2: 3002,
}
```

### 2. べき等性を確保

```typescript
// upsertで既存データを上書き
const { error } = await supabase
  .from('events_v2')
  .upsert({
    id: TEST_EVENT_IDS.TEST_EVENT_1,
    title: 'テストイベント',
    ...
  }, { onConflict: 'id' })
```

### 3. 関連テーブルも忘れずに

```typescript
// 1. 親テーブル（events_v2）を作成
await supabase.from('events_v2').upsert({ ... })

// 2. 既存の関連データを削除
await supabase.from('event_groups')
  .delete()
  .in('event_id', eventIds)

// 3. 新しい関連データを作成
await supabase.from('event_groups').insert([
  { event_id: 3001, group_id: 1 },
  { event_id: 3002, group_id: 2 },
])
```

---

## スクリプトテンプレート

```typescript
// scripts/seed-test-data.ts
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TEST_IDS = {
  EVENT_1: 3001,
  EVENT_2: 3002,
}

async function seed() {
  console.log('テストデータを追加中...')

  // Step 1: イベント作成
  const events = [
    { id: TEST_IDS.EVENT_1, title: 'テスト1', date: '2025-01-29' },
    { id: TEST_IDS.EVENT_2, title: 'テスト2', date: '2025-01-30' },
  ]

  for (const event of events) {
    const { error } = await supabase
      .from('events_v2')
      .upsert(event, { onConflict: 'id' })

    if (error) {
      console.error(`✗ ${event.title}:`, error.message)
    } else {
      console.log(`✓ ${event.title}`)
    }
  }

  // Step 2: 関連データ
  // ...

  console.log('完了!')
}

seed().catch(console.error)
```

**実行方法:**
```bash
npx tsx scripts/seed-test-data.ts
```

---

## Junction Table のパターン

### 多対多リレーション (event_groups)

```typescript
// 既存の関連を削除してから追加
await supabase
  .from('event_groups')
  .delete()
  .in('event_id', Object.values(TEST_IDS))

// 新しい関連を追加
const links = [
  { event_id: TEST_IDS.EVENT_1, group_id: 1, performance_order: 1 },
  { event_id: TEST_IDS.EVENT_1, group_id: 2, performance_order: 2 },
]

for (const link of links) {
  const { error } = await supabase
    .from('event_groups')
    .insert(link)

  if (error && !error.message.includes('duplicate')) {
    console.error(`✗ 紐付け失敗:`, error.message)
  }
}
```

### 団体未定イベントの作成

```typescript
// event_groups に何も追加しない = 団体未定
const undecidedEvent = {
  id: TEST_IDS.UNDECIDED_EVENT,
  title: '団体未定テストイベント',
  date: '2025-01-29',
}

await supabase.from('events_v2').upsert(undecidedEvent)
// event_groups への追加をスキップ
```

---

## seed後の確認

### 1. DBで確認

```sql
SELECT e.id, e.title, e.date,
  (SELECT COUNT(*) FROM event_groups eg WHERE eg.event_id = e.id) as group_count
FROM events_v2 e
WHERE e.id IN (3001, 3002, 3003)
```

### 2. キャッシュクリア

```bash
rm -rf .next
npm run dev
```

### 3. UIで確認

```bash
# ブラウザまたはPlaywrightで確認
open http://localhost:3000/date/2025-01-29
```

---

## トラブルシューティング

### データを追加したがUIに反映されない

→ [nextjs-cache-debugging](nextjs-cache-debugging.md) を参照

### 関連データが作成されない

```typescript
// group_idがundefinedの場合、filterで除外される
const links = eventGroupLinks.filter(link => link.group_id !== undefined)

// 存在しないgroup_idを使おうとしていないか確認
const { data: groups } = await supabase
  .from('groups')
  .select('id, name, type')
console.log('利用可能な団体:', groups)
```

### 外部キー制約エラー

```
violates foreign key constraint "event_groups_group_id_fkey"
```

→ 参照先のデータ（groups）が存在するか確認

---

## 関連スキル
- [e2e-test-principles](e2e-test-principles.md) - E2Eテスト原則
- [nextjs-cache-debugging](nextjs-cache-debugging.md) - キャッシュ問題
