# E2Eテスト作成の原則

E2Eテスト作成時に網羅的なテストケースを生成するための指示原則。

## 関連スキル

**テスト実行・デバッグ時は参照:**
- [webapp-testing](webapp-testing/SKILL.md) - Playwright実行方法・デバッグ手法（「どうテストを実行するか」）

**テストデータ・環境問題は参照:**
- [e2e-data-seeding](e2e-data-seeding.md) - テストデータの準備（Supabase seedスクリプト）
- [nextjs-cache-debugging](nextjs-cache-debugging.md) - データ反映されない問題のデバッグ

**状態共有hookの設計・実装:**
- [react-shared-state-hook](react-shared-state-hook.md) - URL/Context同期hookのバグパターンと対策

**⚡ 単一機能テスト完了後に必ずチェーン:**
- [e2e-scenario-tests](e2e-scenario-tests.md) - 横断テスト（シナリオテスト/ユーザージャーニー）

このスキルは「何をテストするか」（単一機能）を扱います。単一機能テスト完了後は必ず`e2e-scenario-tests`にチェーンし、ユーザージャーニーを横断するテストを作成すること。

## 発動条件
- 「E2Eテストを作成」「テストを書いて」「spec.tsを作成」「テスト追加」
- 「網羅的に」「詳細に」「パターンを網羅」
- 「テストが落ちる」「テストを修正」「Playwrightテスト」

---

## テスト作成フロー（必須）

```
1. テスト作成を依頼される
     ↓
2. プランを立てる（EnterPlanMode）
   - 対象機能の理解
   - 既存テストとの重複確認
   - テスト項目リストアップ
     ↓
3. Codexレビュー（プラン）← mcp__codex-mcp__codex
   - テスト観点の網羅性
   - 重複・漏れの確認
     ↓
   ┌─ High/Medium指摘あり → プラン修正 → 3に戻る
   └─ すべてパス → 4へ
     ↓
4. テストコード作成
   - 本スキルの原則に従う
   - セレクタ・待機の確認
     ↓
5. テスト実行
   - npx playwright test {file} --reporter=line
     ↓
   ┌─ 失敗あり → 修正 → 5に戻る
   └─ 全パス → 6へ
     ↓
6. Codexレビュー（テストコード）← mcp__codex-mcp__codex
   - 条件分岐での暗黙的スキップ（if isVisible）
   - テストデータ依存
   - UI変化の検証漏れ
   - a11yテスト不足
     ↓
   ┌─ High/Medium指摘あり → 修正 → 5に戻る
   └─ すべてパス → 7へ
     ↓
7. シナリオテストへチェーン ← e2e-scenario-tests.md
   - ユーザージャーニーの洗い出し
   - 横断テストの作成
     ↓
8. 完了
```

**重要**:
- プランを立てずに実装を始めない
- Codexレビューをパスするまでループする
- 単一機能テスト完了後は必ずシナリオテストにチェーンする

---

## ページ種別ごとの観点

### 一覧ページ
- 初期表示（データあり/なし）
- ページネーション/無限スクロール
- ソート（全オプション、実データで順序検証）
- フィルター（全条件、組み合わせ、リセット）
- 検索（入力、クリア、0件結果）
- カード/行の表示内容（バリエーション）

### 詳細ページ
- データ表示（必須項目、オプション項目あり/なし）
- 画像表示（あり/なし、複数、エラー時）
- 関連リンク（クリック、遷移先）
- アクションボタン（編集、削除、シェア等）
- 戻るボタン/ブレッドクラム

### フォームページ
- 初期値（新規/編集）
- 入力（各フィールド）
- バリデーション（必須、形式、長さ）
- エラーメッセージ表示
- 送信成功/失敗
- キャンセル/リセット

### 認証ページ
- ログイン（成功/失敗/エラー）
- ログアウト
- 権限によるアクセス制御
- リダイレクト

---

## UI要素ごとの操作パターン

### チェックボックス
- ON/OFF両方
- 複数ある場合：1つ、複数、全選択
- 解除：1つずつ、全解除

### 入力フィールド
- 入力→反映、クリア→反映
- 空、空白のみ、長い、特殊文字

### ボタン
- enabled/disabled状態の条件
- クリック後の状態変化
- ダブルクリック防止

### モーダル/ダイアログ
- 開く（トリガー）
- 閉じる（ボタン、外クリック、Escape）
- 確定/キャンセル/変更破棄

### セレクト/ラジオ
- デフォルト選択
- 各選択肢への切り替え
- aria-pressed/checked

### コラプシブル
- 開閉
- 展開時のコンテンツ
- aria-expanded

---

## データ検証の原則

### ソート結果は実データで検証
```
1. 表示されているデータを実際に抽出
2. 順序が正しいか比較（1番目 < 2番目 < 3番目...）
3. 昇順/降順オプションの切り替え
4. 同値の副次ソート
5. フィルター後もソート維持
6. 追加読み込み後もソート維持
```

### フィルター結果は実データで検証
```
1. 該当データのみ表示されているか
2. 非該当データが除外されているか
3. 0件結果の表示
```

### 表示内容のバリエーション
```
1. 必須項目の表示
2. オプション項目あり/なし
3. 画像あり/なし
4. 状態バッジ（終了、更新日時等）
```

---

## 状態永続化

### URL
- パラメータ追加/復元/削除
- 不正パラメータの扱い
- エンコーディング

### localStorage/sessionStorage
- 保存/復元/クリア
- URL優先

### ブラウザ履歴
- バック/フォワードで維持

---

## 複合条件

- 2つの組み合わせ（A+B, A+C, B+C...）
- 全条件同時適用
- 全条件リセット
- リロード後復元

---

## 複数UI領域からの状態同期テスト

**重要**: URL/Context/localStorageで状態を共有する機能は、異なるUI領域からの操作で状態が正しく同期されるかテストする。

### 典型的なバグパターン

```
モーダルで設定A追加 → 設定A削除 → モーダル外で設定B変更 → 設定Aが復活
```

これは**複数のhookインスタンスが独立した状態を持つ**ことで発生する。

### 必須テストパターン

#### 1. 異なるUI領域からの操作の組み合わせ

```typescript
test('モーダル操作後にモーダル外操作で状態が復活しない', async ({ page }) => {
  // 1. モーダルで設定を追加
  await openFilterModal(page)
  await selectGroup(page, 'グループA')
  await applyFilters(page)
  await expect(page).toHaveURL(/groups=123/)

  // 2. モーダルで設定を削除
  await openFilterModal(page)
  await unselectGroup(page, 'グループA')
  await applyFilters(page)
  await expect(page).not.toHaveURL(/groups=123/)

  // 3. モーダル外のUI要素を操作
  await page.getByRole('checkbox', { name: '古い順' }).click()
  await expect(page).toHaveURL(/oldest=true/)

  // 4. 削除した設定が復活していないことを確認（これが重要）
  await expect(page).not.toHaveURL(/groups=123/)
})
```

#### 2. 状態変更の連鎖テスト

```typescript
test('設定A追加→A削除→B変更→Aが復活しない', async ({ page }) => {
  // 設定の追加・削除・別設定の変更を連鎖させる
  // 各ステップで削除した設定が復活しないことを確認
})
```

#### 3. hookの使用箇所を確認してテスト設計

```bash
# テスト対象のhookがどこで使用されているか確認
grep -r "useEventSearchState" app/ --include="*.tsx"
```

複数箇所で使用されている場合は、各コンポーネントからの操作を組み合わせてテストする。

### チェックリスト

- [ ] モーダル操作 + モーダル外操作の組み合わせ
- [ ] ヘッダー操作 + コンテンツ内操作の組み合わせ
- [ ] 設定追加→削除→別設定変更→削除した設定が復活しない
- [ ] 共有hookの使用箇所を把握してテスト設計

### 関連スキル

- [react-shared-state-hook](react-shared-state-hook.md) - 共有状態hookの設計・実装パターン

---

## 連続操作での状態持続性テスト

**重要**: 単一操作のテストだけでは検出できないバグがある。特に「操作A → 操作B → 状態が壊れる」パターン。

### 典型的なバグパターン

```
includePast有効 → スクロール → 別フィルター変更 → スクロール位置リセット
```

これは**useMemoの参照等価性**問題で発生することが多い：

```typescript
// ❌ バグ：毎回新しい空配列が生成される
const filteredInitialEvents = useMemo(() => {
  if (includePastEvents) {
    return []  // ← 毎回新しい参照、子コンポーネントのuseEffectが発火
  }
  return filterEvents(upcomingEvents)
}, [filterEvents, ...])  // filterEventsが変わると[]も新しくなる

// ✅ 修正：安定した参照を使う
const EMPTY_EVENTS = useMemo(() => [], [])
const filteredInitialEvents = useMemo(() => {
  if (includePastEvents) {
    return EMPTY_EVENTS  // ← 常に同じ参照
  }
  return filterEvents(upcomingEvents)
}, [EMPTY_EVENTS, filterEvents, ...])
```

### 必須テストパターン

#### 1. 状態変更→スクロール→別の状態変更

```typescript
test('includePast有効時に他フィルター変更してもスクロール状態が維持される', async ({ page }) => {
  // 1. includePast有効化
  await openFilterModal(page)
  await page.getByRole('checkbox', { name: /過去のイベント/ }).check()
  await applyFilters(page)

  // 2. ある程度スクロール（20件以上読み込む）
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
  }
  const loadedCount = await page.locator('[data-testid="event-card"]').count()
  expect(loadedCount).toBeGreaterThan(20)

  // 3. 別のフィルター変更（sortOldestFirstなど）
  await page.getByRole('checkbox', { name: /古い順/ }).click()

  // 4. スクロール状態がリセットされていないか確認
  await page.waitForTimeout(500)
  const afterCount = await page.locator('[data-testid="event-card"]').count()
  expect(afterCount).toBeGreaterThan(0)  // 完全リセットされていないこと
})
```

#### 2. 無限スクロールの完了確認

```typescript
test('includePast有効時に無限スクロールが完了する', async ({ page }) => {
  await page.goto('/date?includePast=true')

  // 最後までスクロール（hasMore=falseになるまで）
  let prevCount = 0
  let attempts = 0
  const maxAttempts = 50  // 安全弁

  while (attempts < maxAttempts) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    const currentCount = await page.locator('[data-testid="event-card"]').count()
    if (currentCount === prevCount) {
      // 件数が増えなくなった = 完了
      break
    }
    prevCount = currentCount
    attempts++
  }

  // 無限ループでなければmaxAttemptsに達していない
  expect(attempts).toBeLessThan(maxAttempts)
})
```

### チェックリスト

- [ ] 状態A有効 → スクロール → 状態B変更 → スクロール位置維持
- [ ] 無限スクロールが実際に完了する（hasMore=falseでループ終了）
- [ ] useMemoで空配列を返すケースは安定した参照を使用

### 関連スキル

- [react-shared-state-hook](react-shared-state-hook.md) - useMemoの参照等価性問題

---

## エッジケース

### 入力
- 極端に長い、特殊文字、XSS攻撃文字列

### ID/パラメータ
- 存在しないID、不正形式、負の値、極大値

### 選択
- 全選択、全除外

---

## タイミング・競合

- ローディング中の操作
- 高速連打、ダブルクリック
- ページ遷移→戻る

---

## アクセシビリティ

- キーボード操作（Tab, Enter, Space, Escape）
- aria属性（role, label, pressed, expanded, current）
- ラベル関連付け

---

## レスポンシブ

- モバイル幅での表示
- タッチ操作
- スクロール

---

## コンポーネント構造の確認

### セレクタを書く前に実装を確認する

同じ名前・似た役割でも、コンポーネントによってHTML構造が異なる:

```
❌ 問題パターン
- event-card: 団体名が <a href="/groups/..."> リンク
- event-card-horizontal: 団体名が <span> テキスト
→ a[href^="/groups/"] セレクタは event-card でしか動かない
```

### 確認手順

1. **対象コンポーネントのソースを読む**
   ```bash
   # コンポーネントファイルを特定
   grep -r "data-testid=\"event-card-horizontal\"" app/
   ```

2. **条件付きレンダリングを確認**
   ```typescript
   // 団体がある場合のみ表示される部分
   {groupsDisplay && (
     <span className="text-gray-700 truncate">{groupsDisplay}</span>
   )}
   ```

3. **適切なセレクタを選択**
   ```typescript
   // ❌ リンクベース（コンポーネントに依存）
   const groupLinks = card.locator('a[href^="/groups/"]')

   // ✅ 要素の存在ベース（実装を確認した上で）
   const groupSection = card.locator('span.text-gray-700.truncate')
   const hasGroups = await groupSection.count() > 0
   ```

### 複数コンポーネントのパターン

| ビュー | コンポーネント | 団体表示 |
|--------|---------------|---------|
| 一覧（カード） | event-card | リンク |
| 一覧（横型） | event-card-horizontal | テキスト |
| 詳細 | event-detail | カード+リンク |

---

## ネットワーク

- ローディング表示
- 成功/失敗フィードバック
- 0件/空状態

---

## 指示テンプレート

```
[機能名]のE2Eテストを作成して。

以下の観点で網羅的にテストケースを作成：
- UI要素ごとの操作パターン（ON/OFF、選択/解除、入力/クリア）
- 状態永続化（URL、localStorage、ブラウザ履歴）
- ソート・フィルター結果の実データ検証
- 複合条件の組み合わせ
- データ表示のバリエーション（あり/なし）
- エッジケース（不正入力、極端な値、XSS）
- タイミング・競合（ローディング中、高速連打）
- アクセシビリティ（キーボード、aria属性）

Codexレビューをパスするまで続けて。
```

---

## Codexレビュー対策

### 基本ルール
1. Role-basedセレクタを優先（CSS セレクタ避ける）
2. 固定タイムアウト（waitForTimeout）を使わない
3. 明示的な待機（toBeVisible、waitForURL）を使用
4. テストの独立性を確保（beforeEachでストレージクリア）
5. テスト説明は日本語で明確に
6. アサーションは具体的に（曖昧な条件を避ける）

### よくある指摘と対策

| 指摘 | 問題 | 対策 |
|------|------|------|
| Silent skips | `if (isVisible())` で要素がなければ偽パス | `expect().toBeVisible()` で明示的に待機、または `test.skip()` |
| Data-dependent | 実データに依存してテストが不安定 | テストデータをseedで準備、または特定IDをハードコード |
| URL only check | URLだけ確認してUI変化を見ていない | UI要素（月表示、選択状態）も確認 |
| No change verify | 変更前後の差分を確認していない | 変更前の値を取得→操作→変更後と比較 |
| Shallow coverage | 表示確認のみでトリガー動作を確認していない | スクロール・クリックなどの操作を実行 |
| Minimal a11y | aria属性チェックが不足 | キーボード操作、aria-current、フォーカス管理をテスト |

### Codexレビュー実行方法

```typescript
// Codex MCPを使用
mcp__codex-mcp__codex({
  prompt: "Review tests/e2e/{file}.spec.ts for test coverage, best practices, and accessibility",
  cwd: "/path/to/project"
})
```

### レビュー結果の対応
- **High**: 必ず修正（偽パス、カバレッジ欠落）
- **Medium**: 可能な限り修正（検証不足、a11y）
- **Low**: 検討（パフォーマンス、スタイル）

---

## ⚠️ 実装前検証：データフロー追跡

### なぜ必要か

テストを書く前に**実装のデータフローを理解していないと、間違ったアサーションを書く**。

例：「古い順」テストで新しいものがトップにあるのを正しいと思い込む。

### 実装前の確認ステップ

```
1. DBのデータを直接確認
   PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres \
     -c "SELECT id, title, created_at FROM table ORDER BY id;"

2. 取得処理のorder()を確認
   grep -n "order(" lib/data/xxx.ts

3. 表示処理のsort/reverseを確認
   grep -n "sort\|reverse" app/xxx/component.tsx

4. デフォルト値を確認
   grep -n "useState" app/xxx/component.tsx | grep -i sort
```

### テスト作成時のチェックリスト

#### ソート機能テスト
- [ ] 実際のDBデータの順序を確認したか
- [ ] 取得処理のorder()を確認したか
- [ ] 表示処理のsort/reverseを確認したか
- [ ] **期待値が正しいことをDBデータで検証したか**

#### boolean | null フィールドテスト
- [ ] 三値（true/false/null）すべてのテストケースがあるか
- [ ] **null時の期待表示をUI実装から確認したか**
- [ ] falseとnullで異なる表示になることを確認したか

### 典型的な失敗パターン

```typescript
// ❌ 危険：期待値を確認せずに書いたテスト
test('古い順で表示される', async ({ page }) => {
  // 実際は取得時に新しい順なので、このテストは偽パス
  await expect(firstItem).toContainText('動画1')
})

// ✅ 正しい：DBデータを確認してから期待値を決定
// 1. DBで created_at の順序を確認
// 2. 取得処理の order() を確認
// 3. 期待値を決定
test('古い順で表示される', async ({ page }) => {
  // DBの created_at 昇順で動画1が先頭であることを確認済み
  await expect(firstItem).toContainText('動画1')
})
```
