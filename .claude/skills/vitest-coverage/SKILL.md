---
name: vitest-coverage
description: vitest でカバレッジを取得し、できる限り改善する。計測→分析→テスト追加→再計測のループ。トリガーワード：「vitest coverage」「カバレッジ」「vitest カバレッジ」「coverage 改善」「カバレッジを上げて」「テストカバレッジ vitest」。
---

# vitest Coverage 改善

## セットアップ確認

```bash
# vitest + coverage プロバイダーの確認
npx vitest --version 2>/dev/null || echo "vitest未インストール"
```

未インストールの場合:
```bash
npm install -D vitest @vitest/coverage-v8
```

`vitest.config.ts` にカバレッジ設定:
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['app/**/*.ts', 'app/**/*.tsx', 'lib/**/*.ts', 'lib/**/*.tsx'],
      exclude: ['**/*.test.*', '**/*.bench.*', '**/node_modules/**', '**/.next/**'],
    },
  },
})
```

## ワークフロー

### Step 1: カバレッジ計測

```bash
# カバレッジ付き全テスト実行
npx vitest run --coverage

# 特定ディレクトリのみ
npx vitest run --coverage app/data/
```

### Step 2: 結果分析

`coverage/coverage-summary.json` を読み、以下を確認:

| メトリクス | 目標 | 危険水準 |
|-----------|------|---------|
| lines | 80%+ | 60%未満 |
| functions | 90%+ | 70%未満 |
| branches | 60%+ | 40%未満 |
| statements | 80%+ | 60%未満 |

ファイル別に低カバレッジのものを特定し、優先順位をつける。

### Step 3: 改善対象の優先順位

1. **重要ビジネスロジック**: `app/data/`, `lib/`, Server Actions
2. **ユーティリティ関数**: `lib/utils/`, ヘルパー
3. **カスタムフック**: `hooks/`
4. **UIコンポーネント**: `components/`（テスト効果が低い場合は後回し）

### Step 4: テスト追加

`vitest-unit-test` スキルに従ってテストを作成。重点的に:
- **行カバレッジ向上**: 未実行の関数を呼ぶテストを追加
- **分岐カバレッジ向上**: if/else, 三項演算子, `??`, `&&` の両方のパスをテスト
- **関数カバレッジ向上**: export されている未テスト関数を特定してテスト

### Step 5: 再計測・確認

```bash
npx vitest run --coverage
```

### 並列テスト作成（高速化）

対象ファイルが多い場合、サブエージェントで並列化:
```
1. カバレッジ分析で対象ファイルを 3-5 ファイルずつグループ化
2. グループごとにサブエージェントを起動（最大4並列）
3. 各サブエージェントでテスト作成 + 個別実行確認
4. 全完了後、全体カバレッジを再計測
```

## 既存カバレッジダッシュボードとの連携

プロジェクトに `tools/coverage-dashboard/` がある場合:
```bash
# ダッシュボードのデータも更新
npm run coverage:scan
```

## 関連スキル

- `vitest-unit-test` — テスト作成の詳細手順
- `coverage-improvement` — Jest版カバレッジワークフロー（既存ダッシュボード連携）
