#!/usr/bin/env bash
# EP-020 Prototype — dev launcher (TSK-141)
# Leverages the parent workspace node_modules — no separate npm install needed.
# Usage:
#   ./start.sh        → vite dev server (default, http://localhost:5173)
#   ./start.sh build  → vite build → dist/
set -e

PROTO_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$PROTO_DIR/../../.." && pwd)"
PARENT_MODULES="$REPO_ROOT/packages/app/node_modules"
VITE_BIN="$PARENT_MODULES/.bin/vite"

# Ensure parent node_modules exists
if [ ! -d "$PARENT_MODULES" ]; then
  echo "[prototype] ERROR: parent node_modules not found at $PARENT_MODULES"
  echo "  Run 'npm install' in packages/app first."
  exit 1
fi

# Create/refresh node_modules symlink so Vite resolves imports
if [ -L "$PROTO_DIR/node_modules" ]; then
  current=$(readlink "$PROTO_DIR/node_modules" 2>/dev/null || true)
  if [ "$current" != "$PARENT_MODULES" ]; then
    rm "$PROTO_DIR/node_modules"
    ln -sf "$PARENT_MODULES" "$PROTO_DIR/node_modules"
    echo "[prototype] Refreshed node_modules symlink → $PARENT_MODULES"
  fi
elif [ ! -d "$PROTO_DIR/node_modules" ]; then
  ln -sf "$PARENT_MODULES" "$PROTO_DIR/node_modules"
  echo "[prototype] Created node_modules symlink → $PARENT_MODULES"
fi

MODE="${1:-dev}"
cd "$PROTO_DIR"

if [ "$MODE" = "build" ]; then
  echo "[prototype] Building EP-020 prototype..."
  "$VITE_BIN" build --config "$PROTO_DIR/vite.config.ts"
else
  echo "[prototype] Starting EP-020 prototype dev server..."
  echo "  Open: http://localhost:5173"
  "$VITE_BIN" --config "$PROTO_DIR/vite.config.ts"
fi
