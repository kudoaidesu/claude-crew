---
name: security-review
description: セキュリティ視点でのコードレビュー。OWASP Top 10、Next.js/Supabase固有のリスク、依存パッケージの脆弱性を体系的にチェック。トリガーワード：「セキュリティレビュー」「脆弱性チェック」「セキュリティ確認」「security review」「XSS」「SQLインジェクション」「RLS確認」「認証チェック」。
---

# セキュリティレビュー

## レビュースコープ

ユーザー指定がない場合、以下を全チェック。指定があればそのスコープのみ。

## チェックリスト

### 1. 認証・認可 (Authentication & Authorization)

- [ ] Supabase RLS が全テーブルで有効か
- [ ] `anon` キーで取得できるデータが意図通りか
- [ ] Server Actions / Route Handlers で認証チェックがあるか
- [ ] Middleware で保護すべきルートが網羅されているか
- [ ] JWT の有効期限・リフレッシュ設定が適切か

```bash
# RLS確認（ローカルDB）
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres \
  -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
```

### 2. インジェクション (Injection)

- [ ] SQL: `.rpc()` や `.textSearch()` でユーザー入力を直接使っていないか
- [ ] XSS: `dangerouslySetInnerHTML` を使っていないか、使う場合はサニタイズしているか
- [ ] Server Actions の入力にバリデーション（zod等）があるか
- [ ] URL パラメータ・クエリストリングの検証

### 3. データ露出 (Data Exposure)

- [ ] `.select('*')` で不要なカラム（password_hash等）を返していないか
- [ ] クライアントコンポーネントに機密データを渡していないか
- [ ] エラーメッセージに内部情報（スタックトレース、DB構造）が含まれないか
- [ ] `console.log` で機密情報を出力していないか

### 4. 環境変数・シークレット

- [ ] `.env.local` が `.gitignore` に含まれているか
- [ ] クライアント露出すべきでない変数に `NEXT_PUBLIC_` が付いていないか
- [ ] ハードコードされたシークレットがないか

```bash
# シークレットのハードコード検索
grep -rn "password\|secret\|api_key\|token" --include='*.ts' --include='*.tsx' \
  --exclude-dir=node_modules --exclude-dir=.next | grep -v 'process.env' | grep -v '.test.'
```

### 5. 依存パッケージ

```bash
# 脆弱性スキャン
npm audit
# 詳細
npm audit --json | jq '.vulnerabilities | to_entries[] | {name: .key, severity: .value.severity}'
```

### 6. Next.js 固有

- [ ] `headers()`, `cookies()` の使い方が安全か
- [ ] Image src に外部URLを許可する場合、`next.config.ts` の `remotePatterns` が適切か
- [ ] CSP (Content-Security-Policy) ヘッダーの設定
- [ ] CORS 設定が適切か

### 7. Supabase 固有

- [ ] Storage バケットのポリシーが適切か（public/private）
- [ ] Edge Functions の認証チェック
- [ ] Database Functions が `SECURITY DEFINER` の場合、入力検証があるか

## レポートフォーマット

```markdown
## セキュリティレビュー結果

### サマリー
- 🔴 Critical: N件
- 🟠 High: N件
- 🟡 Medium: N件
- 🔵 Low: N件

### 検出事項

#### [Critical] RLSが無効なテーブル
- **ファイル**: `supabase/migrations/xxx.sql`
- **リスク**: 未認証ユーザーがデータにアクセス可能
- **修正案**: `ALTER TABLE xxx ENABLE ROW LEVEL SECURITY;`

...
```

## 実行順序

1. 依存パッケージスキャン（`npm audit`）
2. 静的コード解析（grep/検索）
3. RLS・認証設定の確認
4. 手動コードレビュー（重要度の高いファイルから）
5. レポート作成
