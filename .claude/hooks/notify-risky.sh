#!/bin/bash
# PostToolUse hook: リスク操作を Discord に事後通知（停止ボタン付き）

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# リスクパターン検知
RISKY=false
CATEGORY=""

if echo "$COMMAND" | grep -qiE 'git\s+push(\s|$)'; then
  RISKY=true
  CATEGORY="git push"
elif echo "$COMMAND" | grep -qiE 'git\s+branch\s+-[dD]'; then
  RISKY=true
  CATEGORY="branch delete"
elif echo "$COMMAND" | grep -qiE 'npm\s+publish'; then
  RISKY=true
  CATEGORY="npm publish"
elif echo "$COMMAND" | grep -qiE 'git\s+merge'; then
  RISKY=true
  CATEGORY="git merge"
elif echo "$COMMAND" | grep -qiE 'git\s+rebase'; then
  RISKY=true
  CATEGORY="git rebase"
elif echo "$COMMAND" | grep -qiE 'rm\s+-r'; then
  RISKY=true
  CATEGORY="recursive delete"
fi

if [ "$RISKY" = true ]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

  SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
  TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

  # 作業コンテキスト
  CONTEXT="(取得不可)"
  if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
    CONTEXT=$(tail -50 "$TRANSCRIPT_PATH" | jq -r 'select(.type == "human") | .message.content' 2>/dev/null | tail -1 | head -c 200 || echo "(取得不可)")
    [ -z "$CONTEXT" ] && CONTEXT="(取得不可)"
  fi

  # Claude Code PID 特定
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

  DISCORD_BOT_TOKEN=""
  if [ -f "$PROJECT_DIR/.env" ]; then
    DISCORD_BOT_TOKEN=$(grep '^DISCORD_BOT_TOKEN=' "$PROJECT_DIR/.env" | cut -d'=' -f2)
  fi

  CHANNEL_ID=$(jq -r '.[0].operationAlertChannelId // empty' "$PROJECT_DIR/projects.json" 2>/dev/null)

  if [ -n "$DISCORD_BOT_TOKEN" ] && [ -n "$CHANNEL_ID" ]; then
    BUTTON_ID="kill_session:${CLAUDE_PID:-unknown}"

    PAYLOAD=$(jq -n \
      --arg cmd "$COMMAND" \
      --arg cat "$CATEGORY" \
      --arg session "$SESSION_ID" \
      --arg context "$CONTEXT" \
      --arg pid "${CLAUDE_PID:-不明}" \
      --arg button_id "$BUTTON_ID" \
      '{
        "embeds": [{
          "title": "⚠️ リスク操作を実行しました",
          "color": 16776960,
          "fields": [
            {"name": "コマンド", "value": ("```\n" + $cmd + "\n```"), "inline": false},
            {"name": "カテゴリ", "value": $cat, "inline": true},
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
fi

exit 0
