---
name: vitest-bench
description: vitest bench でベンチマークを取得・分析する。パフォーマンスクリティカルな関数の計測、比較、レポート生成。トリガーワード：「ベンチマーク」「bench」「パフォーマンス計測」「速度比較」「vitest bench」「処理速度」。
---

# vitest bench ベンチマーク

## 前提

- vitest の `bench` 機能を使用（`vitest bench` コマンド）
- ベンチマークファイル: `*.bench.ts`
- 配置場所: `benchmarks/` ディレクトリ or 対象ファイルの隣

## セットアップ確認

```bash
npx vitest --version 2>/dev/null || echo "vitest未インストール"
```

## ワークフロー

### 1. 計測対象の特定

ユーザー指定がない場合、以下を優先:
- データ変換・フィルタリング関数
- ソート・検索ロジック
- 文字列処理・正規表現
- 大量データを扱うループ処理

### 2. ベンチマークファイル作成

```typescript
import { describe, bench } from 'vitest'

describe('対象関数のベンチマーク', () => {
  // 基本計測
  bench('関数名 - 基本ケース', () => {
    targetFunction(sampleInput)
  })

  // サイズ別比較
  bench('関数名 - 小データ(10件)', () => {
    targetFunction(smallData)
  })

  bench('関数名 - 大データ(10000件)', () => {
    targetFunction(largeData)
  })

  // 実装比較（最適化前後など）
  bench('実装A - forループ', () => {
    implA(data)
  })

  bench('実装B - reduce', () => {
    implB(data)
  })
})
```

### 3. 実行

```bash
# 全ベンチマーク実行
npx vitest bench

# 特定ファイル
npx vitest bench benchmarks/target.bench.ts

# JSON出力（CI/比較用）
npx vitest bench --reporter=json > benchmark-results.json
```

### 4. 結果の読み方

| 指標 | 意味 |
|------|------|
| hz | 1秒あたりの実行回数（高いほど速い） |
| min/max | 最小・最大実行時間 |
| mean | 平均実行時間 |
| p75/p99 | パーセンタイル |
| samples | サンプル数 |

### 5. レポート

結果を以下のフォーマットで報告:
```
## ベンチマーク結果

| 関数 | ops/sec | mean | p99 | 比較 |
|------|---------|------|-----|------|
| implA | 1,234,567 | 0.81μs | 1.2μs | baseline |
| implB | 2,345,678 | 0.43μs | 0.8μs | 1.9x faster |
```

## 注意事項

- ベンチマークはCIに含めない（環境依存が大きい）
- 比較は同一マシン・同一条件で行う
- マイクロベンチマークの過信に注意（実際のボトルネックはI/Oが多い）
- `setup` でデータを事前生成し、計測に含めない
