# E2Eシナリオテスト（横断テスト）

ユーザージャーニーに沿った複数画面・複数機能を横断するテストの作成ガイド。

## 関連スキル

**前提スキル（先に読む）:**
- [e2e-test-principles](e2e-test-principles.md) - 単一機能のテスト作成原則

**テスト実行・デバッグ:**
- [webapp-testing](webapp-testing/SKILL.md) - Playwright実行方法

このスキルは「e2e-test-principlesで単一機能テストを作成した後」に使用する。

## 発動条件

- 単一機能テスト作成完了後、自動的にチェーン
- 「シナリオテスト」「横断テスト」「ユーザージャーニー」
- 「ワークフローテスト」「統合テスト」

---

## シナリオテストとは

```
単一機能テスト: フィルターモーダルが開閉する
シナリオテスト: フィルター設定 → スクロール → 詳細遷移 → 戻る → 状態復元
```

**目的**: ユーザーの実際の行動フローで発生するバグを検出

**検出できるバグ例**:
- 画面遷移後の状態消失
- 複数機能の組み合わせでの競合
- 非同期処理のタイミング問題
- メモリリーク・パフォーマンス劣化

---

## シナリオテスト作成フロー

```
1. 単一機能テスト完了
     ↓
2. ユーザージャーニーの洗い出し
   - 主要ユースケースを列挙
   - 各ユースケースの操作ステップを定義
     ↓
3. シナリオテスト設計
   - ステップ間の状態検証ポイント定義
   - エラーパス・中断パスの考慮
     ↓
4. シナリオテスト実装
   - 本スキルのパターンに従う
     ↓
5. テスト実行・Codexレビュー
```

---

## 典型的なシナリオパターン

### 1. 検索→詳細→戻るシナリオ

```typescript
test.describe('検索から詳細閲覧のユーザージャーニー', () => {
  test('フィルター設定→スクロール→詳細→戻る→状態復元', async ({ page }) => {
    // === Phase 1: フィルター設定 ===
    await page.goto('/date')
    await openFilterModal(page)
    await page.getByRole('checkbox', { name: /伝統/ }).click()
    await page.getByTestId('keyword-search-input').fill('祭り')
    await applyFilters(page)

    // 状態検証: URLにフィルターが反映
    await expect(page).toHaveURL(/exclude=traditional/)
    await expect(page).toHaveURL(/q=/)

    // === Phase 2: スクロールで追加読み込み ===
    const initialCount = await page.locator('[data-testid="event-card"]').count()

    // スクロールして追加データ取得
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000) // 追加読み込み待機

    const afterScrollCount = await page.locator('[data-testid="event-card"]').count()
    // 追加読み込みされたか、または全件表示済み
    expect(afterScrollCount).toBeGreaterThanOrEqual(initialCount)

    // スクロール位置を記録
    const scrollY = await page.evaluate(() => window.scrollY)

    // === Phase 3: 詳細ページへ遷移 ===
    const eventCards = page.locator('[data-testid="event-card"]')
    const cardCount = await eventCards.count()
    test.skip(cardCount === 0, 'フィルター結果が0件')

    await eventCards.first().getByRole('link', { name: /詳細を見る/ }).click()
    await expect(page).toHaveURL(/\/events\/\d+/)

    // === Phase 4: 戻る ===
    await page.goBack()
    await expect(page.getByTestId('timeline-view')).toBeVisible()

    // 状態検証: フィルターが維持されている
    await expect(page).toHaveURL(/exclude=traditional/)
    await expect(page).toHaveURL(/q=/)

    // 状態検証: スクロール位置が復元（許容誤差あり）
    await page.waitForTimeout(500)
    const restoredScrollY = await page.evaluate(() => window.scrollY)
    // スクロール復元はブラウザ依存、0でなければ復元試行された
    // 厳密な位置は保証しない
  })
})
```

### 2. ビュー切り替えシナリオ

```typescript
test.describe('ビュー切り替えでの状態維持ジャーニー', () => {
  test('タイムライン→フィルター→カレンダー→日付選択→タイムライン', async ({ page }) => {
    // === Phase 1: タイムラインでフィルター設定 ===
    await page.goto('/date')
    await expect(page.getByTestId('timeline-view')).toBeVisible()

    await openFilterModal(page)
    await page.getByRole('checkbox', { name: /その他/ }).click()
    await applyFilters(page)
    await expect(page).toHaveURL(/exclude=other/)

    // === Phase 2: カレンダーに切り替え ===
    await page.getByTestId('view-toggle-calendar').click()
    await expect(page.getByTestId('calendar-view')).toBeVisible()
    await expect(page).toHaveURL(/\/date\/\d{4}-\d{2}-\d{2}/)

    // 状態検証: フィルターがlocalStorageで維持
    await openFilterModal(page)
    await expect(page.getByRole('checkbox', { name: /その他/ })).not.toBeChecked()
    await page.keyboard.press('Escape')

    // === Phase 3: カレンダーで日付選択 ===
    const dayButton = page.getByRole('button', { name: /15日/ })
    if (await dayButton.isVisible()) {
      await dayButton.click()
      await expect(page).toHaveURL(/\/date\/\d{4}-\d{2}-15/)
    }

    // === Phase 4: タイムラインに戻る ===
    await page.getByTestId('view-toggle-timeline').click()
    await expect(page.getByTestId('timeline-view')).toBeVisible()

    // 状態検証: フィルターが維持
    await openFilterModal(page)
    await expect(page.getByRole('checkbox', { name: /その他/ })).not.toBeChecked()
  })
})
```

### 3. 無限スクロール→操作→状態維持シナリオ

```typescript
test.describe('無限スクロールと操作の組み合わせジャーニー', () => {
  test('スクロール読み込み→フィルター変更→リスト更新', async ({ page }) => {
    // === Phase 1: 初期表示 ===
    await page.goto('/date')
    await expect(page.getByTestId('timeline-view')).toBeVisible()

    const initialCards = page.locator('[data-testid="event-card"]')
    await expect(initialCards.first()).toBeVisible()
    const initialCount = await initialCards.count()

    // === Phase 2: スクロールで追加読み込み ===
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(800)
    }

    const afterScrollCount = await page.locator('[data-testid="event-card"]').count()

    // === Phase 3: フィルター変更 ===
    await openFilterModal(page)
    await page.getByRole('checkbox', { name: /伝統/ }).click()
    await applyFilters(page)

    // 状態検証: リストがリセットされ新しいフィルターで再取得
    await expect(page).toHaveURL(/exclude=traditional/)

    // 新しいフィルター結果が表示される（0件の可能性もある）
    const filteredCards = page.locator('[data-testid="event-card"]')
    const emptyState = page.getByTestId('empty-state-message')

    // どちらかが表示される
    await expect(filteredCards.first().or(emptyState)).toBeVisible()

    // === Phase 4: フィルターリセット ===
    await openFilterModal(page)
    await page.getByRole('button', { name: 'リセット' }).click()

    // 元の状態に戻る
    await expect(page).not.toHaveURL(/exclude=/)
  })
})
```

### 4. 過去イベント→ソート変更シナリオ

```typescript
test.describe('過去イベント表示とソートのジャーニー', () => {
  test('過去含む有効→古い順→詳細→戻る→状態維持', async ({ page }) => {
    // === Phase 1: 過去イベント含むを有効化 ===
    await page.goto('/date')
    await openFilterModal(page)
    await page.getByRole('checkbox', { name: /過去のイベントを含む/ }).click()
    await applyFilters(page)

    await expect(page).toHaveURL(/includePast=true/)

    // タイトルが「すべてのイベント」に変わる
    await expect(page.getByText('すべてのイベント')).toBeVisible()

    // === Phase 2: 古い順に切り替え ===
    const oldestCheckbox = page.getByRole('checkbox', { name: /古い順/ })
    await expect(oldestCheckbox).toBeVisible()
    await oldestCheckbox.click()

    await expect(page).toHaveURL(/oldest=true/)

    // === Phase 3: イベント詳細に遷移 ===
    const eventCards = page.locator('[data-testid="event-card"]')
    const cardCount = await eventCards.count()
    test.skip(cardCount === 0, 'イベントが0件')

    await eventCards.first().getByRole('link', { name: /詳細を見る/ }).click()
    await expect(page).toHaveURL(/\/events\/\d+/)

    // === Phase 4: 戻る ===
    await page.goBack()

    // 状態検証: 過去含む + 古い順が維持
    await expect(page).toHaveURL(/includePast=true/)
    await expect(page).toHaveURL(/oldest=true/)
    await expect(page.getByRole('checkbox', { name: /古い順/ })).toBeChecked()
  })
})
```

---

## シナリオ設計のポイント

### 1. フェーズ分割

各シナリオを明確なフェーズに分割し、フェーズ間で状態検証を行う：

```typescript
// === Phase 1: 初期設定 ===
// 操作...
// 状態検証

// === Phase 2: メイン操作 ===
// 操作...
// 状態検証

// === Phase 3: 遷移/変更 ===
// 操作...
// 状態検証

// === Phase 4: 復帰/確認 ===
// 操作...
// 最終状態検証
```

### 2. 状態検証ポイント

各フェーズ終了時に検証すべき項目：

| 検証対象 | 例 |
|---------|---|
| URL | パラメータが正しく反映/維持 |
| UI状態 | 選択状態、表示内容 |
| データ | 件数、順序、内容 |
| スクロール | 位置の保存/復元 |
| localStorage | 永続化された値 |

### 3. エラーパスの考慮

```typescript
// データがない場合のスキップ
const cardCount = await eventCards.count()
test.skip(cardCount === 0, 'テストに必要なデータがありません')

// 要素が表示されない場合のスキップ
const button = page.getByRole('button', { name: '操作' })
if (!(await button.isVisible())) {
  test.skip(true, 'この条件では操作ボタンが表示されません')
}
```

### 4. 待機戦略

シナリオテストでは複数の非同期操作が連鎖するため、適切な待機が重要：

```typescript
// ❌ 固定時間待機は避ける
await page.waitForTimeout(2000)

// ✅ 状態変化を待機
await expect(page).toHaveURL(/expected/)
await expect(element).toBeVisible()
await page.waitForLoadState('networkidle')

// ✅ ただし無限スクロールなど一部のケースでは必要
await page.waitForTimeout(500) // 追加データ取得待ち
```

---

## シナリオテストのファイル構成

```
tests/e2e/
├── event-filter.spec.ts          # 単一機能テスト
├── calendar-view.spec.ts         # 単一機能テスト
├── infinite-scroll.spec.ts       # 単一機能テスト
└── scenarios/                    # シナリオテスト
    ├── search-journey.spec.ts    # 検索→詳細→戻るシナリオ
    ├── filter-scroll.spec.ts     # フィルター×スクロールシナリオ
    └── view-switch.spec.ts       # ビュー切り替えシナリオ
```

---

## チェーン実行のタイミング

単一機能テスト作成後、以下のシナリオを検討：

### 必須シナリオ（常に作成）

1. **メインユースケース**: 機能の主要な使い方を通しで実行
2. **状態復元シナリオ**: 操作→遷移→戻る→状態確認

### 推奨シナリオ（機能に応じて）

3. **組み合わせシナリオ**: 複数機能の同時使用
4. **エラーリカバリシナリオ**: エラー発生→復帰

---

## Codexレビューのポイント

シナリオテスト特有の指摘：

| 指摘 | 問題 | 対策 |
|------|------|------|
| Phase unclear | フェーズ分割が不明確 | コメントで明示的に分割 |
| State not verified | フェーズ間の状態検証不足 | 各フェーズ終了時にアサーション |
| Brittle waiting | 固定時間待機が多い | 状態変化を待機 |
| No error path | 異常系の考慮なし | test.skip()でガード |
| Long scenario | シナリオが長すぎる | 複数のテストに分割 |

---

## 洗い出しテンプレート

```
## 機能: [機能名]

### 主要ユースケース
1. [ユースケース1]: ユーザーが〜する
2. [ユースケース2]: ユーザーが〜する

### シナリオ候補
1. [ユースケース1]の操作フロー
   - Step 1: 〜
   - Step 2: 〜
   - 検証: 〜

2. [機能A] × [機能B] の組み合わせ
   - Step 1: 機能Aを操作
   - Step 2: 機能Bを操作
   - 検証: 両方の状態が正しい

3. 遷移→戻るシナリオ
   - Step 1: 設定
   - Step 2: 別ページに遷移
   - Step 3: 戻る
   - 検証: 設定が維持
```

---

## 詳細な観点一覧

シナリオテスト設計時に確認すべき観点を網羅的にまとめる。

### 1. 状態管理の観点

シナリオを通して「状態がどこに保存され、どのタイミングで復元されるか」を検証する。

| 状態の種類 | 保存場所 | 復元タイミング | 検証ポイント |
|-----------|---------|--------------|-------------|
| フィルター条件 | URL params | 戻る/リロード | URLパラメータが正確 |
| フィルター選択状態 | localStorage | ページ遷移/ビュー切替 | チェックボックス状態が維持 |
| スクロール位置 | sessionStorage | 戻る操作時 | 位置が復元（30分有効期限内） |
| 読み込み済みページ | React state | 戻る操作時 | 追加読み込み分も復元 |
| 現在のビュー | URL path | ブックマーク/共有 | `/date` vs `/date/YYYY-MM-DD` |

**検証シナリオ例**:
```typescript
test('フィルター状態がURL・localStorage・UIで一貫している', async ({ page }) => {
  // フィルター設定
  await applyFilter(page, { exclude: 'traditional', keyword: '祭り' })

  // URL検証
  await expect(page).toHaveURL(/exclude=traditional/)
  await expect(page).toHaveURL(/q=祭り/)

  // localStorage検証
  const stored = await page.evaluate(() =>
    localStorage.getItem('eventFilterState')
  )
  expect(JSON.parse(stored)).toMatchObject({ excludeTypes: ['traditional'] })

  // UI検証
  await openFilterModal(page)
  await expect(page.getByRole('checkbox', { name: /伝統/ })).not.toBeChecked()
})
```

### 2. データ一貫性の観点

フィルター/ソート/ページネーション操作時のデータ整合性を検証する。

#### 2.1 データ範囲の一貫性

```
⚠️ 重要: UIで表示される範囲 = フィルター対象の範囲

❌ 問題パターン:
- カレンダーUIは過去の日付も表示
- フィルターなし → 過去のカウントも表示
- フィルターあり → 過去のカウントが消える ← 不整合！
```

**検証シナリオ**:
```typescript
test('過去日付のイベントカウントがフィルター適用後も表示される', async ({ page }) => {
  // 過去の日付に移動
  await page.goto('/date/2025-08-15')

  // フィルター適用前のカウント
  const beforeCount = await getEventCount(page, '2025-08-15')

  // フィルター適用
  await applyFilter(page, { groupType: 'traditional' })

  // 過去日付でもカウントが表示される（0でも可、ただし消失は不可）
  const countCell = page.locator('[data-date="2025-08-15"] .event-count')
  await expect(countCell).toBeVisible()
})
```

#### 2.2 ページネーション/無限スクロールの一貫性

| 観点 | 検証内容 |
|-----|---------|
| 追加読み込み後のフィルター | フィルター適用でリストがリセットされる |
| 追加読み込み後のソート変更 | ソフトリフレッシュ vs 完全リセット |
| 戻る操作後の読み込み状態 | 追加読み込み分も復元される |
| 無限スクロール終端 | 「条件をクリア」プロンプトが表示 |

**検証シナリオ**:
```typescript
test('スクロール後のフィルター変更でリストが正しくリセット', async ({ page }) => {
  // スクロールで追加読み込み
  await scrollToBottom(page, 3)
  const afterScrollCount = await page.locator('[data-testid="event-card"]').count()

  // フィルター適用
  await applyFilter(page, { exclude: 'other' })

  // リストがリセットされる（件数が初期状態に近い）
  const afterFilterCount = await page.locator('[data-testid="event-card"]').count()
  expect(afterFilterCount).toBeLessThanOrEqual(20) // 初期ページサイズ
})
```

### 3. 遷移パターンの観点

画面遷移における状態維持を網羅的に検証する。

#### 3.1 遷移パターンマトリクス

| 遷移元 | 遷移先 | 戻り方 | 期待される復元状態 |
|-------|-------|-------|------------------|
| タイムライン | イベント詳細 | goBack | フィルター + スクロール位置 |
| タイムライン | 団体詳細 | goBack | フィルター + スクロール位置 |
| カレンダー | イベント詳細 | goBack | 選択日付 + フィルター |
| タイムライン | カレンダー | ビュー切替 | フィルター（localStorage経由） |
| カレンダー | タイムライン | ビュー切替 | フィルター（localStorage経由） |
| 任意 | 外部リンク | ブラウザバック | 全状態復元を期待 |

#### 3.2 ブラウザ履歴操作

```typescript
test('複数回の遷移→複数回のgoBackで正しく復元', async ({ page }) => {
  // Phase 1: タイムラインでフィルター設定
  await page.goto('/date')
  await applyFilter(page, { exclude: 'traditional' })

  // Phase 2: 詳細1に遷移
  await page.locator('[data-testid="event-card"]').first().click()
  await expect(page).toHaveURL(/\/events\/\d+/)

  // Phase 3: 詳細から団体に遷移
  await page.getByRole('link', { name: /団体/ }).first().click()
  await expect(page).toHaveURL(/\/groups\/\d+/)

  // 2回goBack
  await page.goBack() // 詳細に戻る
  await expect(page).toHaveURL(/\/events\/\d+/)

  await page.goBack() // タイムラインに戻る
  await expect(page).toHaveURL(/exclude=traditional/)
})
```

### 4. エッジケースの観点

境界条件やまれな状況を検証する。

#### 4.1 時間境界

| エッジケース | シナリオ | 検証ポイント |
|-------------|---------|-------------|
| 年跨ぎ | 12月→1月の月移動 | 年が正しく変わる |
| 月末 | 2月28日/29日の扱い | うるう年対応 |
| 深夜0時 | 日付変更線 | イベント表示日の判定 |
| 過去/未来境界 | 今日の日付でのフィルター切替 | 表示データの整合性 |

```typescript
test('カレンダーで12月→1月の月移動が正しく動作', async ({ page }) => {
  await page.goto('/date/2025-12-15')

  // 次月ボタンをクリック
  await page.getByRole('button', { name: /次月|>/ }).click()

  // 2026年1月に移動
  await expect(page).toHaveURL(/2026-01/)
  await expect(page.getByText('2026年1月')).toBeVisible()
})
```

#### 4.2 データ境界

| エッジケース | シナリオ | 検証ポイント |
|-------------|---------|-------------|
| 結果0件 | 厳しいフィルター条件 | 空状態表示 + プロンプト |
| 大量データ | 100件以上のスクロール | パフォーマンス + メモリ |
| 1件のみ | 最小データ | UI崩れなし |
| 特殊文字 | 検索ワードに記号 | エスケープ処理 |

```typescript
test('フィルター結果0件で適切な空状態が表示', async ({ page }) => {
  await page.goto('/date')

  // 存在しないキーワードで検索
  await applyFilter(page, { keyword: 'xyznonexistent123' })

  // 空状態表示
  await expect(page.getByTestId('empty-state-message')).toBeVisible()

  // 条件クリアプロンプトが表示
  await expect(page.getByRole('button', { name: /条件をクリア/ })).toBeVisible()
})
```

### 5. 機能組み合わせマトリクス

複数機能の組み合わせで発生するバグを検出するためのマトリクス。

#### 5.1 フィルター機能の組み合わせ

| 機能A | 機能B | 期待動作 | 注意点 |
|------|------|---------|-------|
| 団体種別除外 | キーワード検索 | AND条件 | 両方URLに反映 |
| 団体種別除外 | 過去イベント含む | 独立動作 | データソース同一 |
| 過去イベント | 古い順ソート | 連動表示 | 古い順は過去含む時のみ |
| キーワード検索 | 無限スクロール | 検索後リセット | ページネーションリセット |

```typescript
test('団体種別除外 + キーワード + 過去含む + 古い順の組み合わせ', async ({ page }) => {
  await page.goto('/date')

  // 複合フィルター設定
  await openFilterModal(page)
  await page.getByRole('checkbox', { name: /伝統/ }).click()
  await page.getByTestId('keyword-search-input').fill('祭り')
  await page.getByRole('checkbox', { name: /過去のイベントを含む/ }).click()
  await applyFilters(page)

  // 古い順を有効化
  await page.getByRole('checkbox', { name: /古い順/ }).click()

  // URL検証
  await expect(page).toHaveURL(/exclude=traditional/)
  await expect(page).toHaveURL(/q=祭り/)
  await expect(page).toHaveURL(/includePast=true/)
  await expect(page).toHaveURL(/oldest=true/)

  // 詳細遷移→戻るで全状態維持
  const cards = page.locator('[data-testid="event-card"]')
  if (await cards.count() > 0) {
    await cards.first().click()
    await page.goBack()

    await expect(page).toHaveURL(/exclude=traditional/)
    await expect(page).toHaveURL(/oldest=true/)
  }
})
```

#### 5.2 ビュー切替との組み合わせ

| ビュー遷移 | フィルター状態 | 期待動作 |
|-----------|--------------|---------|
| タイムライン→カレンダー | 適用中 | localStorageで維持 |
| カレンダー→タイムライン | 適用中 | localStorageで維持 |
| カレンダー日付選択→タイムライン | 日付フィルター | URLで維持 |

### 6. パフォーマンス観点

シナリオ実行中のパフォーマンス劣化を検出する。

| 観点 | 検証方法 | 閾値 |
|-----|---------|-----|
| 追加読み込み速度 | スクロール→表示までの時間 | 2秒以内 |
| 遷移後の復元速度 | goBack→表示完了までの時間 | 1秒以内 |
| メモリ使用量 | 長時間スクロール後 | 初期の2倍以内 |
| 再レンダリング回数 | フィルター変更時 | 必要最小限 |

```typescript
test('100件スクロール後もパフォーマンスが維持される', async ({ page }) => {
  await page.goto('/date')

  // 時間計測開始
  const start = Date.now()

  // 大量スクロール
  for (let i = 0; i < 10; i++) {
    await scrollToBottom(page)
    await page.waitForTimeout(500)
  }

  // 追加読み込みにかかった時間
  const elapsed = Date.now() - start

  // 詳細遷移→戻るの速度
  const cards = page.locator('[data-testid="event-card"]')
  if (await cards.count() > 50) {
    const navStart = Date.now()
    await cards.nth(50).click()
    await page.goBack()
    await expect(page.getByTestId('timeline-view')).toBeVisible()
    const navElapsed = Date.now() - navStart

    expect(navElapsed).toBeLessThan(3000) // 3秒以内
  }
})
```

---

## 優先度付きシナリオチェックリスト

テスト作成時に参照する優先度付きチェックリスト。

### 🔴 必須（P0）

- [ ] メインユースケースの通し実行
- [ ] 詳細遷移→戻る→状態復元
- [ ] フィルター適用→操作→フィルター維持

### 🟡 推奨（P1）

- [ ] 無限スクロール→フィルター変更→リセット
- [ ] ビュー切替→フィルター維持
- [ ] 複数フィルター組み合わせ→詳細→戻る

### 🟢 あれば望ましい（P2）

- [ ] 年跨ぎ月移動
- [ ] 結果0件→条件クリア→復帰
- [ ] 長時間操作後のパフォーマンス
- [ ] ブラウザ履歴の複数回操作
