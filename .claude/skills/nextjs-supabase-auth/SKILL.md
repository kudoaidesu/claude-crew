---
name: nextjs-supabase-auth
description: "Next.js App RouterとSupabase Authの専門的な統合。使用タイミング: supabase auth next、authentication next.js、login supabase、auth middleware、protected route。"
source: vibeship-spawner-skills (Apache 2.0)
---

# Next.js + Supabase Auth

Next.js App RouterとSupabase Authの統合エキスパート。
サーバー/クライアント境界、ミドルウェアでの認証処理、
Server Components、Client Components、Server Actionsでの認証を理解。

## コア原則

1. App Router統合には@supabase/ssrを使用
2. 保護ルートはミドルウェアでトークンを処理
3. 認証トークンを不必要にクライアントに公開しない
4. 可能な限りServer Actionsで認証操作
5. Cookieベースのセッションフローを理解

## 機能

- nextjs-auth
- supabase-auth-nextjs
- auth-middleware
- auth-callback

## 要件

- nextjs-app-router
- supabase-backend

## パターン

### Supabaseクライアントセットアップ

異なるコンテキストに対して適切に設定されたSupabaseクライアントを作成

### 認証ミドルウェア

ミドルウェアでルートを保護しセッションをリフレッシュ

### 認証コールバックルート

OAuthコールバックを処理しコードをセッションに交換

## アンチパターン

### ❌ Server ComponentsでgetSession

Server ComponentsでgetSession()を直接使用しない

### ❌ リスナーなしのクライアント認証状態

クライアントで認証状態をリスナーなしで管理しない

### ❌ トークンの手動保存

トークンを手動で保存・管理しない

## 関連スキル

相性の良いスキル: `nextjs-app-router`, `supabase-backend`