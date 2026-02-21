---
name: vitest-unit-test
description: vitest でユニットテストを作成・実行する。テスト対象ファイルの特定、テストファイル生成、実行・修正のワークフロー。トリガーワード：「ユニットテスト」「vitest」「テストを書いて」「テスト追加」「単体テスト」「.test.ts作成」。
---

# vitest ユニットテスト

## 前提

- テストランナー: vitest
- 設定ファイル: `vitest.config.ts`（なければ作成指示）
- テストファイル命名: `*.test.ts` / `*.test.tsx`（対象ファイルと同じディレクトリ or `__tests__/`）

## ワークフロー

### 1. 対象ファイルの特定

ユーザーが指定しない場合:
```bash
# 変更ファイルからテスト対象を特定
git diff --name-only HEAD~1 | grep -E '\.(ts|tsx)$' | grep -v '\.test\.'
```

### 2. テスト作成の原則

- **テスト対象を先に読む**: 関数のシグネチャ・型・分岐を把握してからテストを書く
- **AAA パターン**: Arrange → Act → Assert
- **1テスト1アサーション**を基本とする（関連する複数アサーションは可）
- **テスト名は日本語OK**: `it('空文字を渡すとエラーを返す', ...)`
- **モック最小化**: 外部依存のみモック。内部ロジックはモックしない

### 3. vitest セットアップ確認

```bash
# vitest がインストールされているか確認
npx vitest --version 2>/dev/null || echo "vitest未インストール"
```

未インストールの場合:
```bash
npm install -D vitest @vitest/coverage-v8
```

`vitest.config.ts` がない場合の最小構成:
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // React コンポーネントなら 'jsdom'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

### 4. テストファイル生成テンプレート

```typescript
import { describe, it, expect, vi } from 'vitest'
// import対象

describe('関数名/モジュール名', () => {
  describe('正常系', () => {
    it('基本的な入力で期待値を返す', () => {
      // Arrange
      // Act
      // Assert
    })
  })

  describe('異常系', () => {
    it('不正入力でエラーをスローする', () => {
      expect(() => fn(invalidInput)).toThrow()
    })
  })

  describe('境界値', () => {
    it('空配列を渡すと空配列を返す', () => {
      expect(fn([])).toEqual([])
    })
  })
})
```

### 5. テスト実行

```bash
# 全テスト実行
npx vitest run

# 特定ファイル
npx vitest run path/to/file.test.ts

# watch モード（開発中）
npx vitest
```

### 6. 失敗時の対応

1. エラーメッセージを読み、**テストと実装どちらが間違いか**を判断
2. テストが間違い → テストを修正
3. 実装が間違い → ユーザーに報告して確認（勝手に実装を変えない）
4. 型エラー → import パスやモック型を確認

## テスト種別ごとのガイド

| 種別 | environment | モック例 |
|------|-------------|---------|
| ユーティリティ関数 | `node` | 不要 |
| データ取得関数 | `node` | Supabase client をモック |
| React コンポーネント | `jsdom` | `@testing-library/react` |
| Server Actions | `node` | `cookies()`, `redirect()` をモック |
| API Route | `node` | `NextRequest` を構築 |

## Supabase モックパターン

```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
  })),
}))
```
