---
name: sre-review
description: SRE視点でのレビュー。可用性、監視、障害対応、スケーラビリティ、運用性を体系的にチェック。トリガーワード：「SREレビュー」「可用性確認」「監視設定」「障害対応」「運用レビュー」「SRE review」「インシデント対応」「SLO」「可観測性」。
---

# SRE レビュー

## スコープ

Next.js + Supabase + Vercel 構成を前提としたSREレビュー。

## チェックリスト

### 1. 可用性・信頼性 (Reliability)

- [ ] 外部サービス（Supabase, Vercel）の障害時にアプリが完全停止しないか
  - Supabase ダウン時のフォールバック（キャッシュ表示等）
  - エラーバウンダリの設定
- [ ] リトライ戦略が適切か（指数バックオフ等）
- [ ] タイムアウトが設定されているか（fetch, DB クエリ）
- [ ] Graceful degradation の考慮
- [ ] SLO の定義有無（応答時間、エラー率）

### 2. 可観測性 (Observability)

- [ ] **ログ**: 構造化ログが出力されているか
  - エラーログに十分なコンテキスト（userId, requestId等）があるか
  - ログレベルが適切か（DEBUG/INFO/WARN/ERROR）
- [ ] **メトリクス**: Vercel Analytics / Web Vitals の設定
- [ ] **トレーシング**: リクエストの追跡が可能か
- [ ] **アラート**: 異常検知の仕組み（Vercel のデプロイ通知等）

### 3. エラーハンドリング

- [ ] 未キャッチ例外のグローバルハンドリング
  - `error.tsx` / `global-error.tsx` の配置
  - `not-found.tsx` の配置
- [ ] API エラーの統一的なハンドリング
- [ ] ユーザー向けエラーメッセージが適切か（内部情報を露出しない）
- [ ] エラー発生時のデータ整合性（部分的な更新の防止）

### 4. スケーラビリティ

- [ ] Supabase の接続プール設定
  - Serverless 環境での connection pooler 使用
- [ ] 画像配信のCDN活用
- [ ] 静的生成（SSG）可能なページが動的になっていないか
- [ ] Rate limiting の考慮（API Routes, Server Actions）
- [ ] データ量増加時のクエリパフォーマンス（インデックス設計）

### 5. デプロイ・リリース

- [ ] ゼロダウンタイムデプロイが可能か（Vercel は標準対応）
- [ ] DBマイグレーションの安全性（destructiveな変更がないか）
- [ ] ロールバック手順の存在
- [ ] 環境変数の管理（Vercel の環境設定）
- [ ] Preview デプロイでの動作確認フロー

### 6. データ管理

- [ ] バックアップ戦略（Supabase の自動バックアップ + 手動ダンプ）
- [ ] データリテンション（ログ・一時データの保持期間）
- [ ] 個人情報の取り扱い（GDPR/個人情報保護法の考慮）

### 7. セキュリティ運用

- [ ] 依存パッケージの定期更新（Dependabot等）
- [ ] シークレットのローテーション手順
- [ ] インシデント対応手順書の有無

### 8. コスト管理

- [ ] Vercel の使用量が Free/Pro プランの制限内か
- [ ] Supabase の使用量が制限内か
- [ ] 不要なリソース（未使用のStorage等）がないか

## 確認コマンド

```bash
# error.tsx の配置確認
find app -name 'error.tsx' -o -name 'not-found.tsx' -o -name 'loading.tsx' | sort

# 環境変数の一覧（値は表示しない）
grep -r 'process.env\.' --include='*.ts' --include='*.tsx' app/ lib/ | \
  grep -o 'process\.env\.[A-Z_]*' | sort -u

# Supabase 接続設定確認
grep -rn 'createClient\|createServerClient' --include='*.ts' lib/supabase/
```

## レポートフォーマット

```markdown
## SRE レビュー結果

### 成熟度スコア（5段階）
| カテゴリ | スコア | コメント |
|---------|--------|---------|
| 可用性 | ★★★☆☆ | エラーバウンダリ未設定 |
| 可観測性 | ★★☆☆☆ | 構造化ログ未導入 |
| エラーハンドリング | ★★★★☆ | error.tsx配置済み |
| スケーラビリティ | ★★★☆☆ | インデックス要確認 |
| デプロイ | ★★★★☆ | Vercel自動デプロイ |
| データ管理 | ★★★☆☆ | バックアップ手動のみ |

### 優先度別アクションアイテム

#### P0（即対応）
- ...

#### P1（今スプリント）
- ...

#### P2（バックログ）
- ...
```
