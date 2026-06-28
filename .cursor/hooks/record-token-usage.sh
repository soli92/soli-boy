#!/usr/bin/env bash
# EP-022 — registra token da hook Cursor (afterAgentResponse / stop) nel side-channel.
# Cloud Agent: hook stop/afterAgentResponse non ancora wired; usa CURSOR_API_KEY + API usage.
set -euo pipefail
ROOT="$(git -C "${CURSOR_PROJECT_DIR:-.}" rev-parse --show-toplevel 2>/dev/null || pwd)"
python3 "$ROOT/.claude/tools/analytics/show-session-tokens.py" --from-hook --record-only 2>/dev/null || true
