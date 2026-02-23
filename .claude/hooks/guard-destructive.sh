#!/bin/bash
# PreToolUse hook: 破壊的Bashコマンドをブロック + Discord通知（停止ボタン付き）

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# 破壊的パターン検知
BLOCKED=false
PATTERN=""

if echo "$COMMAND" | grep -qiE 'git\s+push\s+.*(-f|--force)'; then
  BLOCKED=true
  PATTERN="git push --force"
elif echo "$COMMAND" | grep -qiE 'git\s+reset\s+--hard'; then
  BLOCKED=true
  PATTERN="git reset --hard"
elif echo "$COMMAND" | grep -qiE 'rm\s+-rf\s+/|rm\s+-rf\s+\.$|rm\s+-rf\s+\.\s'; then
  BLOCKED=true
  PATTERN="rm -rf (dangerous target)"
elif echo "$COMMAND" | grep -qiE 'DROP\s+TABLE|TRUNCATE'; then
  BLOCKED=true
  PATTERN="DB destructive command"
elif echo "$COMMAND" | grep -qiE 'git\s+clean\s+-f'; then
  BLOCKED=true
  PATTERN="git clean -f"
elif echo "$COMMAND" | grep -qiE 'git\s+checkout\s+\.\s*$|git\s+restore\s+\.\s*$'; then
  BLOCKED=true
  PATTERN="discard all changes"
fi

if [ "$BLOCKED" = true ]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

  # セッション情報
  SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
  TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

  # 作業コンテキスト取得（トランスクリプトの最後のユーザーメッセージ）
  CONTEXT="(取得不可)"
  if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
    CONTEXT=$(tail -50 "$TRANSCRIPT_PATH" | jq -r 'select(.type == "human") | .message.content' 2>/dev/null | tail -1 | head -c 200 || echo "(取得不可)")
    [ -z "$CONTEXT" ] && CONTEXT="(取得不可)"
  fi

  # Claude Code の PID を特定（プロセスツリーを辿る）
  CLAUDE_PID=""
  WALK_PID=$$
  for _ in $(seq 1 10); do
    CMD=$(ps -o command= -p "$WALK_PID" 2>/dev/null || true)
    if echo "$CMD" | grep -q "claude"; then
      CLAUDE_PID=$WALK_PID
      break
    fi
    WALK_PID=$(ps -o ppid= -p "$WALK_PID" 2>/dev/null | tr -d ' ')
    [ -z "$WALK_PID" ] && break
  done

  # .env から Bot Token 読み込み
  DISCORD_BOT_TOKEN=""
  if [ -f "$PROJECT_DIR/.env" ]; then
    DISCORD_BOT_TOKEN=$(grep '^DISCORD_BOT_TOKEN=' "$PROJECT_DIR/.env" | cut -d'=' -f2)
  fi

  CHANNEL_ID=$(jq -r '.[0].operationAlertChannelId // empty' "$PROJECT_DIR/projects.json" 2>/dev/null)

  if [ -n "$DISCORD_BOT_TOKEN" ] && [ -n "$CHANNEL_ID" ]; then
    # 停止ボタン付きペイロード
    BUTTON_ID="kill_session:${CLAUDE_PID:-unknown}"

    PAYLOAD=$(jq -n \
      --arg cmd "$COMMAND" \
      --arg pattern "$PATTERN" \
      --arg session "$SESSION_ID" \
      --arg context "$CONTEXT" \
      --arg pid "${CLAUDE_PID:-不明}" \
      --arg button_id "$BUTTON_ID" \
      '{
        "embeds": [{
          "title": "🚨 危険コマンドをブロックしました",
          "color": 16711680,
          "fields": [
            {"name": "コマンド", "value": ("```\n" + $cmd + "\n```"), "inline": false},
            {"name": "検知パターン", "value": $pattern, "inline": true},
            {"name": "PID", "value": $pid, "inline": true},
            {"name": "セッション", "value": $session, "inline": false},
            {"name": "作業内容", "value": $context, "inline": false}
          ]
        }],
        "components": [{
          "type": 1,
          "components": [{
            "type": 2,
            "style": 4,
            "label": "セッションを停止",
            "custom_id": $button_id
          }]
        }]
      }')

    curl -s -X POST "https://discord.com/api/v10/channels/$CHANNEL_ID/messages" \
      -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" > /dev/null 2>&1 &
  fi

  echo "BLOCKED: $PATTERN — このコマンドはリポジトリ保護のためブロックされました" >&2
  exit 2
fi

exit 0
