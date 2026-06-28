#!/usr/bin/env bash
# EP-022 — wrapper Token Ledger per agenti Cursor (always-print in Cloud Agent).
set -euo pipefail
ROOT="$(git -C "${CURSOR_PROJECT_DIR:-${REPO_ROOT:-.}}" rev-parse --show-toplevel 2>/dev/null || pwd)"
exec python3 "$ROOT/.claude/tools/analytics/show-session-tokens.py" --always-print "$@"
