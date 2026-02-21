# 🧪 エイサーマップ テスト環境構築ガイド

## 📋 概要

安定したテスト環境を構築するための包括的なガイドです。サーバー起動問題の解決策とベストプラクティスを記載しています。

## 🚨 よくある問題と解決策

### 問題1: Next.jsサーバーの起動不安定
**症状**: ポート競合、コネクション拒否、プロセス重複

**原因分析**:
- 複数のNext.jsプロセスが同時起動
- ポート3000→3001→3002の順次変更による混乱
- プロセス終了処理の不完全

**解決策**: 事前クリーンアップとプロセス管理

### 問題2: Supabaseとの接続問題
**症状**: 認証エラー、データベース接続失敗

**原因分析**:
- Supabaseサービスの起動順序
- 環境変数の設定ミス
- ポート競合による接続失敗

**解決策**: 正しい起動順序の遵守

## 🔧 安定したテスト環境構築手順

### Phase 1: 環境クリーンアップ (必須)

```bash
# 1. 既存のNext.jsプロセスを全て停止
pkill -f "next"
pkill -f "node.*next"

# 2. ポート使用状況の確認
lsof -i :3000 -i :3001 -i :3002

# 3. 必要に応じてプロセス強制終了
# kill -9 [PID]

# 4. キャッシュクリア
rm -rf .next
npm run build > /dev/null 2>&1 || true
```

### Phase 2: Supabaseサービス確認

```bash
# 1. Supabaseサービス状態確認
npx supabase status

# 2. サービスが停止している場合は起動
npx supabase start

# 3. 重要サービスの稼働確認
curl -s http://127.0.0.1:54321/health || echo "⚠️ Supabase API未起動"
curl -s http://127.0.0.1:54323 || echo "⚠️ Supabase Studio未起動"
```

### Phase 3: 環境変数の確認

```bash
# 1. .env.localファイルの存在確認
test -f .env.local && echo "✅ .env.local 存在" || echo "❌ .env.local 不存在"

# 2. 必須環境変数の確認
grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && echo "✅ SUPABASE_URL設定済み"
grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local && echo "✅ ANON_KEY設定済み"
```

### Phase 4: 開発サーバー起動

```bash
# 1. ポート3000での起動を試行
PORT=3000 npm run dev &
DEV_PID=$!

# 2. 起動確認（最大30秒待機）
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ サーバー起動成功 (ポート:3000)"
    break
  fi
  sleep 1
done

# 3. 起動失敗時の代替ポート
if ! curl -s http://localhost:3000 > /dev/null; then
  kill $DEV_PID 2>/dev/null
  PORT=3001 npm run dev &
  echo "⚠️ ポート3001で再試行"
fi
```

## 🛠 推奨：改善されたpackage.jsonスクリプト

以下のスクリプトをpackage.jsonに追加することを推奨：

```json
{
  "scripts": {
    "dev:clean": "pkill -f next || true && rm -rf .next && npm run dev",
    "dev:reset": "npm run supabase:restart && npm run dev:clean",
    "test:setup": "npm run dev:clean && sleep 5",
    "check:ports": "lsof -i :3000 -i :3001 -i :3002 || echo 'ポート空き'",
    "check:supabase": "npx supabase status | grep -E '(API URL|Studio URL|running)'",
    "kill:dev": "pkill -f next && pkill -f 'node.*next' || true"
  }
}
```

## 🎯 Playwrightテスト専用環境構築

### Playwrightテスト実行前の必須チェック

```bash
# 1. 環境クリーンアップ
npm run kill:dev
sleep 2

# 2. Supabase確認
npm run check:supabase

# 3. 開発サーバー起動
npm run dev:clean

# 4. サーバー応答確認
timeout 30 bash -c 'until curl -s http://localhost:3000; do sleep 1; done'
echo "✅ テスト環境準備完了"
```

### テスト用ユーザー認証設定

```bash
# 1. テストアカウント作成確認
node scripts/create-admin.mjs

# 2. データベース状態確認
npx supabase db reset --db-url "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# 3. 認証テスト
curl -s http://localhost:3000/login | grep -q "ログイン" && echo "✅ 認証画面OK"
```

## 📊 トラブルシューティング

### 🔍 問題診断コマンド

```bash
# システム状態の包括チェック
echo "=== Next.jsプロセス ==="
ps aux | grep next | grep -v grep

echo "=== ポート使用状況 ==="
lsof -i :3000 -i :3001 -i :3002

echo "=== Supabase状態 ==="
npx supabase status

echo "=== 環境変数 ==="
env | grep NEXT_PUBLIC
```

### ⚡ 緊急時の復旧手順

```bash
# 1. 全プロセス強制停止
pkill -9 -f next
pkill -9 -f supabase

# 2. Supabase再起動
npx supabase stop
npx supabase start

# 3. 開発環境リセット
rm -rf .next node_modules/.cache
npm run dev

# 4. 最終確認
curl http://localhost:3000 && echo "✅ 復旧完了"
```

## 🎯 本番テスト用チェックリスト

### ✅ テスト実行前の必須確認項目

- [ ] 既存Next.jsプロセスの停止確認
- [ ] Supabaseサービス正常起動確認
- [ ] 環境変数設定確認
- [ ] ポート空き状況確認
- [ ] テストデータベース準備確認
- [ ] テストアカウント作成確認

### 📈 パフォーマンス最適化

```bash
# Next.js開発モードの最適化
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1

# 並列プロセス制限
export UV_THREADPOOL_SIZE=16
```

## 🚀 Claude Code での自動実行

Claude Codeでテスト実行時は、必ず以下の順序で実行：

1. **環境確認**: `npm run check:ports && npm run check:supabase`
2. **クリーンアップ**: `npm run kill:dev && sleep 2`
3. **サーバー起動**: `npm run dev:clean`
4. **起動確認**: `timeout 30 bash -c 'until curl -s http://localhost:3000; do sleep 1; done'`
5. **テスト実行**: Playwright等のテストツール実行

## 📝 ログとデバッグ

### デバッグ用環境変数

```bash
# Next.js詳細ログ
export DEBUG=next*

# Supabase詳細ログ  
export SUPABASE_DEBUG=true

# ブラウザコンソールログ
export PLAYWRIGHT_DEBUG=1
```

### ログファイル管理

```bash
# サーバーログの保存
npm run dev 2>&1 | tee dev-server.log

# エラーログのフィルタリング
grep -i error dev-server.log
grep -i warning dev-server.log
```

## 🎉 成功パターンの記録

**最も安定した起動順序**:
1. プロセス全停止 → 2. Supabase確認 → 3. Next.js起動 → 4. 接続確認

**推奨テスト環境**:
- Node.js: v18以上
- Next.js: 14.2.16
- Supabase CLI: v2.30.4以上
- ポート: 3000 (Next.js), 54321-54324 (Supabase)

---

## 📞 サポート

このガイドで解決しない問題は、dev.logファイルと併せて開発チームに報告してください。

**作成日**: 2025-07-12  
**最終更新**: 2025-07-12  
**バージョン**: 1.0.0