# Playwrightテスト作成ベストプラクティス

## 📋 概要

このドキュメントは、エイサーマップ プロジェクトでPlaywrightを使用したE2Eテストを作成する際のベストプラクティスと、よくある問題の解決方法をまとめたものです。

**対象読者**: テスト作成者、Claude Code
**最終更新**: 2025-11-09

---

## ⚠️ 重要：このドキュメントの位置づけ

**このドキュメントは、プロジェクト固有の制約に対する「一時的な回避策」を記載しています。**

### 📚 ドキュメントの読み方

```
1. Playwright普遍的ベストプラクティス.md（理想・原則）
   ↓ まず理解する
2. このドキュメント（プロジェクト固有の制約・回避策）
   ↓ なぜ原則と異なるのかを理解する
3. Playwrightテスト改善ロードマップ.md（将来的な改善計画）
   ↓ いつ原則に戻すかを確認する
```

### 🎯 このドキュメントの目的

- **短期的**: 現状の制約下でテストを成功させる方法を提供
- **長期的**: 制約を解消し、普遍的原則に従えるよう改善する

### ⚠️ 重要な注意

**普遍的原則との矛盾がある場合**:
1. ✅ まず「なぜこの矛盾が存在するのか」を理解する
2. ✅ 根本的な解決策を検討する
3. ⚠️ 即座の解決が困難な場合のみ、このドキュメントの回避策を使用
4. 📝 将来的な改善計画を記録する（改善ロードマップ）

### 📝 例：waitForTimeoutの使用

**状況**:
- 普遍的原則: 「`waitForTimeout`を避ける」（理想）
- **このドキュメント**: 管理画面アクセス時は `waitForTimeout(1000)` が**一時的に必須**（現実）

**なぜ矛盾するのか**:
1. Supabaseセッション確立に時間がかかる
2. Server Componentの初期化が遅い
3. getUserPermissions が2秒タイムアウト設定

**根本的な解決策（将来）**:
- getUserPermissionsの最適化
- storageStateによる認証再利用（フェーズ3）
- セッション確立の仕組み改善

**現状の判断**:
- **一時的に** `waitForTimeout(1000)` を使用
- 改善ロードマップに将来的な解決策を記録済み
- テストの成功を優先（実測で1秒必要と検証済み）

**この回避策は永続的ではない**: フェーズ3で storageState 認証再利用を実装する際に削除予定

---

## 🎯 基本原則

### 1. テスト実行モード

**必須**: テストは**シーケンシャル実行**を基本とする

```typescript
// ❌ 悪い例：並列実行（デフォルト）
test.describe('管理者フロー', () => {
  test('テスト1', async ({ page }) => { /* ... */ });
  test('テスト2', async ({ page }) => { /* ... */ });
});

// ✅ 良い例：シーケンシャル実行
test.describe.configure({ mode: 'serial' });

test.describe('管理者フロー', () => {
  test('テスト1', async ({ page }) => { /* ... */ });
  test('テスト2', async ({ page }) => { /* ... */ });
});
```

**理由**:
- 並列実行時、Supabaseの認証セッションが競合する
- データベースアクセスで競合状態が発生する
- テスト間でクッキーやセッション状態が干渉する

---

## 🔐 認証テストのベストプラクティス

### 2. ログイン処理の待機時間

**重要**: ログイン後は十分な待機時間を確保する

```typescript
// helpers/smoke-auth.ts
export async function loginAs(page: Page, role: TestRole) {
  const account = TEST_ACCOUNTS[role];

  await page.goto('/login');
  await page.fill('input[name="email"]', account.email);
  await page.fill('input[name="password"]', account.password);
  await page.click('button[type="submit"]');

  // ❌ 不十分な待機
  await page.waitForURL(/^(?!.*\/login)/);

  // ✅ 正しい待機
  await page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });
  await page.waitForLoadState('load', { timeout: 10000 });
  await page.waitForTimeout(2000); // 認証セッション確立のための待機
}
```

**待機が必要な理由**:
1. Supabaseクライアントがセッションクッキーを設定する
2. クライアントコンポーネントが認証状態を取得する
3. Server Componentが次のリクエストでセッションを読み取れるようになる

---

### 3. 管理画面アクセスの待機

```typescript
test('管理者が管理画面にアクセスできる', async ({ page }) => {
  await loginAs(page, 'admin');

  // ❌ 不十分な待機
  await page.goto('/admin/groups');
  await expect(page).toHaveURL('/admin/groups');

  // ✅ 正しい待機
  await page.waitForTimeout(1000); // セッション確立を待つ
  await page.goto('/admin/groups', { waitUntil: 'load' });
  await page.waitForTimeout(1000); // レンダリング完了を待つ
  await expect(page).toHaveURL('/admin/groups', { timeout: 10000 });
});
```

**`waitUntil` オプションの使い分け**:
- **`'load'`**: 基本的な読み込み完了（推奨）
- **`'networkidle'`**: 全ネットワーク処理完了（遅い、タイムアウトしやすい）
- **`'domcontentloaded'`**: DOM構築完了（早すぎる場合がある）

---

## 🖱️ UI操作のベストプラクティス

### 4. ボタンクリックの処理

Radix UIなどのコンポーネントライブラリを使用している場合、通常のクリックがタイムアウトすることがあります。

```typescript
// ❌ タイムアウトする可能性
await page.getByRole('button', { name: '新規団体作成' }).click();

// ✅ 強制クリック + 長めのタイムアウト
await page.getByRole('button', { name: '新規団体作成' }).click({ force: true });
await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
```

**`force: true` を使うべき場面**:
- ダイアログを開くボタン
- モーダルのトリガー
- アニメーション中の要素

---

### 5. ダイアログ・モーダルの待機

```typescript
// ボタンクリック
await page.getByRole('button', { name: '新規作成' }).click({ force: true });

// ダイアログ表示を待機
await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });

// ダイアログ内の要素にアクセス
const dialog = page.getByRole('dialog');
await dialog.locator('input[name="name"]').fill('テスト');
```

---

## 🚨 よくある問題と解決方法

### 問題1: ログイン後に管理画面にアクセスできない

**症状**:
```
Expected: "http://localhost:3000/admin/groups"
Received: "http://localhost:3000/login?next=%2Fadmin%2Fgroups"
```

**原因**:
- Server Componentが認証セッションを読み取れていない
- `getUserPermissions` がタイムアウトまたはエラーを返している

**解決方法**:
```typescript
// ログイン後の待機時間を増やす
await loginAs(page, 'admin');
await page.waitForTimeout(2000); // 1000ms → 2000ms

// ページ遷移前にも待機
await page.goto('/admin/groups', { waitUntil: 'load' });
await page.waitForTimeout(1000);
```

---

### 問題2: 並列実行時のみ失敗する

**症状**:
- 単独実行（`test.only`）では成功
- 全テスト実行時には失敗

**原因**:
- テスト間で認証セッションが干渉している
- データベース競合

**解決方法**:
```typescript
// シーケンシャル実行に変更
test.describe.configure({ mode: 'serial' });
```

---

### 問題3: トーストメッセージが表示されない

**症状**:
```
Error: 団体作成の成功トーストメッセージが表示されませんでした
```

**原因**:
- Server Actionの実行が遅い
- 並列実行時のデータベース競合

**解決方法**:
```typescript
// タイムアウトを長めに設定
const toastVisible = await page
  .getByText('団体を作成しました')
  .isVisible({ timeout: 5000 }) // 3000ms → 5000ms
  .catch(() => false);

// さらに、シーケンシャル実行を使用
test.describe.configure({ mode: 'serial' });
```

---

### 問題4: ボタンクリック後のダイアログが開かない

**症状**:
```
TimeoutError: locator.click: Timeout 5000ms exceeded
```

**原因**:
- Radix UIなどのコンポーネントが非同期で初期化される
- クリック可能になる前にクリックしようとしている

**解決方法**:
```typescript
// force: true を使用
await page.getByRole('button', { name: 'ボタン' }).click({ force: true });

// または、明示的に待機
await page.getByRole('button', { name: 'ボタン' }).waitFor({ state: 'visible' });
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'ボタン' }).click();
```

---

## 📝 テスト作成チェックリスト

新しいテストを作成する際は、以下を確認してください：

### 必須チェック項目

- [ ] `test.describe.configure({ mode: 'serial' })` を追加
- [ ] ログイン後に `await page.waitForTimeout(2000)` を追加
- [ ] ページ遷移時に `{ waitUntil: 'load' }` を使用
- [ ] ダイアログ・モーダルのクリックに `{ force: true }` を使用
- [ ] 非同期処理の待機に十分なタイムアウト（10秒以上）を設定

### 推奨チェック項目

- [ ] 単独実行（`test.only`）で成功することを確認
- [ ] 全テスト実行で成功することを確認
- [ ] スクリーンショット・動画を確認して失敗原因を特定
- [ ] エラーメッセージを明確にする

---

## 🔧 デバッグ方法

### 1. UIモードで実行

```bash
npm run test:e2e:ui
```

ブラウザでテストを確認しながら実行でき、各ステップの状態を確認できます。

---

### 2. デバッグモード

```bash
npm run test:e2e:debug
```

ステップ実行でテストをデバッグできます。

---

### 3. スクリーンショット確認

テスト失敗時、自動的にスクリーンショットと動画が保存されます：

```
test-results/
├── [テスト名]-chromium/
│   ├── test-failed-1.png    # 失敗時のスクリーンショット
│   ├── video.webm            # テスト実行動画
│   └── error-context.md      # エラーコンテキスト
```

---

### 4. ヘッドモード（ブラウザ表示）

```bash
npm run test:e2e:headed
```

ブラウザを表示しながらテストを実行し、動作を目視確認できます。

---

## 📊 パフォーマンス最適化

### 待機時間の最適化

不要な待機は避けつつ、必要な待機は確保します：

```typescript
// ❌ 過剰な待機
await page.waitForTimeout(5000);

// ✅ 必要最小限の待機
await page.waitForLoadState('load');
await page.waitForTimeout(1000); // Server Componentの初期化

// ✅ 条件付き待機
await page.waitForSelector('text=読み込み中', { state: 'hidden' });
```

---

### ネットワーク待機の使い分け

```typescript
// 高速だが、不安定な場合がある
await page.goto('/path', { waitUntil: 'load' });

// 安定だが、遅い
await page.goto('/path', { waitUntil: 'networkidle' });

// 推奨：load + 固定待機
await page.goto('/path', { waitUntil: 'load' });
await page.waitForTimeout(1000);
```

---

## 🎓 学習リソース

### 公式ドキュメント
- [Playwright公式ドキュメント](https://playwright.dev/)
- [Playwrightベストプラクティス](https://playwright.dev/docs/best-practices)

### プロジェクト内ドキュメント
- [スモークテスト実行ガイド](./スモークテスト実行ガイド.md)
- [開発アカウント管理ガイド](../開発ガイドライン/開発アカウント管理ガイド.md)
- [テスト戦略ガイド](../実装ガイド/テスト戦略ガイド.md)

---

## 📌 まとめ

### 最重要ポイント

1. **シーケンシャル実行**: `test.describe.configure({ mode: 'serial' })`
2. **十分な待機時間**: ログイン後2秒、ページ遷移後1秒
3. **強制クリック**: ダイアログ・モーダルのボタンには `{ force: true }`
4. **長めのタイムアウト**: 非同期処理には10秒以上

### トラブルシューティングフロー

```
テスト失敗
  ↓
単独実行（test.only）で試す
  ↓
成功 → シーケンシャル実行に変更
失敗 → スクリーンショット確認
  ↓
  ├─ ログインページ → 待機時間を増やす
  ├─ ダイアログ未表示 → force: true を追加
  └─ エラー表示 → Server Actionのログ確認
```

---

**作成日**: 2025-11-09
**バージョン**: 1.0.0
**メンテナ**: Claude Code
