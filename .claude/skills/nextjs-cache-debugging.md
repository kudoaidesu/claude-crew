# Next.js キャッシュデバッグ

Next.js App Routerのキャッシュ問題を診断・解決するためのガイド。

## 発動条件
- 「データが反映されない」「古いデータが表示される」
- 「キャッシュをクリア」「cache invalidation」
- 「unstable_cache」「revalidate」
- データをseedしたがUIに表示されない

---

## キャッシュの種類

### 1. `unstable_cache` (Data Cache)

```typescript
export const getData = unstable_cache(
  async (id: string) => { ... },
  ['cache-key'],
  { revalidate: 3600, tags: ['data'] }
)
```

**特徴:**
- 関数の戻り値をキャッシュ
- 引数は自動でキーに含まれる
- `revalidate` 秒数でTTL設定
- `tags` で `revalidateTag()` から無効化可能

**問題パターン:**
- データ追加後、古いキャッシュが返される
- 開発中にキャッシュが残り続ける

### 2. `.next` フォルダキャッシュ

**含まれるもの:**
- `.next/cache/` - ビルドキャッシュ、データキャッシュ
- `.next/server/` - サーバーコンポーネントキャッシュ

**問題パターン:**
- サーバー再起動してもキャッシュが残る
- `force-dynamic` 設定しても効かない

### 3. ブラウザキャッシュ

**含まれるもの:**
- Service Worker
- HTTP Cache (Cache-Control)

---

## デバッグ手順

### Step 1: キャッシュの影響を切り分ける

```bash
# APIで直接データを確認（キャッシュをバイパス）
curl "http://localhost:3000/api/events?date=2025-01-29"

# DBで直接確認
# Supabase MCPまたはpsqlで確認
```

**結果判定:**
- API正常・UI異常 → サーバーサイドキャッシュ問題
- API異常 → データまたはAPI実装問題

### Step 2: サーバーサイドキャッシュをクリア

```bash
# 開発サーバー停止
pkill -9 -f "next"

# キャッシュ削除
rm -rf .next

# 再起動
npm run dev
```

### Step 3: それでも解決しない場合

1. **`unstable_cache` のキー確認**
   - 引数が正しくキーに含まれているか
   - 同じキーで異なるデータを返していないか

2. **`revalidate` 設定確認**
   ```typescript
   // ページレベル
   export const revalidate = 0  // キャッシュ無効
   export const dynamic = 'force-dynamic'

   // 関数レベル
   { revalidate: 0 }  // キャッシュ無効
   ```

3. **タグベースの無効化**
   ```typescript
   import { revalidateTag } from 'next/cache'
   revalidateTag('events')
   ```

---

## よくある問題と解決策

### データseed後にUIに反映されない

```bash
# 1. .nextを削除
rm -rf .next

# 2. サーバー再起動
npm run dev
```

### 本番環境でキャッシュが効きすぎる

```typescript
// APIルートでキャッシュ無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

### 特定データだけ更新したい

```typescript
// タグで無効化
import { revalidateTag } from 'next/cache'

export async function updateEvent(id: string) {
  // データ更新処理
  await db.update(...)

  // キャッシュ無効化
  revalidateTag('events')
}
```

---

## 開発時のベストプラクティス

1. **テストデータ追加時は必ず `.next` を削除**
2. **`unstable_cache` は開発中は短いTTLに設定**
3. **問題発生時はまずAPIを直接叩いて切り分け**
4. **本番では適切な `revalidate` 値を設定**

---

## 関連スキル
- [e2e-data-seeding](e2e-data-seeding.md) - テストデータ準備
- [e2e-test-principles](e2e-test-principles.md) - E2Eテスト原則
