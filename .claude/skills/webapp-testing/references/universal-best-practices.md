# Playwright 普遍的ベストプラクティス & アンチパターン

## 📋 概要

このドキュメントは、Playwrightテスト作成における**普遍的な原則とベストプラクティス**をまとめたものです。
プロジェクト固有の問題は [Playwrightテスト作成ベストプラクティス.md](./Playwrightテスト作成ベストプラクティス.md) を参照してください。

**対象**: すべてのPlaywrightテスト作成者
**最終更新**: 2025-11-09

---

## ■ Playwright の思想（Foundational Concepts）

* 現実に近いブラウザ操作を安定して自動化することを目的とする
* デフォルトで **auto-waiting**, **deterministic**, **isolation**, **multi-browser** を重視
* テストは「速い・安定・再現・観測可能」であることが重要
* セレクタは **意味的（Role/Label/TestId）** を基本にする設計思想

---

## ■ 最重要原則（5つ）

### 1. auto-waiting を信頼する

Playwrightは自動的に要素が準備できるまで待機します。固定待機（`waitForTimeout`）は避けましょう。

```typescript
// ❌ 避けるべき
await page.waitForTimeout(2000);
await page.click('button');

// ✅ 推奨
await page.getByRole('button', { name: 'Submit' }).click();
```

### 2. 意味ベースのセレクタを使う

CSSセレクタではなく、ユーザーが要素を認識する方法（Role/Label/TestId）でセレクタを書きます。

```typescript
// ❌ 避けるべき
await page.click('.btn-primary:nth-child(3)');

// ✅ 推奨
await page.getByRole('button', { name: '購入' }).click();
await page.getByLabel('メールアドレス').fill('user@example.com');
await page.getByTestId('submit-button').click();
```

### 3. テストを短く・独立させる

1テスト1目的、順序依存を避け、完全に独立したテストを作成します。

```typescript
// ❌ 避けるべき：順序依存
test('ユーザー作成', async ({ page }) => {
  // テスト1の結果がテスト2の前提になる
});
test('ユーザー編集', async ({ page }) => {
  // テスト1で作成したユーザーを編集
});

// ✅ 推奨：完全独立
test('ユーザー作成', async ({ page }) => {
  // セットアップから完結
});
test('ユーザー編集', async ({ page }) => {
  // 自分でユーザーを作成してから編集
});
```

### 4. 環境を固定し再現性を担保する

ロケール・タイムゾーン・権限を固定し、変動要因を排除します。

```typescript
// playwright.config.ts
use: {
  locale: 'ja-JP',
  timezoneId: 'Asia/Tokyo',
  permissions: ['geolocation'],
}
```

### 5. 常に可観測性を確保する

失敗時の証拠を常に収集できるようにします。

```typescript
// playwright.config.ts
use: {
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

---

## ■ ベストプラクティス

### 1. セレクタ / 待機

#### 推奨セレクタの優先順位

1. **`getByRole`**: 最優先（アクセシビリティにも貢献）
2. **`getByLabel`**: フォーム要素
3. **`getByTestId`**: 上記で特定できない場合
4. **`getByText`**: 固有のテキスト
5. CSS/XPath: 最終手段

```typescript
// ✅ 推奨順
await page.getByRole('button', { name: '送信' }).click();
await page.getByLabel('パスワード').fill('password123');
await page.getByTestId('custom-widget').click();
await page.getByText('エラーが発生しました').isVisible();
```

#### 自動待機の活用

```typescript
// ❌ 避けるべき
await page.waitForSelector('.loading');
await page.waitForTimeout(2000);

// ✅ 推奨
await expect(page.getByRole('progressbar')).toBeHidden();
await expect(page.getByText('読み込み完了')).toBeVisible();
```

#### locatorの優先

```typescript
// ❌ 避けるべき
await page.click('button');

// ✅ 推奨
const button = page.getByRole('button', { name: 'Submit' });
await button.click();
```

---

### 2. テスト設計（Small, Independent, Intent-Driven）

#### 1テスト1目的

```typescript
// ❌ 避けるべき：長すぎる漫遊テスト
test('ユーザー管理機能全体', async ({ page }) => {
  // ログイン
  // ユーザー作成
  // ユーザー編集
  // ユーザー削除
  // ... 50行以上
});

// ✅ 推奨：明確な目的
test('ユーザー作成ができる', async ({ page }) => {
  // ユーザー作成のみテスト
});
test('ユーザー編集ができる', async ({ page }) => {
  // ユーザー編集のみテスト
});
```

#### 完全独立

```typescript
// ❌ 避けるべき：固定データIDで競合
test('商品1を購入', async ({ page }) => {
  await page.goto('/products/1');
  await page.getByRole('button', { name: '購入' }).click();
});

// ✅ 推奨：テストごとにデータ作成
test('商品を購入', async ({ page }) => {
  const productId = await createTestProduct();
  await page.goto(`/products/${productId}`);
  await page.getByRole('button', { name: '購入' }).click();
});
```

#### 認証の再利用（storageState）

```typescript
// ❌ 避けるべき：毎回UIログイン
test('ダッシュボード閲覧', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.goto('/dashboard');
});

// ✅ 推奨：storageStateで再利用
// auth.setup.ts
test('認証', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.context().storageState({ path: 'auth.json' });
});

// テストで利用
test.use({ storageState: 'auth.json' });
test('ダッシュボード閲覧', async ({ page }) => {
  await page.goto('/dashboard'); // 既にログイン済み
});
```

---

### 3. アーキテクチャ（Fixtures / POM / Projects）

#### Fixtures で副作用を隔離

```typescript
// fixtures.ts
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await use(page);
  },
});

// テスト
test('ダッシュボード閲覧', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
});
```

#### Page Object Model (POM)

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.getByLabel('メールアドレス').fill(email);
    await this.page.getByLabel('パスワード').fill(password);
    await this.page.getByRole('button', { name: 'ログイン' }).click();
  }
}

// テスト
test('ログイン', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('user@example.com', 'password123');
});
```

#### Projects でデバイス管理

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
    { name: 'Tablet', use: { ...devices['iPad Pro'] } },
  ],
});
```

---

### 4. ネットワーク / API

#### APIモック

```typescript
// ✅ 外部依存を排除
test('商品一覧表示', async ({ page }) => {
  await page.route('/api/products', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify([
        { id: 1, name: 'テスト商品' }
      ]),
    });
  });
  await page.goto('/products');
});
```

#### 障害ケースのテスト

```typescript
// ✅ エラーケースを再現
test('APIエラー時の表示', async ({ page }) => {
  await page.route('/api/products', route => {
    route.fulfill({ status: 500, body: 'Internal Server Error' });
  });
  await page.goto('/products');
  await expect(page.getByText('エラーが発生しました')).toBeVisible();
});
```

---

### 5. 可観測性（Debuggability）

#### trace / screenshot / video の設定

```typescript
// playwright.config.ts
use: {
  trace: 'on-first-retry',        // リトライ時にtraceを記録
  screenshot: 'only-on-failure',  // 失敗時のみスクリーンショット
  video: 'retain-on-failure',     // 失敗時のみビデオ保存
}
```

#### ローカルデバッグ

```bash
# UIモード
npx playwright test --ui

# デバッグモード
npx playwright test --debug

# Trace Viewer
npx playwright show-trace trace.zip
```

#### MCP Playwrightでの原因調査

ユーザーから不具合の原因調査を依頼された場合、**必ずブラウザを開いて目視確認できる状態**で調査する。

```bash
# ❌ 避けるべき：ヘッドレスで実行
npx playwright test tests/e2e/auth/logout.spec.ts

# ✅ 推奨：ブラウザを開いて確認
npx playwright test tests/e2e/auth/logout.spec.ts --headed

# ✅ さらに推奨：デバッグモードで詳細確認
npx playwright test tests/e2e/auth/logout.spec.ts --headed --debug
```

**MCP Playwrightツールを使う場合も同様**：
- `browser_navigate`でページを開く
- `browser_snapshot`でDOM状態を確認
- `browser_console_messages`でJSログ/エラーを確認
- `browser_take_screenshot`で視覚的に確認

**デバッグ時の確認ポイント**：
1. コンソールエラー/警告をチェック（特に`aria-hidden`関連）
2. ネットワークリクエストの成功/失敗
3. DOM状態の変化タイミング
4. イベントハンドラの発火順序

---

### 6. CI / スケール

#### 並列・シャーディング・リトライ

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 4 : undefined,  // CI で並列実行
  retries: process.env.CI ? 2 : 0,          // CI でリトライ

  // シャーディング
  // npx playwright test --shard=1/3
});
```

#### 段階的テスト戦略

```bash
# PR: 軽量Smoke Suite
npm run test:smoke

# 本番: 回帰テスト
npm run test:regression

# 夜間: 重テスト
npm run test:full
```

---

## ■ アンチパターン（避けるべきパターン）

### 1. セレクタ / 同期

| アンチパターン | 理由 |
|--------------|------|
| `waitForTimeout` による固定待機 | 不安定・遅い・メンテナンス困難 |
| CSS nth-child セレクタ | DOM構造変更で壊れやすい |
| 深い CSS セレクタ | 可読性・保守性が低い |
| テキスト依存セレクタ | 多言語化で壊れる |
| `page.waitForSelector` 乱用 | locator で置き換え可能 |

### 2. テスト構造

| アンチパターン | 理由 |
|--------------|------|
| 1本のE2Eが長すぎる | 失敗箇所の特定が困難 |
| 順序依存テスト | 並列実行不可・デバッグ困難 |
| 毎回UIログイン | 遅い・不安定 |
| 固定データID使い回し | 並列実行で競合 |

### 3. 再現性欠如

| アンチパターン | 理由 |
|--------------|------|
| ロケール未固定 | 環境依存で不安定 |
| タイムゾーン未固定 | 時刻依存テストで失敗 |
| PC Chromeのみ | 実デバイスと乖離 |

### 4. 観測性欠如

| アンチパターン | 理由 |
|--------------|------|
| trace/video未収集 | デバッグ困難 |
| ログのみでデバッグ | 原因特定に時間がかかる |

---

## ■ 代表的な悪い例と良い例

### 例1: セレクタ

```typescript
// ❌ アンチパターン
await page.click('.btn-primary:nth-child(3)');

// ✅ ベストプラクティス
await page.getByRole('button', { name: '購入' }).click();
```

### 例2: 待機

```typescript
// ❌ アンチパターン
await page.waitForTimeout(2000);
await page.click('button');

// ✅ ベストプラクティス
const button = page.getByRole('button', { name: 'Submit' });
await expect(button).toBeEnabled();
await button.click();
```

### 例3: テスト独立性

```typescript
// ❌ アンチパターン：順序依存
test('ユーザー作成', async ({ page }) => { /* ... */ });
test('ユーザー編集', async ({ page }) => {
  // 前のテストで作成したユーザーを前提
});

// ✅ ベストプラクティス：完全独立
test('ユーザー編集', async ({ page }) => {
  const userId = await createTestUser(); // 自分で作成
  await page.goto(`/users/${userId}/edit`);
});
```

---

## ■ 品質チェックリスト

新しいテスト作成時の必須確認項目：

- [ ] 意味ベースのセレクタ（Role/Label/TestId）を使用している
- [ ] 固定待機（waitForTimeout）が存在しない
- [ ] locator + expect による同期になっている
- [ ] 認証は storageState を使用し、UI ログインを毎回行わない
- [ ] POM で DOM 詳細からテストを分離
- [ ] `projects` でデバイス行列管理
- [ ] `route()` によるモックを導入
- [ ] trace/video/screenshot/HAR を CI で保存
- [ ] テストは短く独立／フレークがない
- [ ] CI は並列/リトライ/シャーディングが設定されている

---

## 🔗 関連ドキュメント

- [Playwrightテスト作成ベストプラクティス](./Playwrightテスト作成ベストプラクティス.md) - プロジェクト固有の問題
- [Playwright公式ドキュメント](https://playwright.dev/)
- [Playwrightベストプラクティス（公式）](https://playwright.dev/docs/best-practices)

---

**作成日**: 2025-11-09
**バージョン**: 1.0.0
**カテゴリ**: テスト, ベストプラクティス
