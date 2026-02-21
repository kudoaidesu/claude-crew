# テストパターン網羅スキル

## 概要
UIの表示項目に対して、取り得るすべての値と表示パターンを洗い出し、テストケースを設計するためのスキル。

## 発動トリガー
- 「すべてのパターンをテスト」
- 「表示パターンを網羅」
- 「テストケースを洗い出して」
- 「パターン網羅テスト」
- 新機能の表示項目追加時

---

## 全体フロー

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: 項目の洗い出し                                          │
│  └─ ソースコードから表示項目を抽出・分類                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: パターンの定義                                          │
│  └─ データ型別に取り得る値のパターンを列挙                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: 優先度付け                                              │
│  └─ P0（必須）/ P1（重要）/ P2（任意）に分類                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: テストケース設計                                        │
│  └─ テストデータ定義 + テスト構造作成                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: Codexレビュー                                           │
│  └─ パターン漏れがないか確認                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 6: テスト実行・メンテナンス                                 │
│  └─ 実行 → バグ発生時はパターン追加                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: 項目の洗い出し

### 1.1 ソースコードから項目を抽出

```bash
# 表示コンポーネントから項目を抽出
# 条件分岐（三項演算子、&&、if）に注目
grep -E "(\\? |&& |\\|\\| |: )" app/path/to/component.tsx
```

### 1.2 項目分類テンプレート

| カテゴリ | 項目名 | データソース | 型 | 必須 |
|---------|--------|-------------|-----|------|
| ヘッダー | 団体名 | `groupData.name` | string | ✓ |
| ヘッダー | 画像 | `groupData.profileImage` | string? | |
| バッジ | タイプ | `groupData.type` | enum | ✓ |
| ダイアログ | メール | `groupData.contact.email` | string? | |

---

## Step 2: パターンの定義

### 2.1 データ型別パターン

#### 必須文字列
| パターン | 値 | 確認内容 |
|---------|-----|---------|
| 通常 | `"テスト団体"` | 正常表示 |
| 上限値 | `"あ" × 100` | 折返し/省略 |
| 特殊文字 | `"🎵エイサー<script>"` | サニタイズ |

#### 任意文字列（nullable）
| パターン | 値 | 確認内容 |
|---------|-----|---------|
| あり | `"値あり"` | 正常表示 |
| null | `null` | 「ー」または非表示 |
| 空文字 | `""` | nullと同じ扱い |
| 空白のみ | `"   "` | トリム後null扱い |

#### 真偽値（nullable boolean）⚠️ 三値ロジック必須

**重要**: `boolean | null` は三値として明示的に分岐する。二値（true/false）で考えない。

| パターン | 値 | 確認内容 |
|---------|-----|---------|
| true | `true` | 「はい」/バッジ表示 |
| false | `false` | 「いいえ」/非表示 |
| null | `null` | 「未設定」（false とは異なる表示） |

```typescript
// ❌ 危険: nullがfalseと同じ扱い
{value ? <TrueUI /> : <FalseUI />}

// ✅ 正しい: 三値を明示的に分岐
{value === true ? (
  <TrueUI />
) : value === false ? (
  <FalseUI />
) : (
  <NullUI />  // 「未設定」状態
)}
```

**実装時チェック**:
- [ ] 型定義を確認（`boolean` vs `boolean | null`）
- [ ] 三値分岐（`=== true` / `=== false` / else）にしたか
- [ ] null時のUI表現を決めたか（falseと同じにしない）
- [ ] 関連するすべての表示箇所を確認したか

#### 列挙型（enum）
| パターン | 値 | 確認内容 |
|---------|-----|---------|
| 各値 | `'traditional'`, `'creative'`, `'other'` | 各ラベル表示 |
| 非表示条件 | `'other'` | バッジ非表示 |

#### 配列
| パターン | 値 | 確認内容 |
|---------|-----|---------|
| 0件 | `[]` | 「登録なし」メッセージ |
| 1件 | `[item]` | 単数表示 |
| 上限 | `[...5件]` | 全件表示 |
| 上限超 | `[...6件]` | 5件まで表示 |

#### 画像URL
| パターン | 値 | 確認内容 |
|---------|-----|---------|
| あり | 正常URL | 画像表示 |
| なし | `null` | プレースホルダー |
| 404 | 存在しないURL | エラー時フォールバック |

---

## Step 3: 優先度付け

### P0: 必須（基本機能）
- 各項目の「あり/なし」
- 必須項目の正常表示
- 主要な分岐条件

### P1: 重要（境界値）
- 文字数上限
- 配列の上限
- 日付の境界（今日/過去/未来）

### P2: 任意（エッジケース）
- 特殊文字・絵文字
- HTMLタグ（XSS）
- レイアウト崩れ

---

## Step 4: テストケース設計

### 4.1 テストデータ定義

```typescript
// tests/fixtures/group-patterns.ts
export const GROUP_PATTERNS = {
  // P0: 最小構成
  minimal: {
    name: 'テスト団体_最小',
    type: 'traditional',
    // 他は全てnull/空
  },

  // P0: フル構成
  full: {
    name: 'テスト団体_フル',
    type: 'traditional',
    status: 'active',
    is_recruiting_members: true,
    is_accepting_performance_requests: true,
    contact_email: 'test@example.com',
    contact_phone: '098-123-4567',
    social_website: 'https://example.com',
    social_twitter: 'https://twitter.com/test',
    social_instagram: 'https://instagram.com/test',
    social_facebook: 'https://facebook.com/test',
    social_youtube: 'https://youtube.com/test',
    videos: [
      { video_url: 'https://youtube.com/watch?v=test1', title: '動画1' },
      // ... 5件
    ],
  },

  // P0: 各タイプ
  creative: { ...minimal, type: 'creative' },
  other: { ...minimal, type: 'other' },

  // P0: 各ステータス
  suspended: { ...minimal, status: 'suspended', resume_date: '2025-12-31' },
  suspendedIndefinite: { ...minimal, status: 'suspended' },

  // P1: 境界値
  maxLength: {
    name: 'あ'.repeat(100),
    description: 'あ'.repeat(1000),
  },

  // P2: エッジケース
  specialChars: {
    name: '🎵テスト団体🎵',
    description: '改行\nあり\n\nHTMLタグ<script>alert(1)</script>',
  },
} as const;
```

### 4.2 テスト構造

```typescript
// tests/e2e/group-patterns.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { GROUP_PATTERNS } from './fixtures/group-patterns';

test.describe('団体表示パターンテスト', () => {
  let testGroupId: number;

  test.beforeAll(async ({ request }) => {
    // テスト用団体を作成
  });

  test.afterAll(async ({ request }) => {
    // テスト用団体を削除
  });

  // P0: 基本パターン
  test.describe('P0: 基本機能', () => {
    test('最小構成で表示される', async ({ page }) => {
      await updateGroupData(GROUP_PATTERNS.minimal);
      await page.goto(`/groups/${testGroupId}`);

      // 必須項目が表示される
      await expect(page.getByRole('heading', { name: /テスト団体_最小/ })).toBeVisible();
      await expect(page.getByText('伝統エイサー').first()).toBeVisible();

      // 任意項目は「ー」または非表示
      await expect(page.getByTestId('contact-indicator')).toHaveAttribute('data-status', 'unregistered');
    });

    test('フル構成で表示される', async ({ page }) => {
      await updateGroupData(GROUP_PATTERNS.full);
      await page.goto(`/groups/${testGroupId}`);

      // 全項目が表示される
      await expect(page.getByTestId('contact-indicator')).toHaveAttribute('data-status', 'registered');
      await expect(page.getByTestId('sns-indicator')).toContainText('5件');
      await expect(page.getByTestId('recruiting-badge')).toBeVisible();
      await expect(page.getByTestId('performance-badge')).toBeVisible();
    });

    // 各タイプ
    for (const [key, pattern] of Object.entries({
      traditional: '伝統エイサー',
      creative: '創作エイサー',
    })) {
      test(`タイプ: ${key}`, async ({ page }) => {
        await updateGroupData(GROUP_PATTERNS[key]);
        await page.goto(`/groups/${testGroupId}`);
        await expect(page.getByText(pattern).first()).toBeVisible();
      });
    }

    test('タイプ: other（バッジ非表示）', async ({ page }) => {
      await updateGroupData(GROUP_PATTERNS.other);
      await page.goto(`/groups/${testGroupId}`);
      // バッジが表示されないことを確認
      await expect(page.locator('[class*="badge"]').filter({ hasText: /伝統|創作/ })).not.toBeVisible();
    });
  });

  // P1: 境界値
  test.describe('P1: 境界値', () => {
    test('文字数上限', async ({ page }) => {
      await updateGroupData(GROUP_PATTERNS.maxLength);
      await page.goto(`/groups/${testGroupId}`);
      // 折返しまたは省略されて表示される（レイアウト崩れなし）
      await expect(page.getByRole('heading')).toBeVisible();
    });
  });

  // P2: エッジケース
  test.describe('P2: エッジケース', () => {
    test('特殊文字がサニタイズされる', async ({ page }) => {
      await updateGroupData(GROUP_PATTERNS.specialChars);
      await page.goto(`/groups/${testGroupId}`);
      // scriptタグが実行されない
      await expect(page.locator('script')).toHaveCount(0);
      // 絵文字は表示される
      await expect(page.getByText('🎵')).toBeVisible();
    });
  });
});
```

---

## Step 5: Codexレビューチェックリスト

Codexレビュー時に以下を確認依頼：

```
以下のパターンリストに漏れがないか確認してください：

1. 各項目の全データ型パターン（null/空文字/通常/上限）
2. 条件分岐の全分岐（true/false/null）
3. 境界値（上限値、日付境界）
4. エッジケース（特殊文字、XSS、レイアウト）
5. 組み合わせ（複数条件の同時発生）
```

---

## Step 6: テスト実行・メンテナンス

### 実行コマンド

```bash
# パターンテストのみ実行
npx playwright test group-patterns.spec.ts

# P0のみ実行（CI用）
npx playwright test group-patterns.spec.ts --grep "P0"

# 特定パターン
npx playwright test group-patterns.spec.ts --grep "最小構成"
```

### メンテナンス

1. **新項目追加時**: `GROUP_PATTERNS`に追加
2. **表示ロジック変更時**: 関連パターンのテスト更新
3. **バグ発生時**: 再現パターンを追加

---

## テンプレート：パターン洗い出しシート

```markdown
## [機能名] 表示パターン

### 項目一覧
| # | 項目 | 型 | パターン数 |
|---|------|-----|-----------|
| 1 | | | |

### パターン詳細

#### [項目名]
| パターン | 入力値 | 期待表示 | 優先度 |
|---------|--------|---------|--------|
| | | | P0 |

### テストケース
| # | ケース名 | カバーするパターン |
|---|---------|------------------|
| 1 | 最小構成 | 全項目null |
| 2 | フル構成 | 全項目あり |
```

---

## 参考：よくあるパターン漏れ

1. **null vs 空文字 vs undefined** の扱いの違い
2. **配列0件** と **配列フィールドがnull** の違い
3. **日付の境界**（今日が「今後」か「過去」か）
4. **組み合わせ**（バッジA=false + バッジB=true）
5. **画像404**時のフォールバック
6. **長文での折返し/省略**

---

## ⚠️ データフロー検証（実装前必須）

### なぜ必要か

ソート順の逆転やnullの扱い間違いは、**データフロー全体を追跡せずに部分実装した**ことが原因。

### データフロー図

```
DB → 取得（order by） → 整形（map/filter） → 表示（sort/reverse）
```

### 実装前チェックリスト

#### ソート機能
- [ ] DBにはどんな順序で格納されているか？
- [ ] 取得時のORDER BY/order()は何を指定しているか？
- [ ] 整形時に順序を変える処理はあるか？
- [ ] 表示時にsort/reverseしているか？
- [ ] **「デフォルト」の定義が全レイヤーで一致しているか？**

```typescript
// ❌ 悪い例：取得と表示のデフォルトが不一致
// 取得: 新しい順（ascending: false）
.order('created_at', { ascending: false })
// 表示: 「古い順」がデフォルト
const [sortOrder, setSortOrder] = useState('oldest')
// → 「古い順」なのに新しいものがトップに表示される

// ✅ 良い例：一致させる
.order('created_at', { ascending: true })  // 古い順
const [sortOrder, setSortOrder] = useState('oldest')
```

#### boolean | null フィールド
- [ ] 型定義を確認（`boolean` vs `boolean | null`）
- [ ] 三値分岐にしたか（=== true / === false / else）
- [ ] null時のUI表現を決めたか
- [ ] **関連するすべての表示箇所を確認したか**

### 典型的な失敗パターン

| 問題 | 原因 | 対策 |
|------|------|------|
| ソート順の逆転 | 取得側と表示側を別々に見た | データフロー全体を追跡 |
| nullがfalse扱い | 二値で考えた | boolean \| null は三値 |
| デフォルト不整合 | 各レイヤーで個別設定 | 全レイヤーのデフォルト確認 |
