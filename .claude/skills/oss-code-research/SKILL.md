---
name: oss-code-research
description: 類似OSSのコードを調査・分析する。GitHubで類似プロジェクトを発見し、clone・コード読解・パターン抽出を行う。トリガーワード：「OSS調査」「他のOSS」「類似プロジェクト」「コード参考」「OSSを調べて」「実装参考」「どう実装してる」「oss research」。
---

# OSS コード調査

## ワークフロー

### 1. 類似OSS の発見

調査対象の技術・ドメインに応じて GitHub を検索:

```bash
# GitHub CLI でリポジトリ検索
gh search repos "キーワード" --language=TypeScript --sort=stars --limit=10

# 特定の技術スタックで検索
gh search repos "next.js supabase" --sort=stars --limit=10

# コード検索（特定の実装パターン）
gh search code "キーワード" --language=TypeScript --limit=10
```

### 2. リポジトリの評価

以下の基準で調査対象を選定:

| 基準 | 目安 |
|------|------|
| Stars | 100+ （品質の最低ライン）|
| 最終更新 | 6ヶ月以内 |
| ライセンス | MIT / Apache 2.0 等のコピー可能なもの |
| 技術スタック | プロジェクトと近いもの優先 |

```bash
# リポジトリ詳細確認
gh repo view owner/repo
```

### 3. Clone & 調査

```bash
# 一時ディレクトリに clone（プロジェクトを汚さない）
TMPDIR=$(mktemp -d)
git clone --depth 1 https://github.com/owner/repo.git "$TMPDIR/repo"

# ディレクトリ構造確認
ls -la "$TMPDIR/repo"
tree "$TMPDIR/repo/src" -L 2 2>/dev/null || find "$TMPDIR/repo/src" -maxdepth 2 -type f

# 特定パターンの検索
grep -rn "検索パターン" "$TMPDIR/repo/src" --include='*.ts' --include='*.tsx'
```

### 4. コード読解のポイント

以下を重点的に分析:
- **ディレクトリ構造**: どのようにコードを整理しているか
- **データフェッチパターン**: Server Component / Client Component の使い分け
- **状態管理**: グローバル状態の管理方法
- **型定義**: スキーマ・DTOの設計
- **エラーハンドリング**: 統一的なパターンがあるか
- **テスト戦略**: テストの書き方・構成

### 5. レポート

```markdown
## OSS 調査レポート

### 調査目的
（何を学びたいか）

### 調査対象

| リポジトリ | Stars | 技術スタック | 特徴 |
|-----------|-------|-------------|------|
| owner/repo1 | 5.2k | Next.js + Supabase | 認証フロー参考 |
| owner/repo2 | 3.1k | Next.js + Prisma | DB設計参考 |

### 発見したパターン

#### パターン1: XXX
- **リポジトリ**: owner/repo1
- **ファイル**: `src/lib/auth.ts`
- **概要**: ...
- **コード例**:
  ```typescript
  // 関連コード（ライセンス確認済み）
  ```
- **当プロジェクトへの適用可否**: ○ / △ / ×
- **理由**: ...

### 推奨アクション
1. ...
2. ...
```

### 6. クリーンアップ

```bash
# 一時ディレクトリの削除
rm -rf "$TMPDIR"
```

## 注意事項

- ライセンスを必ず確認し、コードのコピーではなくパターンの参考にとどめる
- clone は一時ディレクトリに行い、プロジェクト内に残さない
- 調査は目的を明確にし、必要最小限のファイルだけ読む
