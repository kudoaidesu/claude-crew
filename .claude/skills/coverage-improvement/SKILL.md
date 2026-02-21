---
name: coverage-improvement
description: テストカバレッジの計測・評価・改善ワークフロー。カバレッジダッシュボードでデータを生成し、現状を評価し、改善計画に基づいてテストを追加する。トリガーワード：「カバレッジ改善」「カバレッジ評価」「カバレッジ確認」「テストカバレッジ」「coverage」「カバレッジダッシュボード」「テスト不足」「未テストファイル」。使用タイミング：カバレッジの現状把握、改善優先度の決定、テスト追加作業時。
---

# Coverage Improvement ワークフロー

テストカバレッジの計測→可視化→評価→改善を一貫して行うワークフロー。

## ツールチェーン

### カバレッジダッシュボード

`tools/coverage-dashboard/` にVite + React製のスタンドアロンアプリがある。

```bash
# 1. カバレッジデータ生成（Jest実行 + JSON生成）
npm run coverage:scan

# 2. ダッシュボード起動（http://localhost:3100）
npm run coverage:dashboard
```

### 生成されるデータファイル

| ファイル | 内容 |
|---------|------|
| `tools/coverage-dashboard/data/coverage-summary.json` | ファイル別のlines/statements/functions/branchesカバレッジ |
| `tools/coverage-dashboard/data/coverage-final.json` | 行レベルの実行回数・分岐・関数呼出詳細 |
| `tools/coverage-dashboard/data/test-inventory.json` | テストファイル一覧、describe/it階層、ソース紐付け |
| `tools/coverage-dashboard/data/trend.json` | カバレッジ推移（最大90日分） |

## 評価手順

### Step 1: データ生成

```bash
npm run coverage:scan
```

### Step 2: サマリー確認

`coverage-summary.json` の `total` キーから全体値を取得:

| メトリクス | 説明 | 目標値 | 危険水準 |
|-----------|------|--------|---------|
| lines（行カバレッジ/C0） | 実行された行の割合 | 80%以上 | 60%未満 |
| statements（文カバレッジ/C0） | 実行された文の割合 | 80%以上 | 60%未満 |
| functions（関数カバレッジ/C0） | 呼び出された関数の割合 | 90%以上 | 70%未満 |
| branches（分岐カバレッジ/C1） | 通過した条件分岐の割合 | 60%以上 | 40%未満 |

### Step 3: ディレクトリ別分析

`coverage-summary.json` のファイルパスをディレクトリ別に集計し、弱点を特定。

### Step 4: テストピラミッド分析

`test-inventory.json` の `stats.byCategory` から構成比を確認:

| テストタイプ | 理想比率 |
|------------|---------|
| unit | 60-70% |
| integration | 20-30% |
| e2e | 5-15% |

Unit : E2E が逆転している場合はユニットテスト不足。

### Step 5: ギャップ分析

`test-inventory.json` の `untestedSources` で未テストファイルを確認。

## 改善の優先順位

### 優先度1: 重要ビジネスロジック

- `lib/data/` — データ取得関数
- `lib/permissions.ts` — 権限チェック
- `app/actions/` — Server Actions

### 優先度2: ユーティリティ・共通基盤

- `lib/` 配下のヘルパー関数
- `hooks/` — カスタムフック

### 優先度3: UIコンポーネント

- `components/` — 共通コンポーネント
- `app/` 配下のClient Components

### 優先度4: エッジケース・分岐

- 既存テストファイルの分岐カバレッジ改善
- エラーケース、バウンダリケースの追加

## 改善作業フロー（高速版）

**詳細は `testing-brain-data-management` スキルの「テスト作成・消化を高速化するための手順」を参照。**

```
Phase 1: 分析（1回だけ）
  1. coverage-summary.json を分析して弱点特定
  2. 対象ファイルを優先度でグループ化（3-5ファイル/グループ）

Phase 2: テスト作成（並列サブエージェント、最大4並列）
  3. グループごとにサブエージェントを起動
  4. 各サブエージェントはテスト作成 + 個別実行確認
  5. 全サブエージェント完了を待つ

Phase 3: 検証（1回だけ）
  6. 全テスト一括実行（カバレッジ付き）
  7. npm run coverage:scan でダッシュボード更新
```

### Jest実行の注意点

| 設定 | 推奨値 | 理由 |
|------|--------|------|
| `--selectProjects` | `node` | **dom はハングする（既知問題）** |
| `--maxWorkers` | `4` | 1=11.8s, 4=6.1s（約2倍速） |
| `NODE_OPTIONS` | `--max-old-space-size=8192` | OOM防止 |
| `--forceExit` | 必須 | 非同期リークがある |

```bash
# テスト実行（カバレッジなし、高速）
npx jest tests/unit --forceExit --maxWorkers=4 --selectProjects=node

# テスト実行（カバレッジ付き、ダッシュボード更新用）
NODE_OPTIONS="--max-old-space-size=8192" npx jest tests/unit --coverage --forceExit --maxWorkers=4 --coverageReporters=json-summary --coverageReporters=json --selectProjects=node

# 個別テスト実行（作成中の確認、1-2秒）
npx jest tests/unit/lib/foo.test.ts --forceExit --selectProjects=node
```

## カバレッジ改善のコツ

- **行カバレッジ向上**: 未実行の関数・メソッドのテストを追加
- **分岐カバレッジ向上**: if/else、三項演算子、&&/|| の両パスをテスト
- **関数カバレッジ向上**: export されているが呼ばれていない関数を特定してテスト
- **テストは少数精鋭**: 1テストで複数行をカバーするシナリオを書く

## 関連スキル

- `testing-brain-data-management` — ダッシュボード更新手順、高速化の詳細
- `codex-review` — テストコードのレビュー
- `e2e-test-principles` — E2Eテスト作成の原則
