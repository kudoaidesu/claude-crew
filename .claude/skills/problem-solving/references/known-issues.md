# 既知問題データベース

このドキュメントは、プロジェクトで遭遇した既知の問題とその解決策を記録します。

**更新日**: 2025-12-13
**最終レビュー**: 2025-12-13

## 📋 使い方

1. 問題に遭遇したら、まずこのドキュメントを検索
2. 該当する症状があれば、記載された解決策を適用
3. 新しい問題を発見したら、このドキュメントに追記
4. **月1回**: 古い情報を削除、新しいGitHub Issuesをチェック

---

## Next.js関連

### 1. router.refresh()が本番環境で動作しない

**症状**:
- 開発環境では正常に動作するが、本番環境でServer Componentが再レンダリングされない
- ログイン・ログアウト後にUIが更新されない
- キャッシュが無効化されない

**原因**:
- Next.js App RouterのRouter Cache問題
- `router.refresh()`がServer Componentsのデータを再取得しない

**GitHub Issue**: [#52964](https://github.com/vercel/next.js/issues/52964)

**解決策**:
```typescript
// ❌ 動作しない
router.refresh()

// ✅ 解決策
window.location.href = '/'  // 完全リロード
```

**影響範囲**: Next.js 13.x - 15.x App Router

**ステータス**: 🔴 未解決（2025-12-13時点）

---

### 2. revalidatePath() + redirect()の競合

**症状**:
- `revalidatePath()`を実行した後に`redirect()`を実行すると、キャッシュ無効化が反映されない
- Server Actionでの認証処理が不安定

**原因**:
- `redirect()`が`revalidatePath()`の効果を打ち消す
- 内部的な実行順序の問題

**GitHub Discussion**: [#49345](https://github.com/vercel/next.js/discussions/49345)

**解決策**:
```typescript
// ❌ 動作しない
export async function signOut() {
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')  // revalidatePathの効果が失われる
}

// ✅ 解決策：クライアント側でリダイレクト
export async function signOut() {
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  // redirectは使わない
}

// クライアント側
await signOut()
window.location.href = '/'
```

**影響範囲**: Next.js 13.x - 15.x App Router

**ステータス**: 🔴 未解決（2025-12-13時点）

---

### 3. Dynamic Renderingでの環境変数アクセス

**症状**:
- `process.env`が`undefined`になる
- Server Componentsで環境変数が読み込めない

**原因**:
- Dynamic Renderingモード（`export const dynamic = 'force-dynamic'`）で環境変数が展開されない

**解決策**:
```typescript
// ❌ 動作しない可能性
const apiKey = process.env.NEXT_PUBLIC_API_KEY

// ✅ 解決策
const apiKey = process.env.NEXT_PUBLIC_API_KEY || ''
```

**影響範囲**: Next.js 13.x以降

**ステータス**: 🟡 部分的に解決（Next.js 15で改善）

---

## Supabase関連

### 1. Supabaseクライアント初期化のタイムアウト

**症状**:
- `createClient()`がハングアップする
- 認証処理が2秒以上かかる

**原因**:
- ネットワーク遅延
- Supabaseインスタンスの応答遅延

**解決策**:
```typescript
// タイムアウト処理を追加
const supabasePromise = createClient()
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Supabase timeout')), 2000)
)

const supabase = await Promise.race([
  supabasePromise,
  timeoutPromise
]) as SupabaseClient
```

**影響範囲**: @supabase/ssr 全バージョン

**ステータス**: 🟢 回避策あり

---

### 2. onAuthStateChangeの多重発火

**症状**:
- `onAuthStateChange`が複数回呼ばれる
- 認証状態の変更が重複して処理される

**原因**:
- Strict Modeでの二重レンダリング
- クリーンアップ関数の未実装

**解決策**:
```typescript
// ✅ クリーンアップ関数を必ず実装
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      // 処理
    }
  )

  return () => {
    subscription.unsubscribe()  // 必須
  }
}, [])
```

**影響範囲**: @supabase/supabase-js 全バージョン

**ステータス**: 🟢 解決済み（実装パターンで回避）

---

### 3. Server Action後のクライアント側signOut()ハング

**症状**:
- ログアウト処理がローディング状態で停止する
- E2Eテストでログアウトがタイムアウトする
- 手動操作では問題なく動作することがある

**原因**:
- Server Action内で`supabase.auth.signOut()`を実行後、クライアント側でも`signOut()`を呼ぶと、
  既にセッションが削除されているためクライアント側の`signOut()`がハングする可能性がある
- 特にE2Eテスト環境（ヘッドレスブラウザ）で顕著に発生

**再現条件**:
```typescript
// Server Action
export const signOut = async () => {
  const supabase = await createClient()
  await supabase.auth.signOut()  // ← セッション削除
  revalidatePath('/', 'layout')
}

// Client側
await signOut()  // Server Action実行
await supabase.auth.signOut()  // ← ここでハング（セッションが既にない）
```

**解決策**:
```typescript
// ✅ タイムアウト付きでクライアント側signOutを実行
const CLIENT_SIGNOUT_TIMEOUT_MS = 3000
await Promise.race([
  supabase.auth.signOut(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Client signOut timeout')), CLIENT_SIGNOUT_TIMEOUT_MS)
  )
]).catch(() => {
  // タイムアウトしてもリダイレクトは続行（Server Actionで既にログアウト済み）
})

window.location.href = '/'
```

**影響範囲**: @supabase/supabase-js + Server Action

**ステータス**: 🟢 解決済み（タイムアウトで回避）

**教訓**:
- Server ActionとClient側で同じ認証処理を重複実行する場合は、後続の処理がハングする可能性を考慮
- 外部サービス呼び出しには常にタイムアウトを設定することを検討
- E2Eテスト環境と手動操作で挙動が異なる場合はタイミング依存の問題を疑う

---

## React関連

### 1. useEffectの二重実行（Strict Mode）

**症状**:
- 開発環境で`useEffect`が2回実行される
- APIリクエストが重複する

**原因**:
- React 18のStrict Mode仕様
- 開発環境のみの挙動

**解決策**:
```typescript
// ✅ クリーンアップ関数で対応
useEffect(() => {
  let cancelled = false

  async function fetchData() {
    const data = await fetch('/api/data')
    if (!cancelled) {
      setData(data)
    }
  }

  fetchData()

  return () => {
    cancelled = true
  }
}, [])
```

**影響範囲**: React 18以降

**ステータス**: 🟢 仕様（回避策あり）

---

## TypeScript関連

### 1. Supabase型定義の遅延

**症状**:
- `npx supabase gen types`が遅い
- 型定義が最新ではない

**原因**:
- Supabase CLIのバージョン
- ネットワーク遅延

**解決策**:
```bash
# タイムアウトを延長
npx supabase gen types typescript --project-id <id> --schema public > types/supabase.ts --timeout 30000
```

**影響範囲**: Supabase CLI 全バージョン

**ステータス**: 🟢 回避策あり

---

## Playwright E2Eテスト関連

### 1. Supabase認証セッションの競合

**症状**:
- 並列実行時にログインが失敗する
- セッションが上書きされる

**原因**:
- Cookieベースのセッション管理
- 並列実行での競合

**解決策**:
```typescript
// test.describe.configure({ mode: 'serial' }) を必ず追加
test.describe('管理画面テスト', () => {
  test.describe.configure({ mode: 'serial' })

  test('ログイン', async ({ page }) => {
    // ...
  })
})
```

**影響範囲**: Playwright + Supabase Auth

**ステータス**: 🟢 解決済み

---

### 2. waitForTimeoutの必要性（Supabase認証後）

**症状**:
- ログイン直後のページ遷移でタイムアウト
- Server Componentの初期化が間に合わない

**原因**:
- Supabaseセッション確立に時間がかかる
- `getUserPermissions`のタイムアウト（2秒）

**解決策**:
```typescript
// ログイン後は必ず待機
await page.fill('input[name="email"]', 'test@example.com')
await page.fill('input[name="password"]', 'password')
await page.click('button[type="submit"]')

// ✅ セッション確立を待つ
await page.waitForTimeout(2000)

// その後ページ遷移
await page.goto('/admin')
```

**影響範囲**: Playwright + Supabase Auth

**ステータス**: 🟡 一時的な回避策（将来的にstorageState認証で改善予定）

---

## Radix UI関連

### 1. Sheet + AlertDialogのaria-hidden競合

**症状**:
- SheetとAlertDialogを同時に操作するとフォーカスがブロックされる
- ボタンがローディング中の状態で止まり、何も起きなくなる
- コンソールに警告: `Blocked aria-hidden on an element because its descendant retained focus`

**原因**:
- SheetとAlertDialogが両方開いている状態で、一方を閉じると`aria-hidden`属性の競合が発生
- フォーカス管理が破綻し、後続のイベントハンドラが実行されない

**再現条件**:
- Sheet内のボタンでAlertDialogを開こうとする
- SheetとAlertDialogの状態が同時に変更される

**解決策**:
```typescript
// ❌ 問題のあるコード
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <Button onClick={() => {
    setIsOpen(false)
    setShowDialog(true)  // 競合発生
  }}>
    ダイアログを開く
  </Button>
</Sheet>

// ❌ onOpenChangeでの解決を試みるも動作しない
// 理由: onOpenChangeはプログラム的なsetIsOpen(false)では発火しない
// （ユーザー操作: ESC、オーバーレイクリック、Closeボタンでのみ発火）
<Sheet open={isOpen} onOpenChange={(open) => {
  setIsOpen(open)
  if (!open && pendingDialog) {  // ← この条件に到達しない
    setShowDialog(true)
  }
}}>

// ✅ useEffectで状態変化を監視（正しい解決策）
const [pendingDialog, setPendingDialog] = useState(false)

useEffect(() => {
  if (!isOpen && pendingDialog) {
    // アニメーション時間はsheet.tsxのdata-[state=closed]:duration-300と一致
    const SHEET_CLOSE_ANIMATION_MS = 300
    const timer = setTimeout(() => {
      setPendingDialog(false)
      setShowDialog(true)
    }, SHEET_CLOSE_ANIMATION_MS)
    return () => clearTimeout(timer)
  }
}, [isOpen, pendingDialog])

<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <Button onClick={() => {
    setPendingDialog(true)  // フラグを立てる
    setIsOpen(false)         // Sheetを閉じる → useEffectが発火
  }}>
    ダイアログを開く
  </Button>
</Sheet>
```

**技術的制約（Radix UI）**:
- `onOpenChange`はユーザー操作（ESC、オーバーレイクリック等）でのみ発火
- プログラム的な`setIsOpen(false)`では発火しない
- アニメーション完了コールバックは提供されていない
- そのため、CSSアニメーション時間と同じsetTimeoutが必要

**影響範囲**: Radix UI Sheet + Dialog/AlertDialog

**ステータス**: 🟢 解決済み（useEffect + setTimeout で回避）

**教訓**:
- Radix UIの複数モーダルコンポーネントは状態変更のタイミングに注意
- `onOpenChange`の発火条件を正確に理解する（プログラム的変更では発火しない）
- setTimeoutを使う場合はCSS定義と一致させ、定数として明示する
- `aria-hidden`関連のコンソール警告は無視しない

---

## 更新履歴

| 日付 | 内容 | 更新者 |
|------|------|--------|
| 2025-12-13 | 初版作成（Next.js、Supabase、React、Playwright関連の既知問題を追加） | Claude Code |
| 2025-01-25 | Radix UI Sheet + AlertDialogのaria-hidden競合問題を追加 | Claude Code |
| 2025-01-25 | Server Action後のクライアント側signOut()ハング問題を追加 | Claude Code |

---

## 定期メンテナンス

### 月次タスク（毎月1回）

- [ ] GitHub Issuesで新しい既知問題をチェック
- [ ] ステータスを更新（解決済み/未解決）
- [ ] 古い情報（解決から6ヶ月以上経過）を削除
- [ ] 新しく遭遇した問題を追加

### 四半期タスク（3ヶ月に1回）

- [ ] フレームワークのバージョンアップ時に影響範囲を確認
- [ ] 解決済み問題の再発がないか確認
- [ ] ドキュメント構成の見直し

---

## 関連ドキュメント

- CLAUDE.md
- プロジェクト固有のドキュメントを追加してください
