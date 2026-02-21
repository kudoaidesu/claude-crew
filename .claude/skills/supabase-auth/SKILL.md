---
name: supabase-auth
description: Next.js App Router + Supabase認証の実装パターン。ログイン・ログアウト後のUI更新問題（router.refresh()が本番で動作しない既知問題）の回避策を提供。認証機能の実装・デバッグ時に使用。
---

# Supabase認証実装パターン

## 重要：レンダリング戦略

**このプロジェクトはSSRを採用（SSG/ISRは使用しない）**

### 方針
- 全ページで`dynamic = 'force-dynamic'`、`revalidate = 0`を設定
- `generateStaticParams`は使用しない

### 理由
ヘッダーに認証状態（ログイン/ログアウト）を表示するため、ページキャッシュ（ISR）を使用するとフリッカーが発生する。

### パフォーマンス対策
- 公開データ（イベント・団体）: `unstable_cache`でデータキャッシュ
- 認証データ: 毎リクエスト取得（no-store）

### 詳細
→ [ssr-datacache-strategy.md](references/ssr-datacache-strategy.md) 参照

---

## 既知問題

Next.js App Routerの`router.refresh()`は本番環境でServer Componentsを再取得しない（[GitHub #52964](https://github.com/vercel/next.js/issues/52964)）。

## 解決策：window.location.hrefによる完全リロード

### ログイン

```typescript
// Client Component
const handleSubmit = async (formData: FormData) => {
  await signInWithPassword(formData)  // Server Action
  window.location.href = '/'          // 完全リロード
}
```

### ログアウト

```typescript
const handleLogout = async () => {
  // 1. Client側でsignOut（onAuthStateChange発火）
  const supabase = createClient()
  await supabase.auth.signOut()

  // 2. Server Action
  await signOut()

  // 3. 完全リロード
  window.location.href = '/'
}
```

### Server Action

```typescript
'use server'
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  // redirect()は使わない - クライアント側でwindow.location.href
}
```

## 動作しないパターン

```typescript
// ❌ 本番で動作しない
router.refresh()
router.push('/') + router.refresh()
revalidatePath() + redirect()  // 組み合わせで不安定
```

## デバッグ手順

1. 手動リロードで正しく表示される → キャッシュ問題確定
2. Cookie確認：`document.cookie`でセッション状態を確認
3. サーバーログでServer Action実行を確認

## 詳細リファレンス

- [認証ベストプラクティス](references/auth-best-practices.md)
- [SSR-DataCache戦略](references/ssr-datacache-strategy.md)
