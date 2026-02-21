---
name: supabase-best-practices
description: Clerk認証統合を含むSupabaseのセキュリティ・パフォーマンスガイドライン。RLSポリシー、Clerkセットアップ、データベースセキュリティなど10カテゴリ40以上のルール。
license: MIT
metadata:
  author: AI Engineering Team
  version: "1.0.1"
  last_updated: "2025-01-27"
---

# Supabase ベストプラクティス

Clerk認証統合を含むSupabaseアプリケーション向けの包括的なセキュリティ・パフォーマンス最適化ガイド。10カテゴリ40以上のルールを影響度順に整理し、安全な開発とコードレビューをガイド。

## 適用タイミング

以下の作業時にこのガイドラインを参照:
- 新規Supabaseプロジェクトのセットアップ
- Clerk認証とSupabaseの統合
- Row Level Security (RLS) ポリシーの作成
- データベーススキーマの設計
- リアルタイム機能の実装
- Storageバケットの設定
- Edge Functionsの作成
- セキュリティ問題のコードレビュー

## 優先度別ルールカテゴリ

| 優先度 | カテゴリ | 影響度 | プレフィックス |
|--------|----------|--------|----------------|
| 1 | Row Level Security | 最重要 | `rls-` |
| 2 | Clerk統合 | 最重要 | `clerk-` |
| 3 | データベースセキュリティ | 高 | `db-` |
| 4 | 認証パターン | 高 | `auth-` |
| 5 | APIセキュリティ | 高 | `api-` |
| 6 | Storageセキュリティ | 中〜高 | `storage-` |
| 7 | リアルタイムセキュリティ | 中 | `realtime-` |
| 8 | Edge Functions | 中 | `edge-` |
| 9 | テスト | 中 | `test-` |
| 10 | セキュリティ | 中 | `security-` |

## クイックリファレンス

### 1. Row Level Security（最重要）

- `rls-always-enable` - publicスキーマテーブルでは常にRLSを有効化
- `rls-wrap-functions-select` - パフォーマンスのため認証関数を(SELECT ...)でラップ
- `rls-add-indexes` - RLSポリシーで使用するカラムにインデックスを追加
- `rls-specify-roles` - TO authenticated句でロールを指定
- `rls-security-definer` - 複雑なポリシーにはSECURITY DEFINER関数を使用
- `rls-minimize-joins` - RLSポリシー内のJOINを最小化
- `rls-explicit-auth-check` - 明示的なauth.uid()チェックを使用
- `rls-restrictive-policies` - 追加制約にはRESTRICTIVEポリシーを使用

### 2. Clerk統合（最重要）

- `clerk-setup-third-party` - サードパーティ認証統合を使用（JWTテンプレートではなく）
- `clerk-client-server-side` - サーバーサイドクライアントにはaccessTokenコールバック
- `clerk-client-client-side` - クライアントサイドクライアントにはuseSession()フック
- `clerk-role-claim` - Clerkでrole: authenticatedクレームを設定
- `clerk-org-policies` - マルチテナントRLSには組織クレームを使用
- `clerk-mfa-policies` - RESTRICTIVEポリシーでMFAを強制
- `clerk-no-jwt-templates` - 非推奨のJWTテンプレート統合を使用しない

### 3. データベースセキュリティ（高）

- `db-migrations-versioned` - スキーマ変更にはバージョン管理されたマイグレーション
- `db-schema-design` - 適切なスキーマ設計パターンに従う
- `db-indexes-strategy` - 適切なインデックス戦略を実装
- `db-foreign-keys` - 常に外部キー制約を使用
- `db-triggers-security` - トリガー関数を適切にセキュア化
- `db-views-security-invoker` - ビューにはSECURITY INVOKERを使用

### 4. 認証パターン（高）

- `auth-jwt-claims-validation` - JWTクレームを常に検証
- `auth-user-metadata-safety` - user_metadataは信頼できないものとして扱う
- `auth-app-metadata-authorization` - 認可にはapp_metadataを使用
- `auth-session-management` - 適切なセッション管理を実装

### 5. APIセキュリティ（高）

- `api-filter-queries` - RLSがあってもクエリを常にフィルター
- `api-publishable-keys` - 公開キーを正しく使用
- `api-service-role-server-only` - サービスロールキーをクライアントに公開しない

### 6. Storageセキュリティ（中〜高）

- `storage-rls-policies` - storage.objectsでRLSを有効化
- `storage-bucket-security` - バケットレベルのセキュリティを設定
- `storage-signed-urls` - プライベートファイルには署名付きURLを使用

### 7. リアルタイムセキュリティ（中）

- `realtime-private-channels` - 機密データにはプライベートチャンネル
- `realtime-rls-authorization` - RLSポリシーはリアルタイムにも適用
- `realtime-cleanup-subscriptions` - アンマウント時にサブスクリプションをクリーンアップ

### 8. Edge Functions（中）

- `edge-verify-jwt` - Edge FunctionsでJWTを常に検証
- `edge-cors-handling` - CORSを適切に処理
- `edge-secrets-management` - 機密データにはsecretsを使用

### 9. テスト（中）

- `test-pgtap-rls` - pgTAPでRLSポリシーをテスト
- `test-isolation` - テストを適切に分離
- `test-helpers` - テストヘルパー関数を使用

### 10. セキュリティ（中）

- `security-validate-inputs` - 処理前にすべての入力をバリデーション
- `security-audit-advisors` - Security Advisorチェックを定期実行

## 使用方法

詳細な説明とコード例は個別ルールファイルを参照:

```
references/rules/rls-always-enable.md
references/rules/clerk-setup-third-party.md
references/rules/_sections.md
```

各ルールファイルには以下を含む:
- 重要な理由の簡潔な説明
- 問題のあるコード例と説明
- 正しいコード例と説明
- パターンを使用しない場合
- 公式ドキュメントへの参照リンク

## 完全版ドキュメント

全ルールを展開した完全ガイド: `references/supabase-guidelines.md`