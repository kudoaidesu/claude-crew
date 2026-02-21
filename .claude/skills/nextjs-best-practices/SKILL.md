---
name: nextjs-best-practices
description: Next.js App Routerの原則。Server Components、データフェッチ、ルーティングパターン。トリガーワード：「実装して」「機能を追加」「ページを作成」「コンポーネントを作って」「API作成」「ルーティング」「Server Component」「Client Component」「データフェッチ」「feat:」「feature:」。実装作業全般で参照。
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Next.js ベストプラクティス

> Next.js App Router開発の原則

---

## 1. Server vs Client Components

### 判断ツリー

```
必要なのは...?
│
├── useState, useEffect, イベントハンドラ
│   └── Client Component ('use client')
│
├── 直接データフェッチ、インタラクティブ性なし
│   └── Server Component (デフォルト)
│
└── 両方?
    └── 分割: Serverの親 + Clientの子
```

### デフォルトの使い分け

| タイプ | 用途 |
|--------|------|
| **Server** | データフェッチ、レイアウト、静的コンテンツ |
| **Client** | フォーム、ボタン、インタラクティブUI |

---

## 2. データフェッチパターン

### フェッチ戦略

| パターン | 用途 |
|----------|------|
| **Default** | 静的（ビルド時キャッシュ） |
| **Revalidate** | ISR（時間ベース更新） |
| **No-store** | 動的（毎リクエスト） |

### データフロー

| ソース | パターン |
|--------|----------|
| データベース | Server Componentでフェッチ |
| API | キャッシュ付きfetch |
| ユーザー入力 | Client state + Server Action |

---

## 3. ルーティング原則

### ファイル規約

| ファイル | 目的 |
|----------|------|
| `page.tsx` | ルートUI |
| `layout.tsx` | 共有レイアウト |
| `loading.tsx` | ローディング状態 |
| `error.tsx` | エラー境界 |
| `not-found.tsx` | 404ページ |

### ルート構成

| パターン | 用途 |
|----------|------|
| ルートグループ `(name)` | URLに影響なく整理 |
| パラレルルート `@slot` | 同レベルの複数ページ |
| インターセプト `(.)` | モーダルオーバーレイ |

---

## 4. APIルート

### ルートハンドラ

| メソッド | 用途 |
|----------|------|
| GET | データ読み取り |
| POST | データ作成 |
| PUT/PATCH | データ更新 |
| DELETE | データ削除 |

### ベストプラクティス

- Zodで入力バリデーション
- 適切なステータスコードを返す
- エラーを適切に処理
- 可能ならEdge runtimeを使用

---

## 5. パフォーマンス原則

### 画像最適化

- next/imageコンポーネントを使用
- ファーストビューにはpriorityを設定
- ブラープレースホルダーを提供
- レスポンシブsizesを使用

### バンドル最適化

- 重いコンポーネントには動的インポート
- ルートベースのコード分割（自動）
- バンドルアナライザーで分析

---

## 6. メタデータ

### 静的 vs 動的

| タイプ | 用途 |
|--------|------|
| 静的export | 固定メタデータ |
| generateMetadata | ルートごとの動的生成 |

### 必須タグ

- title (50-60文字)
- description (150-160文字)
- Open Graph画像
- Canonical URL

---

## 7. キャッシュ戦略

### キャッシュレイヤー

| レイヤー | 制御 |
|----------|------|
| リクエスト | fetchオプション |
| データ | revalidate/tags |
| フルルート | route config |

### 再検証

| 方法 | 用途 |
|------|------|
| 時間ベース | `revalidate: 60` |
| オンデマンド | `revalidatePath/Tag` |
| キャッシュなし | `no-store` |

---

## 8. Server Actions

### ユースケース

- フォーム送信
- データミューテーション
- 再検証トリガー

### ベストプラクティス

- 'use server'でマーク
- すべての入力をバリデーション
- 型付きレスポンスを返す
- エラーを処理

---

## 9. アンチパターン

| ❌ やってはいけない | ✅ やるべき |
|--------------------|------------|
| どこでも'use client' | デフォルトはServer |
| Client Componentでfetch | Serverでfetch |
| ローディング状態をスキップ | loading.tsxを使用 |
| エラー境界を無視 | error.tsxを使用 |
| 大きなClientバンドル | 動的インポート |

---

## 10. プロジェクト構造

```
app/
├── (marketing)/     # ルートグループ
│   └── page.tsx
├── (dashboard)/
│   ├── layout.tsx   # ダッシュボードレイアウト
│   └── page.tsx
├── api/
│   └── [resource]/
│       └── route.ts
└── components/
    └── ui/
```

---

## 11. URL状態管理（useSearchParams問題）

### 問題: router.replace() のレースコンディション

`useSearchParams` + `router.replace()` でURL状態を管理する場合、**サーバーラウンドトリップ（200-500ms）** によりReact状態とURLが競合する。

```
❌ 問題パターン:
setState(newState)  ──→ 即座に完了
router.replace(url) ──→ サーバー往復で遅延
                         ↓
useEffect([searchParams]) ──→ 遅れて発火、古い状態に戻す
```

### 解決アプローチ

| アプローチ | 推奨度 | 説明 |
|-----------|--------|------|
| **nuqs ライブラリ** | ⭐⭐⭐ | URL状態管理専用。最も安定 |
| **pushState + PopStateEvent** | ⭐⭐ | 即時更新。回避策だが実用的 |
| **useOptimistic (React 19)** | ⭐⭐ | UI先行更新。公式パターン |

### pushState パターン（回避策）

```typescript
const updateState = useCallback((newState: State) => {
  // 1. フラグで逆同期を防止
  isUpdatingFromCode.current = true

  // 2. 状態を即座に更新
  setState(newState)

  // 3. URL更新（サーバーラウンドトリップなし）
  const url = serializeToUrl(newState)
  window.history.pushState({ source: 'myHook' }, '', url)

  // 4. Next.jsのuseSearchParamsに通知
  window.dispatchEvent(new PopStateEvent('popstate', {
    state: { source: 'myHook' }
  }))
}, [])

// useEffect で逆同期をブロック
useEffect(() => {
  if (isUpdatingFromCode.current) {
    isUpdatingFromCode.current = false
    return  // プログラムからの更新時はスキップ
  }
  // ブラウザバック/フォワード時のみ反映
  setState(deserializeFromUrl(searchParams))
}, [searchParams])
```

### 注意点

- `router.replace()` は非同期でサーバーラウンドトリップを伴う
- `pushState` は即時だがブラウザ履歴に追加される
- 将来のNext.jsバージョンで動作が変わる可能性あり
- 本番では `nuqs` ライブラリの採用を検討

---

---

## 12. 実装前の設計検証

### 設計の精度チェック

実装を始める前に以下を確認：

| チェック項目 | 確認方法 |
|--------------|----------|
| 具体例を3つ挙げられる？ | 入力 → 期待する出力を明示 |
| エッジケースを説明できる？ | 複数選択、空データ、境界値 |
| 代替案と比較できる？ | なぜこの方法がベストか |

**「たぶん動く」と言いそうになったら、テストケースを書く。**

### データ設計の必須確認

```
❌ フラット配列: ["1", "2", "3", "1", "7"]
   → どの要素が同じグループか分からない

✅ 構造化配列: [["1", "2"], ["3"], ["1", "7"]]
   → 各サブ配列が1単位（例: 1イベントの出演者）
```

確認ポイント：
1. **情報の欠落がないか** - 集約後に関係性を復元できる？
2. **ユースケースの網羅** - 単一/複数選択、フィルター組み合わせ
3. **テストケースで検証** - エッジケースで期待通り動く？

### 足踏み時のアプローチ（順番に試す）

```
1. ユーザーに質問 → 「この場合どうなるべき？」
2. Codexに聞く → 別視点・アイデアを得る
   - モデル: gpt-5.2-codex, reasoning: high（必ず最初）
   - 解決できなければ reasoning: x-high にエスカレート
3. テストケースを書く → 入力/出力を3パターン
4. 図で整理 → データフロー、Before/After
5. WEB検索 → 類似問題の解決策
6. 小さく実装して検証 → DBクエリだけ先に試す
```

---

> **覚えておくこと:** Server Componentsがデフォルトなのには理由がある。まずそこから始め、必要な時だけClientを追加。