# Comprehensive Testing Strategy - 包括的テスト戦略

プロジェクトの全機能に対する体系的なテスト作成・実行戦略。Testing Brain Data Managementと連携し、テストカバレッジを可視化・追跡します。

## 🎯 3つのユースケース

### 1. 全機能テスト作成・消化
すべての機能、すべてのファイルに対してテストを作成し、実行する。

### 2. スモークテスト（デプロイ前確認）
各機能から代表的なシナリオをユースケースに基づいて抽出し、デプロイ前の動作確認として実行する。

### 3. 関連テスト実行（修正時）
細かい修正箇所に関連する既存テストのみを実行し、リグレッションを防ぐ。

---

## 📊 テストの階層構造（トップダウン）

```
Level 0: プロジェクト全体
  ↓
Level 1: 機能領域（Feature Area）
  ↓
Level 2: ユーザーストーリー/ユースケース
  ↓
Level 3: テストタイプ（E2E, Unit, Component, API, etc.）
  ↓
Level 4: 個別テストケース
```

---

## 🗺️ Level 1: 機能領域の洗い出し

エイサーマップの全機能を以下の7つの機能領域に分類：

### 1. 認証・アカウント管理
- ログイン/ログアウト
- 新規登録
- パスワードリセット
- プロフィール編集
- アカウント設定
- アクセス制御（RBAC）

### 2. イベント管理
- イベント一覧表示（日程タブ）
- イベント詳細表示
- イベント検索・フィルタリング
- イベントCRUD（管理者・主催者）
- イベントプレビュー
- カレンダービュー
- OPEN DAY機能

### 3. 団体管理
- 団体一覧表示（団体タブ）
- 団体詳細表示
- 団体検索・フィルタリング
- 団体CRUD（管理者・団体オーナー）
- 団体パターン表示

### 4. 管理機能
- 管理ダッシュボード
- 会場マスター管理
- 過去会場履歴管理
- 会場リンク管理
- ユーザー管理

### 5. UI/UX機能
- レスポンシブデザイン
- タブ切り替え
- 無限スクロール
- 表示設定（タイル/リスト）
- 戻るボタンナビゲーション
- パンくずリスト

### 6. お問い合わせ
- お問い合わせフォーム送信
- フォームバリデーション

### 7. インフラ・セキュリティ
- APIセキュリティ
- パフォーマンス
- アクセシビリティ（WCAG 2.1 AA）
- SEO

---

## 📝 Level 2: 各機能領域のユーザーストーリー

### 1. 認証・アカウント管理

#### US-1.1: ログイン
**As a** ユーザー
**I want to** メールアドレスとパスワードでログインする
**So that** マイページや管理機能にアクセスできる

**受け入れ条件:**
- 正しい資格情報でログイン成功
- 誤った資格情報でエラー表示
- ログイン後に適切なページにリダイレクト
- セッション維持

#### US-1.2: 新規登録
**As a** 新規ユーザー
**I want to** アカウントを作成する
**So that** エイサーマップの機能を利用できる

**受け入れ条件:**
- メールアドレス、パスワード、名前で登録
- 確認メール送信
- バリデーションエラー表示
- 重複メールアドレス検出

#### US-1.3: パスワードリセット
**As a** ユーザー
**I want to** パスワードを忘れた場合にリセットする
**So that** 再度アクセスできる

**受け入れ条件:**
- メールアドレスでリセットリンク送信
- リセットリンクからパスワード変更
- セキュリティ検証

#### US-1.4: プロフィール編集
**As a** ログインユーザー
**I want to** プロフィール情報を編集する
**So that** 最新の情報を保持できる

**受け入れ条件:**
- 名前、メールアドレス編集
- バリデーション
- 保存成功時のフィードバック

#### US-1.5: アクセス制御
**As a** システム管理者
**I want to** ユーザーの権限に応じて機能を制限する
**So that** セキュアな運用ができる

**受け入れ条件:**
- admin: すべての機能にアクセス
- organizer: 自分のイベント・団体のみ編集
- user: 閲覧のみ
- 未ログイン: 公開情報のみ

---

### 2. イベント管理

#### US-2.1: イベント一覧表示
**As a** 一般ユーザー
**I want to** エイサーイベントの一覧を見る
**So that** 参加したいイベントを探せる

**受け入れ条件:**
- 日程順にイベント表示
- 無限スクロール
- タイル/リスト表示切り替え
- 画像、タイトル、日時、場所表示

#### US-2.2: イベント詳細表示
**As a** 一般ユーザー
**I want to** イベントの詳細情報を見る
**So that** 参加を判断できる

**受け入れ条件:**
- イベント名、日時、場所、説明、画像表示
- 出演団体一覧
- 関連情報へのリンク
- パンくずリスト

#### US-2.3: イベント検索・フィルタリング
**As a** ユーザー
**I want to** イベントを検索・フィルタリングする
**So that** 目的のイベントを素早く見つけられる

**受け入れ条件:**
- 地域フィルター
- 日付範囲フィルター
- キーワード検索
- フィルター組み合わせ
- リアルタイム絞り込み

#### US-2.4: イベントCRUD（管理者・主催者）
**As a** イベント主催者
**I want to** イベント情報を作成・編集・削除する
**So that** 最新のイベント情報を提供できる

**受け入れ条件:**
- イベント作成フォーム
- バリデーション
- 画像アップロード
- プレビュー機能
- 編集・削除権限チェック

#### US-2.5: カレンダービュー
**As a** ユーザー
**I want to** イベントをカレンダー形式で見る
**So that** 月間スケジュールを把握できる

**受け入れ条件:**
- 月間カレンダー表示
- イベントマーカー
- 日付クリックでイベント詳細
- 月切り替え

#### US-2.6: OPEN DAY機能
**As a** ユーザー
**I want to** オープンデイ（一般公開日）を確認する
**So that** 見学可能な日を把握できる

**受け入れ条件:**
- オープンデイフラグ表示
- オープンデイフィルター
- アイコン/バッジ表示

---

### 3. 団体管理

#### US-3.1: 団体一覧表示
**As a** 一般ユーザー
**I want to** エイサー団体の一覧を見る
**So that** 応援したい団体を探せる

**受け入れ条件:**
- 団体カード表示
- 画像、名前、活動地域表示
- 無限スクロール
- タイル/リスト切り替え

#### US-3.2: 団体詳細表示
**As a** 一般ユーザー
**I want to** 団体の詳細情報を見る
**So that** 活動内容を理解できる

**受け入れ条件:**
- 団体名、説明、画像、SNSリンク表示
- 出演予定イベント一覧
- パンくずリスト

#### US-3.3: 団体検索・フィルタリング
**As a** ユーザー
**I want to** 団体を検索・フィルタリングする
**So that** 目的の団体を素早く見つけられる

**受け入れ条件:**
- 地域フィルター
- 団体タイプフィルター（伝統/創作/青年会）
- キーワード検索
- フィルター組み合わせ

#### US-3.4: 団体CRUD（管理者・団体オーナー）
**As a** 団体オーナー
**I want to** 団体情報を作成・編集・削除する
**So that** 最新の活動情報を発信できる

**受け入れ条件:**
- 団体作成フォーム
- バリデーション
- 画像アップロード
- SNS連携
- 編集・削除権限チェック

---

### 4. 管理機能

#### US-4.1: 管理ダッシュボード
**As a** 管理者
**I want to** 管理ダッシュボードにアクセスする
**So that** システム全体を管理できる

**受け入れ条件:**
- admin権限のみアクセス
- イベント・団体・ユーザー統計表示
- 管理機能へのリンク

#### US-4.2: 会場マスター管理
**As a** 管理者
**I want to** 会場マスターを管理する
**So that** 正確な会場情報を維持できる

**受け入れ条件:**
- 会場一覧表示
- 会場追加・編集・削除
- 住所、座標登録
- バリデーション

#### US-4.3: 過去会場履歴管理
**As a** 管理者
**I want to** 過去会場の履歴を管理する
**So that** 会場マスターと紐付けられる

**受け入れ条件:**
- 過去会場一覧表示
- 会場マスターへのリンク
- 確認状態管理
- 一括操作

---

### 5. UI/UX機能

#### US-5.1: レスポンシブデザイン
**As a** モバイルユーザー
**I want to** スマートフォンで快適に閲覧する
**So that** 外出先でも情報を得られる

**受け入れ条件:**
- モバイル（320px〜）でレイアウト崩れなし
- タッチ操作対応
- 読みやすいフォントサイズ

#### US-5.2: タブ切り替え
**As a** ユーザー
**I want to** 日程タブと団体タブを切り替える
**So that** 目的の情報に素早くアクセスできる

**受け入れ条件:**
- タブクリックで即座に切り替え
- URL同期
- アクティブタブ表示

#### US-5.3: 無限スクロール
**As a** ユーザー
**I want to** スクロールで自動的に次のデータを読み込む
**So that** ストレスなく一覧を閲覧できる

**受け入れ条件:**
- スクロール末尾で自動ロード
- ローディング表示
- 最終ページ検出

#### US-5.4: 表示設定
**As a** ユーザー
**I want to** タイル表示とリスト表示を切り替える
**So that** 好みの形式で閲覧できる

**受け入れ条件:**
- 切り替えボタン
- 設定保持（localStorage）
- 即座に反映

---

### 6. お問い合わせ

#### US-6.1: お問い合わせフォーム送信
**As a** ユーザー
**I want to** お問い合わせフォームを送信する
**So that** 運営に連絡できる

**受け入れ条件:**
- 名前、メール、件名、本文入力
- バリデーション
- 送信成功メッセージ
- エラーハンドリング

---

### 7. インフラ・セキュリティ

#### US-7.1: APIセキュリティ
**As a** システム
**I want to** 不正なAPIアクセスを防ぐ
**So that** データを保護できる

**受け入れ条件:**
- RLSポリシー適用
- CSRF対策
- SQLインジェクション対策
- XSS対策

#### US-7.2: パフォーマンス
**As a** ユーザー
**I want to** 高速にページが読み込まれる
**So that** ストレスなく利用できる

**受け入れ条件:**
- LCP < 2.5秒
- FID < 100ms
- CLS < 0.1
- バンドルサイズ最適化

#### US-7.3: アクセシビリティ
**As a** 障害を持つユーザー
**I want to** スクリーンリーダーで利用できる
**So that** 平等に情報にアクセスできる

**受け入れ条件:**
- WCAG 2.1 AA準拠
- キーボード操作可能
- 適切なARIAラベル
- コントラスト比4.5:1以上

---

## 🧪 Level 3: 各ユーザーストーリーのテストタイプマッピング

### テストタイプ一覧

| テストタイプ | 目的 | ツール | 実行タイミング |
|------------|------|--------|--------------|
| **Unit** | 関数・モジュール単体の動作確認 | Jest | コミット前、CI |
| **Component** | Reactコンポーネントの描画・操作確認 | Jest + Testing Library | コミット前、CI |
| **Hook** | カスタムフックのロジック確認 | Jest + Testing Library | コミット前、CI |
| **Integration** | 複数モジュールの連携確認 | Jest | CI |
| **E2E** | エンドツーエンドのユーザーシナリオ確認 | Playwright | デプロイ前、CI |
| **API** | APIエンドポイントの入出力確認 | Jest | CI |
| **Visual** | UI見た目の変更検出 | Storybook Chromatic | PR時 |
| **Accessibility** | アクセシビリティ基準準拠確認 | axe | デプロイ前、CI |
| **Performance** | パフォーマンス指標確認 | Lighthouse | デプロイ前 |
| **Security** | 脆弱性・セキュリティ確認 | npm audit, OWASP | CI、週次 |
| **Smoke** | 主要機能の動作確認（デプロイ後） | Playwright | デプロイ直後 |

### ユーザーストーリー別テストマッピング

#### US-1.1: ログイン
- **E2E**: ログインフォーム入力→送信→リダイレクト
- **Unit**: `loginAction()` の成功/失敗ケース
- **Component**: LoginForm コンポーネントの描画・バリデーション
- **API**: POST /auth/login のレスポンス確認
- **Security**: SQLインジェクション、CSRF対策確認
- **Accessibility**: フォームのARIAラベル、キーボード操作

#### US-1.2: 新規登録
- **E2E**: 登録フォーム入力→送信→確認メール→完了
- **Unit**: `signupAction()` の成功/失敗ケース
- **Component**: SignupForm コンポーネント
- **API**: POST /auth/signup
- **Security**: パスワード強度、XSS対策
- **Accessibility**: フォームアクセシビリティ

#### US-2.1: イベント一覧表示
- **E2E**: ページ読み込み→イベント表示→スクロール→次ページロード
- **Unit**: `getEvents()` データ取得ロジック
- **Component**: EventCard コンポーネント
- **Hook**: useInfiniteScroll フック
- **Performance**: 初期表示速度、LCP
- **Accessibility**: カードのセマンティック構造

#### US-2.3: イベント検索・フィルタリング
- **E2E**: フィルター選択→結果更新→複数フィルター組み合わせ
- **Unit**: フィルターロジック、クエリ生成
- **Component**: FilterPanel コンポーネント
- **Hook**: useEventFilterState フック
- **Integration**: フィルター + データ取得の連携

#### US-3.4: 団体CRUD
- **E2E**: 団体作成→編集→削除→権限チェック
- **Unit**: `createGroup()`, `updateGroup()`, `deleteGroup()` アクション
- **Component**: GroupForm コンポーネント
- **API**: POST/PUT/DELETE /api/groups
- **Security**: 権限チェック、RLS確認

#### US-4.3: 過去会場履歴管理
- **E2E**: 過去会場一覧→会場マスター紐付け→確認状態更新
- **Unit**: `linkVenueMaster()`, `updateConfirmationStatus()` アクション
- **Component**: LocationLinkingTable コンポーネント
- **API**: POST /api/admin/locations/link

#### US-5.1: レスポンシブデザイン
- **E2E**: モバイル（375px）、タブレット（768px）、デスクトップ（1920px）表示確認
- **Visual**: 各ブレークポイントでのスナップショット
- **Accessibility**: モバイルでのタッチ操作、フォントサイズ

#### US-6.1: お問い合わせフォーム
- **E2E**: フォーム入力→送信→成功メッセージ
- **Unit**: フォームバリデーション、送信ロジック
- **Component**: ContactForm コンポーネント
- **API**: POST /api/contact
- **Security**: CSRF、スパム対策

#### US-7.2: パフォーマンス
- **Performance**: Lighthouse CI スコア（90以上）
- **Unit**: キャッシュ戦略、データフェッチ最適化
- **E2E**: ページロード時間計測

---

## 🎬 スモークテストシナリオ（デプロイ前確認）

各機能領域から1つの代表的なユーザーシナリオを抽出し、デプロイ前の動作確認として実行。

### スモークテスト一覧（10シナリオ）

| ID | 機能領域 | シナリオ名 | 実行時間目安 |
|----|---------|-----------|------------|
| ST-1 | 認証 | ユーザーログイン→ログアウト | 30秒 |
| ST-2 | イベント | イベント一覧表示→詳細表示 | 20秒 |
| ST-3 | イベント | イベント検索・フィルタリング | 30秒 |
| ST-4 | 団体 | 団体一覧表示→詳細表示 | 20秒 |
| ST-5 | 管理 | 管理者ログイン→ダッシュボード表示 | 20秒 |
| ST-6 | 管理 | イベントCRUD（作成→編集→削除） | 60秒 |
| ST-7 | UI/UX | タブ切り替え（日程⇔団体） | 10秒 |
| ST-8 | UI/UX | レスポンシブ表示確認（モバイル/デスクトップ） | 20秒 |
| ST-9 | お問い合わせ | お問い合わせフォーム送信 | 30秒 |
| ST-10 | パフォーマンス | ページロード速度確認（LCP < 2.5秒） | 10秒 |

**合計実行時間**: 約4分

### スモークテスト実装場所

```
tests/smoke/
├── auth.smoke.spec.ts          # ST-1
├── events.smoke.spec.ts        # ST-2, ST-3
├── groups.smoke.spec.ts        # ST-4
├── admin.smoke.spec.ts         # ST-5, ST-6
├── ui-ux.smoke.spec.ts         # ST-7, ST-8
├── contact.smoke.spec.ts       # ST-9
└── performance.smoke.spec.ts   # ST-10
```

---

## 🔗 関連テスト実行（修正時）

修正箇所に応じて、関連する既存テストのみを実行するマッピング。

### ファイル別関連テストマッピング

| 修正ファイル | 実行すべき関連テスト |
|------------|---------------------|
| `app/actions/event-actions.ts` | `tests/unit/actions/event-actions.test.ts`<br>`tests/e2e/event-crud.spec.ts`<br>`tests/unit/api/events.test.ts` |
| `app/actions/group-actions.ts` | `tests/unit/actions/group-actions.test.ts`<br>`tests/e2e/group-crud.spec.ts` |
| `lib/data/events.ts` | `tests/unit/lib/data/events.test.ts`<br>`tests/e2e/event-filter.spec.ts`<br>`tests/e2e/calendar-view.spec.ts` |
| `lib/data/groups.ts` | `tests/unit/lib/data/groups.test.ts`<br>`tests/e2e/group-filter.spec.ts` |
| `components/BackButton.tsx` | `tests/e2e/back-button-navigation.spec.ts` |
| `app/(auth)/login/page.tsx` | `tests/e2e/auth/login.spec.ts`<br>`lib/__tests__/auth/login-actions.test.ts` |
| `lib/permissions.ts` | `lib/__tests__/rbac/middleware.test.ts`<br>`tests/e2e/auth/access-control.spec.ts` |
| `lib/supabase/middleware.ts` | `lib/__tests__/auth/supabase-middleware.test.ts`<br>`tests/e2e/auth/access-control.spec.ts` |

### 機能別関連テストマッピング

| 機能修正 | 実行すべきテストスイート |
|---------|----------------------|
| 認証機能 | `tests/e2e/auth/*.spec.ts`<br>`lib/__tests__/auth/*.test.ts`<br>`tests/security/security.test.ts` |
| イベント機能 | `tests/e2e/event-*.spec.ts`<br>`tests/unit/actions/event-actions.test.ts`<br>`tests/unit/lib/data/events.test.ts` |
| 団体機能 | `tests/e2e/group-*.spec.ts`<br>`tests/unit/actions/group-actions.test.ts`<br>`tests/unit/lib/data/groups.test.ts` |
| 管理機能 | `tests/e2e/admin-*.spec.ts`<br>`tests/unit/actions/*-admin-actions.test.ts` |
| フィルター機能 | `tests/e2e/event-filter*.spec.ts`<br>`tests/e2e/group-filter.spec.ts`<br>`tests/unit/hooks/use-event-search-state.test.ts` |

---

## 📋 実行コマンド

### 全テスト実行
```bash
# すべてのテストを実行（Unit + E2E + API + Security）
npm run test:all

# Testing Brainデータ更新
npx tsx scripts/generate-testing-brain-data.ts
```

### テストタイプ別実行
```bash
# Unit tests のみ
npm run test

# Unit tests (カバレッジ付き)
npm run test:coverage

# E2E tests (すべて)
npm run test:e2e

# E2E tests (管理者のみ)
npm run test:e2e:admin

# API tests のみ
npm run test tests/unit/api/

# Security tests
npm run test tests/security/
```

### スモークテスト実行（デプロイ前）
```bash
# スモークテスト実行
npm run test:smoke

# または
npx playwright test tests/smoke/
```

### 関連テスト実行（修正時）
```bash
# 例: イベント機能修正時
npm run test -- event
npx playwright test tests/e2e/event-

# 例: 認証機能修正時
npm run test lib/__tests__/auth/
npx playwright test tests/e2e/auth/
```

---

## 🚀 実装ロードマップ

### Phase 1: 基盤整備（優先度：🔴）
1. **失敗テスト修正**
   - `tests/unit/actions/location-linking-admin-actions.test.ts` の5件修正

2. **スモークテスト実装**
   - 10シナリオのスモークテストを実装
   - デプロイ前チェックリストに組み込み

3. **低カバレッジファイルのUnit test追加**
   - `lib/data/events.ts` （分岐カバレッジ9% → 60%）
   - `lib/permissions.ts` （行カバレッジ13% → 70%）
   - `lib/error-reporting.ts` （行カバレッジ15% → 70%）

**目標カバレッジ（Phase 1終了時）:**
- 行: 75%
- 分岐: 60%
- 関数: 70%

### Phase 2: 主要機能のテスト拡充（優先度：🟡）
4. **E2E tests 実行・品質向上**
   - 既存30件のE2Eテスト実行（現在0%実行率）
   - 品質改善が必要な5件を修正

5. **Component tests 追加**
   - BackButton, GroupCombobox, InfiniteScrollEvents
   - EventCard, GroupCard

6. **Hook tests 追加**
   - useGroupsState, useAuth
   - useInfiniteScroll, useEventSearchState

**目標カバレッジ（Phase 2終了時）:**
- 行: 80%
- 分岐: 70%
- 関数: 80%

### Phase 3: 網羅的テスト（優先度：🟢）
7. **API tests 拡充**
   - 全APIエンドポイント（15件）のテスト作成

8. **Integration tests 追加**
   - 5つの統合テストシナリオ実装

9. **Visual tests 導入**
   - Storybook + Chromatic セットアップ
   - 主要コンポーネントのビジュアルリグレッションテスト

**目標カバレッジ（Phase 3終了時）:**
- 行: 85%
- 分岐: 75%
- 関数: 85%

### Phase 4: 品質保証強化（優先度：🔵）
10. **Accessibility tests 拡充**
    - 全ページのWCAG 2.1 AA準拠確認

11. **Performance tests 実装**
    - Lighthouse CI統合
    - Core Web Vitals モニタリング

12. **Security tests 強化**
    - OWASP Top 10 カバレッジ拡大
    - 定期的な脆弱性スキャン

**目標カバレッジ（Phase 4終了時）:**
- 行: 90%
- 分岐: 80%
- 関数: 90%

---

## 🎯 テスト作成の原則

### 1. テスト駆動開発（TDD）の部分採用
- **新機能**: テストを先に書いてから実装
- **バグ修正**: 再現テストを書いてから修正
- **既存機能**: 後からテストを追加しても良い

### 2. テストの命名規則
```typescript
// Unit test
describe('getEvents', () => {
  it('should return events sorted by start date', async () => {
    // テストコード
  });
});

// E2E test
test('ユーザーはイベント一覧を閲覧できる', async ({ page }) => {
  // テストコード
});
```

### 3. テストデータ準備の原則
- **E2E**: `tests/e2e/fixtures/` にテストデータ定義
- **Unit**: テスト内でモックデータ生成
- **Integration**: Supabase Local Devでシードデータ使用

### 4. テストの独立性
- 各テストは他のテストに依存しない
- 実行順序に関係なく成功する
- テスト後のクリーンアップを忘れない

### 5. アサーションの明確性
```typescript
// ❌ 悪い例
expect(result).toBeTruthy();

// ✅ 良い例
expect(result).toEqual({
  id: 'event-123',
  name: '沖縄全島エイサーまつり',
  start_date: '2025-08-15'
});
```

---

## 📊 Testing Brain連携

このスキル実行後、必ず Testing Brain Data Management スキルを実行して進捗を可視化：

```bash
npx tsx scripts/generate-testing-brain-data.ts
```

`.testing-brain/progress.json` で以下を確認：
- 作成率（creation_rate）
- 消化率（execution_rate）
- 合格率（pass_rate）

---

## 🔧 CI/CD統合

### GitHub Actions ワークフロー

```yaml
name: Test

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:coverage

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  smoke:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:smoke

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit
      - run: npm run test tests/security/
```

---

## 📝 使用タイミング

### 自動発動トリガーワード
- 「テストを作成」「テスト追加」「テストを書いて」
- 「全機能テスト」「包括的テスト」「すべてテスト」
- 「スモークテスト」「デプロイ前確認」「smoke test」
- 「関連テスト実行」「リグレッションテスト」
- 「テストカバレッジ向上」「カバレッジ改善」

### 使用シーン
1. **新機能開発時**: ユーザーストーリーに対応するテストを作成
2. **デプロイ前**: スモークテストを実行
3. **バグ修正時**: 関連テストを実行してリグレッション確認
4. **定期メンテナンス**: カバレッジ向上のためテスト追加

---

## ✅ 成功基準

- [ ] すべてのユーザーストーリーに対応するテストが存在
- [ ] スモークテスト10シナリオが5分以内に完了
- [ ] カバレッジ目標達成（Phase 1: 75%/60%/70%）
- [ ] Testing Brain進捗データが最新
- [ ] CI/CDパイプラインでテスト自動実行
- [ ] デプロイ前チェックリストにスモークテスト組み込み
