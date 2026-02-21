---
name: performance-review
description: パフォーマンス視点でのコードレビュー。Core Web Vitals、バンドルサイズ、データフェッチ、レンダリング最適化を体系的にチェック。トリガーワード：「パフォーマンスレビュー」「速度改善」「遅い」「重い」「LCP」「CLS」「バンドルサイズ」「performance review」「最適化レビュー」。
---

# パフォーマンスレビュー

## チェックリスト

### 1. Core Web Vitals 影響

- [ ] **LCP**: 最大コンテンツの描画が遅くなる要因がないか
  - 画像に `priority` / `loading="lazy"` が適切に設定されているか
  - フォントの `display: swap` 設定
  - Server Component で取得すべきデータを Client Component で取得していないか
- [ ] **CLS**: レイアウトシフトの原因がないか
  - 画像に `width`/`height` が指定されているか
  - 動的コンテンツの表示領域が事前確保されているか
- [ ] **INP**: インタラクション遅延の原因がないか
  - 重い処理がメインスレッドをブロックしていないか

### 2. Server Components vs Client Components

- [ ] `'use client'` が必要最小限か
- [ ] データフェッチが Server Component 側で行われているか
- [ ] Client Component に渡す props が最小限か（シリアライズコスト）
- [ ] コンポーネントツリーの深い位置で `'use client'` 境界を設定しているか

### 3. データフェッチ

- [ ] N+1 クエリがないか
- [ ] 不要な `.select('*')` がないか（必要カラムのみ select）
- [ ] 並列フェッチ可能なものが `Promise.all` で並列化されているか
- [ ] Supabase クエリに適切なインデックスがあるか
- [ ] `unstable_cache` や `revalidate` の設定が適切か

```bash
# 使用されているSupabaseクエリの一覧
grep -rn "\.from(" --include='*.ts' --include='*.tsx' app/ lib/ | grep -v node_modules
```

### 4. バンドルサイズ

```bash
# ビルドしてバンドル分析
npm run build
# 出力の Route (Pages) セクションを確認
```

- [ ] 大きなライブラリのクライアントインポートがないか
- [ ] dynamic import (`next/dynamic`) で分割すべきコンポーネントがないか
- [ ] barrel export (`index.ts`) が tree-shaking を阻害していないか

### 5. 画像最適化

- [ ] `next/image` を使用しているか
- [ ] Supabase Storage の画像変換を活用しているか
- [ ] 適切なサイズ・フォーマット（WebP/AVIF）で配信しているか

### 6. レンダリング最適化

- [ ] 不要な再レンダリングが発生していないか
  - `useMemo`/`useCallback` が適切に使われているか
  - ただし過度な最適化は避ける
- [ ] リスト表示に `key` が適切に設定されているか
- [ ] 大量リストに仮想化（virtualization）が必要か

### 7. キャッシュ戦略

- [ ] 静的ページと動的ページの区別が適切か
- [ ] `revalidate` の値が適切か
- [ ] CDN キャッシュを活用できるか

## 計測コマンド

```bash
# Lighthouse CI（ローカル）
npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json

# バンドルサイズ詳細
ANALYZE=true npm run build  # next-bundle-analyzer が設定されている場合
```

## レポートフォーマット

```markdown
## パフォーマンスレビュー結果

### サマリー
- 🔴 重大な問題: N件
- 🟡 改善推奨: N件
- 🟢 良好: N項目

### 検出事項

#### [重大] N+1クエリ
- **ファイル**: `app/data/getEvents.ts:15`
- **影響**: ページ読み込み時間 +2秒（推定）
- **修正案**: JOINを使用して1クエリに集約

...

### 推定改善効果
| 項目 | Before | After (推定) |
|------|--------|-------------|
| LCP | 3.2s | 1.8s |
| バンドルサイズ | 450KB | 320KB |
```
