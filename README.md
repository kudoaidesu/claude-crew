# Claude Code Template

Next.js + Supabase プロジェクト向けの Claude Code テンプレートリポジトリ。

## 含まれるもの

### Claude Code 設定
- `CLAUDE.md` - プロジェクトルール（汎用化済み、要カスタマイズ）
- `.claude/settings.json` - 共有パーミッション設定
- `.claude/commands/` - カスタムコマンド（commit, pr, test）
- `.claude/rules/` - ルール（Skill/Subagent活用）
- `.claude/skills/` - 37+ スキルライブラリ

### MCP サーバー設定
- `.mcp.json` - Playwright / Context7 / Gemini Google Search

### スキル一覧（カテゴリ別）

| カテゴリ | スキル |
|---------|--------|
| Next.js/React | nextjs-best-practices, nextjs-supabase-auth, vercel-react-best-practices |
| Supabase | supabase-auth, supabase-best-practices |
| UI/Design | shadcn-ui, tailwind-design-system, frontend-design, design-polish |
| テスト | e2e-test-principles, vitest-unit-test, vitest-coverage, vitest-bench, webapp-testing |
| レビュー | performance-review, security-review, sre-review |
| リサーチ | academic-trend-research, oss-code-research |
| インフラ | pre-deploy-checklist, infra-cost-estimate |
| ツール | skill-creator, skill-usage-tracker, mcp-builder, learning-capture |

## 使い方

### 1. テンプレートからリポジトリを作成

GitHub の "Use this template" ボタンをクリック。

### 2. セットアップ

```bash
# クローン
git clone <your-repo-url>
cd <your-repo>

# CLAUDE.md をプロジェクトに合わせて編集
# - 技術スタック
# - ディレクトリ構造
# - プロジェクト概要
# - 実行コマンド

# .mcp.json の Gemini API キーを設定
# GEMINI_API_KEY を自分のキーに置き換え
```

### 3. ローカル設定（gitignore対象）

`.claude/settings.local.json` は各開発者がローカルで作成：

```json
{
  "permissions": {
    "allow": [
      "Bash(git *)",
      "Bash(npm *)",
      "Skill(*)"
    ]
  }
}
```

## カスタマイズ

- `CLAUDE.md`: プロジェクト固有のルール・概要を記述
- `.claude/skills/`: プロジェクト固有のスキルを追加
- `.claude/commands/`: カスタムコマンドを追加・編集
- `.mcp.json`: 必要なMCPサーバーを追加
