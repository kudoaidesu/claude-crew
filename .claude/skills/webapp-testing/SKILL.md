---
name: webapp-testing
description: Playwrightを使用したローカルWebアプリケーションの操作・テストツールキット。フロントエンド機能の検証、UI動作のデバッグ、ブラウザスクリーンショットのキャプチャ、ブラウザログの確認をサポート。
license: Complete terms in LICENSE.txt
---

# Webアプリケーションテスト

## 関連スキル

**E2Eテスト作成時は必ず参照:**
- [e2e-test-principles](../e2e-test-principles.md) - テスト観点・チェックリスト・原則（「何をテストするか」）

このスキルは「どうテストを実行するか」を扱います。

---

ローカルWebアプリケーションをテストするには、ネイティブPython Playwrightスクリプトを作成。

## ヘルパースクリプト

- `scripts/with_server.py` - サーバーライフサイクルを管理（複数サーバー対応）

**必ず`--help`を先に実行**して使い方を確認。

## 判断ツリー

```
静的HTML? → HTMLを読んでセレクタ特定 → Playwrightスクリプト作成

動的webapp → サーバー起動中?
  ├─ いいえ → python scripts/with_server.py --help
  └─ はい → 偵察→アクション:
      1. networkidleを待機
      2. スクリーンショット/DOM検査
      3. セレクタ特定
      4. アクション実行
```

## 使用例

**サーバー起動:**
```bash
python scripts/with_server.py --server "npm run dev" --port 5173 -- python your_automation.py
```

**Playwrightスクリプト:**
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')  # 重要
    # 自動化ロジック
    browser.close()
```

## よくある落とし穴

❌ `networkidle`を待つ前にDOMを検査
✅ 検査前に`page.wait_for_load_state('networkidle')`を待機

## 不具合調査時の原則

**ユーザーから不具合の原因調査を依頼された場合、必ず`--headed`でブラウザを開く。**

```bash
# ❌ ヘッドレスで実行（問題が見えない）
npx playwright test tests/e2e/xxx.spec.ts

# ✅ ブラウザを開いて確認
npx playwright test tests/e2e/xxx.spec.ts --headed --debug
```

**確認ポイント:**
1. コンソールエラー/警告（特に`aria-hidden`関連）
2. ネットワークリクエストの成功/失敗
3. DOM状態の変化タイミング

詳細: [references/universal-best-practices.md](references/universal-best-practices.md)