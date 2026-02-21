# Hooks

Claude Codeの自動実行フック設定。

## 利用可能なフック

現在、Claude Codeのhooksは `settings.json` で設定します。

```json
{
  "hooks": {
    "preToolExecution": [...],
    "postToolExecution": [...],
    "userPromptSubmit": [...]
  }
}
```

## 推奨設定例

### ファイル編集後の自動lint
```json
{
  "hooks": {
    "postToolExecution": [
      {
        "matcher": "Edit|Write",
        "command": "npm run lint:fix --silent"
      }
    ]
  }
}
```

### コミット前の型チェック
```json
{
  "hooks": {
    "preToolExecution": [
      {
        "matcher": "Bash.*git commit",
        "command": "npm run type-check"
      }
    ]
  }
}
```

## 注意
- hooksはsettings.jsonで管理
- このフォルダはドキュメント用
