# AGENTS.md

This repo is both the **Soli-boy** application (a multiplatform Game Boy / GBA emulator)
and an "Agentic Factory" knowledge base. The runnable product lives in `packages/app`
(Vite + React + TypeScript) with an Electron shell in `packages/desktop`. For project
conventions and the factory pipeline, see `CLAUDE.md`, `README.md`, and `packages/app/README.md`.

## Cursor Cloud specific instructions

Scope of this section: durable, non-obvious notes for running/testing the app. Standard
commands are already documented in `packages/app/README.md` and `packages/app/package.json`
(`dev`, `test`, `typecheck`, `build`, `e2e`).

### Node version
- The app requires **Node 24** (`engines: >=24`, CI uses Node 24). Node 24 is installed via
  `nvm` and prepended to `PATH` in `~/.bashrc`, so **interactive/login shells already use it**
  (`node -v` → v24). Non-login shells may instead resolve the older `/exec-daemon/node` that is
  injected ahead in `PATH`; if a command needs Node 24 explicitly, run it via a login shell
  (`bash -lc '...'`) or prepend `"$HOME/.nvm/versions/node/v24.18.0/bin"` to `PATH`. There is no
  `engine-strict`, so `npm ci`/`npm install` succeed on either Node version (deps are pure
  JS/WASM, no native compilation).

### Running / testing the app (all commands run from `packages/app`)
- Dev server: `npm run dev` (Vite on `http://localhost:5173`). The Vite config sends
  cross-origin isolation headers (COOP/COEP) required for `SharedArrayBuffer` used by the
  emulator cores — keep this in mind if proxying or changing the server.
- Unit/integration: `npm test` (Vitest, jsdom). Typecheck: `npm run typecheck`. Build: `npm run build`.
- E2e: `npm run e2e` (Playwright, Chromium). Chromium is installed via
  `npx playwright install chromium`. The Playwright `webServer` auto-starts Vite on port 4173.

### Emulator engine gotcha (important for manual testing)
- The default emulator engine is CDN-based (EmulatorJS / Libretro cores) and will **not render
  offline or in headless environments** (no network for the CDN cores) — the canvas stays black.
- To exercise real emulation locally/headless, open the app with the query param
  **`?engine=real`**, which forces the bundled WasmBoy (GB/GBC) / mGBA (GBA) engines. This is the
  same flag the e2e tests use.
- Manual ROM run flow: load a ROM via "Carica ROM" (free test ROMs are in
  `packages/app/public/test-roms/`, e.g. `dmg-acid2.gb`), then select the imported tile in the
  **"Libreria"** tab (selecting it auto-switches to Play and starts), then "Avvia". The canvas
  then renders the game.

### Flaky e2e tests
- The real-emulation `@slow` e2e specs (`emulation-emulatorjs-engine`, `emulation-save`,
  `emulation-gba-save`) are timing-flaky and occasionally fail with
  "Error parsing the cartridge header" on the first attempt. CI sets `retries: 1`
  (`process.env.CI`) and they pass on retry. Locally, run flaky specs with `CI=1` (or
  `--retries=1`) to mirror CI rather than treating a first-attempt failure as a regression.

### Token Ledger (EP-022)
- Capability **ON** in `factory.config.yaml` (`analytics.token_ledger.enabled: true`).
- **Cursor Cloud Agent**: regola always-on `.cursor/rules/token-ledger-display.mdc` — ogni agente
  appende l'one-liner `◉ TOKENS ...` a fine attività via `.cursor/tools/token-ledger-display.sh`.
- **Token reali in Cloud Agent**: aggiungi il secret `CURSOR_API_KEY` (Cursor Dashboard → API Keys)
  alla configurazione del Cloud Agent. Lo script chiama `GET /v1/agents/{CURSOR_CONVERSATION_ID}/usage`.
- **Desktop Cursor**: `.cursor/hooks.json` registra usage via hook `afterAgentResponse`/`stop` in
  `.cursor/.token-ledger-state.json` (nota: questi hook non sono ancora wired su Cloud Agent).
- Script: `python3 .claude/tools/analytics/show-session-tokens.py --always-print`
- Fine wave: `auto_call_on_wave_close: true` → box `--full` nel riepilogo orchestrator.
