#!/usr/bin/env bash
# android-device-prepare.sh — prepara build Capacitor Android per device fisico (TSK-178).
# Uso: da packages/app → ./scripts/android-device-prepare.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Build web (Vite → dist/)"
npm run build

if [[ ! -d android ]]; then
  echo "==> Scaffolding progetto Android (prima volta)"
  npx cap add android
fi

echo "==> Capacitor sync"
npx cap sync android

echo ""
echo "✓ Pronto per device fisico."
echo "  Android Studio:  npm run cap:open:android  → Run su device USB"
echo "  CLI (se adb OK): npm run cap:run:android"
echo "  Checklist:       store-assets/device-validation-checklist.md"
echo "  Runbook:         wiki/runbooks/android-device-validation-runbook.md"
