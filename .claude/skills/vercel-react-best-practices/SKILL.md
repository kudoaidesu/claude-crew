---
name: vercel-react-best-practices
description: Vercel Engineeringによる React/Next.js パフォーマンス最適化ガイドライン。React/Next.jsコードの作成・レビュー・リファクタリング時に最適なパフォーマンスパターンを適用。トリガーワード：「実装して」「コンポーネント作成」「refactor:」「リファクタリング」「パフォーマンス改善」「最適化」「遅い」「重い」「improve:」。Reactコンポーネント、Next.jsページ、データフェッチ、バンドル最適化に関するタスクで発動。
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React ベストプラクティス

React/Next.jsアプリケーション向けの包括的なパフォーマンス最適化ガイド（Vercel公式）。8カテゴリ57ルールを影響度順に整理し、自動リファクタリングとコード生成をガイド。

## 適用タイミング

以下の作業時にこのガイドラインを参照:
- 新規Reactコンポーネント/Next.jsページの作成
- データフェッチの実装（クライアント/サーバーサイド）
- パフォーマンス問題のコードレビュー
- 既存React/Next.jsコードのリファクタリング
- バンドルサイズ/読み込み時間の最適化

## 優先度別ルールカテゴリ

| 優先度 | カテゴリ | 影響度 | プレフィックス |
|--------|----------|--------|----------------|
| 1 | ウォーターフォール排除 | 最重要 | `async-` |
| 2 | バンドルサイズ最適化 | 最重要 | `bundle-` |
| 3 | サーバーサイドパフォーマンス | 高 | `server-` |
| 4 | クライアントサイドデータフェッチ | 中〜高 | `client-` |
| 5 | 再レンダリング最適化 | 中 | `rerender-` |
| 6 | レンダリングパフォーマンス | 中 | `rendering-` |
| 7 | JavaScriptパフォーマンス | 低〜中 | `js-` |
| 8 | 高度なパターン | 低 | `advanced-` |

## クイックリファレンス

### 1. ウォーターフォール排除（最重要）

- `async-defer-await` - awaitを実際に使用するブランチに移動
- `async-parallel` - 独立した操作にはPromise.all()を使用
- `async-dependencies` - 部分的な依存関係にはbetter-allを使用
- `async-api-routes` - APIルートでPromiseを早期開始、遅延await
- `async-suspense-boundaries` - Suspenseでコンテンツをストリーミング

### 2. バンドルサイズ最適化（最重要）

- `bundle-barrel-imports` - バレルファイルを避け直接インポート
- `bundle-dynamic-imports` - 重いコンポーネントにはnext/dynamicを使用
- `bundle-defer-third-party` - アナリティクス/ログはhydration後に読み込み
- `bundle-conditional` - 機能がアクティブな時のみモジュールを読み込み
- `bundle-preload` - hover/focusでプリロードし体感速度向上

### 3. サーバーサイドパフォーマンス（高）

- `server-auth-actions` - Server ActionsをAPIルートと同様に認証
- `server-cache-react` - React.cache()でリクエスト単位の重複排除
- `server-cache-lru` - LRUキャッシュでリクエスト間キャッシュ
- `server-dedup-props` - RSC propsでの重複シリアライズを回避
- `server-serialization` - クライアントコンポーネントへのデータ転送を最小化
- `server-parallel-fetching` - コンポーネント構造を変更しフェッチを並列化
- `server-after-nonblocking` - after()で非ブロッキング操作

### 4. クライアントサイドデータフェッチ（中〜高）

- `client-swr-dedup` - SWRで自動リクエスト重複排除
- `client-event-listeners` - グローバルイベントリスナーの重複を排除
- `client-passive-event-listeners` - スクロールにはpassiveリスナー
- `client-localstorage-schema` - localStorageデータをバージョン管理し最小化

### 5. 再レンダリング最適化（中）

- `rerender-defer-reads` - コールバックでのみ使用するstateを購読しない
- `rerender-memo` - 高コスト処理をメモ化コンポーネントに抽出
- `rerender-memo-with-default-value` - デフォルト非プリミティブpropsを巻き上げ
- `rerender-dependencies` - effectsでプリミティブ依存を使用
- `rerender-derived-state` - 生値ではなく派生booleanを購読
- `rerender-derived-state-no-effect` - effectsではなくレンダー中に状態を派生
- `rerender-functional-setstate` - 安定したコールバックのため関数型setStateを使用
- `rerender-lazy-state-init` - 高コスト値にはuseStateに関数を渡す
- `rerender-simple-expression-in-memo` - 単純なプリミティブにmemoは不要
- `rerender-move-effect-to-event` - インタラクションロジックはイベントハンドラに
- `rerender-transitions` - 緊急でない更新にはstartTransition
- `rerender-use-ref-transient-values` - 一時的な頻繁な値にはrefを使用

### 6. レンダリングパフォーマンス（中）

- `rendering-animate-svg-wrapper` - SVG要素ではなくdivラッパーをアニメーション
- `rendering-content-visibility` - 長いリストにはcontent-visibility
- `rendering-hoist-jsx` - 静的JSXをコンポーネント外に抽出
- `rendering-svg-precision` - SVG座標の精度を削減
- `rendering-hydration-no-flicker` - クライアント専用データにはインラインスクリプト
- `rendering-hydration-suppress-warning` - 予期されるミスマッチは抑制
- `rendering-activity` - 表示/非表示にはActivityコンポーネント
- `rendering-conditional-render` - &&ではなく三項演算子を使用
- `rendering-usetransition-loading` - ローディング状態にはuseTransitionを推奨

### 7. JavaScriptパフォーマンス（低〜中）

- `js-batch-dom-css` - CSS変更はクラスまたはcssTextでグループ化
- `js-index-maps` - 繰り返し検索にはMapを構築
- `js-cache-property-access` - ループ内でオブジェクトプロパティをキャッシュ
- `js-cache-function-results` - 関数結果をモジュールレベルMapでキャッシュ
- `js-cache-storage` - localStorage/sessionStorageの読み取りをキャッシュ
- `js-combine-iterations` - 複数のfilter/mapを1ループに統合
- `js-length-check-first` - 高コスト比較の前に配列長をチェック
- `js-early-exit` - 関数から早期リターン
- `js-hoist-regexp` - RegExp生成をループ外に巻き上げ
- `js-min-max-loop` - sortではなくループでmin/maxを計算
- `js-set-map-lookups` - O(1)検索にはSet/Mapを使用
- `js-tosorted-immutable` - 不変性にはtoSorted()を使用

### 8. 高度なパターン（低）

- `advanced-event-handler-refs` - イベントハンドラをrefsに格納
- `advanced-init-once` - アプリ読み込み時に一度だけ初期化
- `advanced-use-latest` - 安定したコールバックrefにuseLatest

## 使用方法

詳細な説明とコード例は個別ルールファイルを参照:

```
rules/async-parallel.md
rules/bundle-barrel-imports.md
```

各ルールファイルには以下を含む:
- 重要な理由の簡潔な説明
- 問題のあるコード例と説明
- 正しいコード例と説明
- 追加コンテキストと参考リンク

## 完全版ドキュメント

全ルールを展開した完全ガイド: `AGENTS.md`