---
name: skill-usage-tracker
description: スキル使用回数と発火トリガーを記録・分析する。スキル使用後に自動的に記録。「スキル統計」「使用回数確認」「どのスキルが使われた」で発動。Serena MCPメモリで永続化。
---

# スキル使用トラッカー

## 目的

スキルの使用パターンを記録し、以下を把握する：
- どのスキルがよく使われるか
- どのようなワード/アクションで発火したか
- スキルの有効性を評価する材料を収集

## 記録タイミング

**スキルを使用したら、その直後に記録する。**

## 記録方法

Serena MCPの `write_memory` / `edit_memory` を使用：

```
mcp__serena__edit_memory({
  memory_file_name: "skill-usage-log.md",
  needle: "<!-- USAGE_LOG -->",
  repl: "<!-- USAGE_LOG -->\n| YYYY-MM-DD HH:MM | skill-name | trigger-word/action |",
  mode: "literal"
})
```

## 記録フォーマット

メモリファイル `skill-usage-log.md` の構造：

```markdown
# スキル使用ログ

## 統計サマリー
| スキル名 | 使用回数 | 主なトリガー |
|----------|----------|-------------|
| frontend-design | 5 | UI実装、デザイン作成 |
| codex-review | 3 | Codexレビュー |

## 詳細ログ
<!-- USAGE_LOG -->
| 日時 | スキル名 | トリガー |
|------|----------|----------|
```

## 使用例

### スキル使用後の記録

```
# frontend-designスキルを使用した後
mcp__serena__edit_memory({
  memory_file_name: "skill-usage-log.md",
  needle: "<!-- USAGE_LOG -->",
  repl: "<!-- USAGE_LOG -->\n| 2025-01-29 15:30 | frontend-design | UIデザイン改善依頼 |",
  mode: "literal"
})
```

### 統計確認

```
mcp__serena__read_memory({
  memory_file_name: "skill-usage-log.md"
})
```

## 初期化

メモリファイルが存在しない場合、以下で作成：

```
mcp__serena__write_memory({
  memory_file_name: "skill-usage-log.md",
  content: `# スキル使用ログ

## 統計サマリー
| スキル名 | 使用回数 | 主なトリガー |
|----------|----------|-------------|

## 詳細ログ
<!-- USAGE_LOG -->
| 日時 | スキル名 | トリガー |
|------|----------|----------|
`
})
```

## 他スキルへの統合

各スキルのSKILL.mdに以下を追記することを推奨：

```markdown
## 使用記録

このスキルを使用したら `skill-usage-tracker` で記録する。
```
