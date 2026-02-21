# コンフリクト解消・本番エラー修正スキル

コンフリクト解消後や本番エラー修正時に、必要なテストを漏れなく実行するための手順。

## トリガーワード
- 「コンフリクト」「マージ」「conflict」「merge」
- 「本番エラー」「本番で動かない」「デプロイ後にエラー」
- 「修正して」「fix」（本番環境の問題に対して）

## コンフリクト解消後の手順

### 1. 変更ファイルの確認
```bash
git diff --name-only origin/main...HEAD
```

### 2. 関連するE2Eテストの特定

変更ファイルと関連するテストのマッピング:

| 変更ファイル | 関連E2Eテスト |
|-------------|--------------|
| `app/(dashboard)/admin/*` | `tests/e2e/admin-*.spec.ts` 全て |
| `lib/audit-log*.ts` | 監査ログを使う全機能のテスト |
| `app/actions/*-admin.ts` | 該当管理機能のE2Eテスト |
| `supabase/migrations/*.sql` | DB関数が影響する機能のテスト |

### 3. 全関連テストの実行
```bash
# 管理機能全般の場合
npm run test:e2e:admin

# または特定機能
npx playwright test tests/e2e/admin-locations-venues.spec.ts
npx playwright test tests/e2e/smoke-admin.spec.ts
```

### 4. ビルド確認
```bash
npm run build
```

## 本番エラー修正の手順

### ❌ やってはいけないこと
- 推測だけで修正をデプロイ
- ローカルで再現確認せずに修正
- 修正後にテストを実行せずにデプロイ

### ✅ 正しい手順

#### 1. ローカルで再現確認
```bash
# 該当機能のE2Eテストを実行
npx playwright test -g "該当機能のテスト名"
```

#### 2. 原因の特定
- エラーメッセージを確認
- 関連コードを読む
- DB関数の場合: `npx supabase db diff --linked` で本番との差分確認

#### 3. 修正の実装

#### 4. 同じテストで修正確認
```bash
# 修正前に失敗したのと同じテストを実行
npx playwright test -g "該当機能のテスト名"
```

#### 5. デプロイ

## DB関数変更時の追加手順

```bash
# 1. 本番との差分確認
npx supabase db diff --linked

# 2. ローカルでマイグレーション適用
npx supabase migration up

# 3. その関数を使う機能のテスト実行
npx playwright test -g "該当機能"

# 4. 本番にプッシュ
npx supabase db push --linked
```

## 教訓（2026-02-09 incident）

### 発生した問題
- コンフリクト解消後、一部のE2Eテストのみ実行
- 本番エラー対応で推測に基づく修正を追加
- 修正後に関連テストを実行せずデプロイ
- 結果: 本番で会場マスター登録が失敗

### 根本原因
- 「関連するテスト」の範囲を狭く解釈
- 修正の影響範囲を考慮せずテストを選択

### 学び
- **「関連する」= 変更ファイルが影響する全ての機能**
- **修正前後で同じテストを実行して動作確認**
- **DB変更は本番スキーマとの整合性を必ず確認**
