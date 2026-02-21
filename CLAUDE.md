# プロジェクトルール

## 絶対厳守ルール

### データベース操作
- **禁止**: `db reset`、`DELETE FROM`、`TRUNCATE` をユーザー許可なく実行
- **必須**: 破壊的操作は必ずユーザーに確認してから実行

### 言語制限
- **禁止**: Pythonスクリプトの実行（スキル内のPythonも含む）
- **必須**: スクリプトはすべてTypeScript（tsx）またはNode.jsで作成
- **必須**: `npx tsx` でTypeScriptスクリプトを実行

## 技術スタック

<!-- プロジェクトに合わせて編集してください -->
- Next.js (App Router) + React + TypeScript
- Tailwind CSS + shadcn/ui + Radix UI
- Supabase (認証・DB・Storage)
- Playwright (E2E) + Vitest (ユニット)

## ブランチ戦略

```
feature/* or fix/* → develop → main（PR経由）
```

- 1ブランチ1機能、ビルド確認必須
- mainへの直接マージ禁止

## コーディング規約

- 命名: camelCase（変数・関数）/ PascalCase（型・コンポーネント）
- Server Components優先、`'use client'`は必要時のみ
- `any`型禁止

## 実行コマンド

```bash
npm run dev              # 開発サーバー
npm run build            # ビルド
npm run test             # テスト
npm run test:e2e         # E2Eテスト
```

## ディレクトリ構造

<!-- プロジェクトに合わせて編集してください -->
```
app/
├── (auth)/        # 認証関連
├── api/           # APIルート
└── ...

components/ui/     # shadcn/uiコンポーネント
lib/               # ユーティリティ
types/             # 型定義
```

## プロジェクト概要

<!-- プロジェクトの概要を記述してください -->
- **ビジョン**:
- **ターゲット**:
- **制約**:

## ドキュメント参照

| カテゴリ | パス |
|---------|------|
| 開発ガイドライン | `docs/` |
