# セッション管理リファレンス

Codex MCPのセッション管理パターンと詳細。

## セッションIDの仕組み

codex-mcp ([LanceVCS/codex-mcp](https://github.com/LanceVCS/codex-mcp)) は `codex exec --json` を内部で使用し、レスポンスにセッションIDを付与。

### レスポンス形式

```
Response: "レビュー結果のテキスト..."
[SESSION_ID: 019a7661-3643-7ac3-aeb9-098a910935fb]
```

## MCP ツール

### mcp__codex__codex

新規セッションでCodexを呼び出し。

```typescript
mcp__codex__codex({
  prompt: string  // Codexへの依頼内容
})
```

### mcp__codex__codex_reply

既存セッションを継続してCodexを呼び出し。

```typescript
mcp__codex__codex_reply({
  conversationId: string,  // 保持したセッションID
  prompt: string           // フォローアップ内容
})
```

## セッション維持のベストプラクティス

### セッションIDの保持

レビューサイクル全体で同一セッションIDを使用:
- 設計レビュー → 修正 → 再レビュー
- 実装レビュー → 修正 → 再レビュー

これにより Codex 側で全コンテキストが維持される。

### セッション切れの対応

セッションが切れた場合、新規セッションで経緯をサマリ提供:

```
mcp__codex__codex({
  prompt: `
## コンテキスト引き継ぎ

前回セッションで完了:
- 設計レビュー: 承認済み
- 実装: 完了

今回は成果物レビューをお願いします。
[以下、レビュー内容]
`
})
```

## トラブルシューティング

### セッションIDが取得できない

- codex-mcp のバージョン確認
- `--json` オプション対応版が必要

### Codex が応答しない

- MCP サーバーの接続状態確認
- `claude mcp list` でサーバー一覧確認