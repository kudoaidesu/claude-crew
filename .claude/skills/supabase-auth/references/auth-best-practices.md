# Supabase認証の注意点とベストプラクティス

## 概要
Next.js 14 App RouterとSupabase認証を組み合わせた際の、ログアウト時にヘッダーが更新されない問題の根本的な解決方法。

## 問題
- ログアウトボタンをクリックしてもヘッダーのユーザー情報が残る
- `onAuthStateChange`が`SIGNED_OUT`イベントを受信しない

## 原因
Server Action (`signOut`) はサーバー側のセッションのみを削除し、Client側の`onAuthStateChange`に通知されない。

## 根本的な解決策

### Client側でもsignOutを実行する

```typescript
// ❌ 問題のあるコード（Server Actionのみ）
<form action={signOut}>
  <button>ログアウト</button>
</form>

// ✅ 正しいコード（Client側とServer側の連携）
<form action={async () => {
  // 1. クライアント側でログアウト（onAuthStateChangeを発火）
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  await supabase.auth.signOut()
  
  // 2. Server Actionで完全なログアウト処理
  await signOut()
}}>
  <button>ログアウト</button>
</form>
```

### Server Action側の実装

```typescript
// app/login/actions.ts
export const signOut = async () => {
  const supabase = createServerClient();
  await supabase.auth.signOut();
  
  // キャッシュを無効化
  revalidatePath('/', 'layout')
  
  // リダイレクト
  redirect('/');
};
```

## なぜこれで解決するか

1. **Client側の`supabase.auth.signOut()`実行**
   - ブラウザのセッションがクリアされる
   - `onAuthStateChange`に`SIGNED_OUT`イベントが発火
   - Client Componentの状態が即座に更新

2. **Server Actionの`signOut()`実行**
   - サーバー側のセッションもクリア
   - キャッシュ無効化でServer Componentも再評価
   - 適切なページへリダイレクト

## 実装時の注意点

- 必ずClient側とServer側の両方でログアウト処理を実行する
- Server Actionのみでは`onAuthStateChange`が発火しない
- この順序（Client側→Server側）を守ることが重要