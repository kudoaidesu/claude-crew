---
name: pre-deploy-checklist
description: デプロイ前の必須チェック。DB差分確認、ビルド、E2Eテストを順次実行。トリガーワード：「デプロイ前」「デプロイ準備」「本番反映前」「リリース前チェック」「pre-deploy」。
---

# デプロイ前チェックリスト

## 実行順序

### 1. DB差分チェック（本番 vs ローカル）

```bash
npx tsx ~/.claude/skills/supabase-diff-check/scripts/diff-check.ts
```

| 結果 | 対応 |
|------|------|
| 差分なし | 次へ進む |
| 差分あり | マイグレーション作成が必要か判断 → ユーザーに確認 |

**禁止**: `supabase db push` は絶対に実行しない

### 2. 脆弱性チェック

```bash
npm audit
```

| 結果 | 対応 |
|------|------|
| 0 vulnerabilities | 次へ進む |
| moderate以下 | 確認の上、次へ進む（後で対応可） |
| high/critical | `npm audit fix` で修正、または手動対応 |

### 3. ビルド確認

```bash
npm run build
```

- エラーがあれば修正してから再実行

### 4. テスト実行（全種別）

→ [e2e-test-principles](../e2e-test-principles/SKILL.md) を参照

```bash
# テストユーザー作成（初回または必要時）
npx tsx scripts/seed-test-users.ts

# 開発サーバー起動確認
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

#### 4-1. 単体テスト・統合テスト
```bash
npm run test
```

#### 4-2. E2Eテスト（全権限）
```bash
# 管理者フロー
npm run test:e2e:admin

# 主催者フロー
npm run test:e2e:organizer

# 一般ユーザーフロー
npm run test:e2e:user

# または全E2Eテスト一括実行
npx playwright test
```

#### 4-3. その他（任意）
```bash
# アクセシビリティ
npm run test:e2e:a11y

# セキュリティ
npm run test:security
```

### 5. 完了判定

| 項目 | 状態 |
|------|------|
| DB差分 | なし or 対応済み |
| 脆弱性 | なし or moderate以下 |
| ビルド | 成功 |
| 単体・統合テスト | 全パス |
| E2Eテスト（全権限） | 全パス |

すべてクリアでデプロイ可能。

## 前回実行記録

| 項目 | 実行時間 | 結果 |
|------|----------|------|
| DB差分チェック | 5秒 | 差分なし |
| 脆弱性チェック | 3秒 | 5件（moderate 1, low 4） |
| ビルド | 30秒 | 成功 |
| 単体・統合テスト | 3秒 | 377件パス |
| E2Eテスト | 24分 | 409パス / 61失敗 / 8スキップ |
| **合計** | **約25分** | - |

**最終実行日時**: 2026-02-01

## トラブルシューティング

| 問題 | 対処 |
|------|------|
| DB差分チェックがエラー | `supabase login` / `supabase link` を確認 |
| ビルドエラー | TypeScriptエラーを修正 |
| E2Eテスト失敗 | [e2e-test-principles](../e2e-test-principles/SKILL.md) の「よくある失敗パターン」を参照 |
