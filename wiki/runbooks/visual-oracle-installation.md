---
id: visual-oracle-installation
type: runbook
title: "Installazione Playwright per Visual Oracle"
status: stable
created: 2026-06-03
updated: 2026-06-03
sources:
  - "raw/factory-bootstrap.md §1.quinquies"
  - "PATTERN.md §3 (Visual Verification)"
related:
  - graphify-installation
  - temi-e-design-token-solids
tags: [runbook, installazione, playwright, visual-oracle, fe, setup]
---

# Installazione Playwright per Visual Oracle

> Procedura operativa per avere [Playwright](https://playwright.dev) nel progetto FE prima di
> usare la skill `visual-oracle-protocol` (`.claude/skills/visual-oracle-protocol.md`). La skill,
> in Fase 1 (Bootstrap), verifica
> `npx playwright --version` come pre-condizione: exit code != 0 → fail-loud con link a questo
> runbook. **Nessun degrado silenzioso.**

## Stato in soli-boy

Playwright è **già installato** in `packages/app`:

- `@playwright/test` in `packages/app/package.json` (devDependencies);
- `packages/app/playwright.config.ts` (Chromium headless, webServer = Vite dev);
- spec e2e in `packages/app/e2e/*.e2e.ts`.

Il `code_path` FE della factory è `packages/app`, quindi la skill invoca `npx playwright`
da lì.

## Prerequisiti

- **Node.js 22** (vedi `.nvmrc` / `factory.config.yaml`). Verifica: `node --version`.
- **npm** (`npm --version`).
- **Connessione internet** alla prima installazione dei binari browser (~170 MB Chromium).

## Installazione (se Playwright assente o binari mancanti)

Dalla root del progetto FE (`packages/app`):

```bash
# 1. dev-dependency (già presente in soli-boy)
npm i -D @playwright/test

# 2. binario Chromium headless (richiesto dalla skill)
npx playwright install --with-deps chromium
```

I binari vivono nella cache Playwright (condivisi fra progetti con stessa versione), non in
`node_modules`: su macOS `~/Library/Caches/ms-playwright/`, su Linux `~/.cache/ms-playwright/`
(override con `PLAYWRIGHT_BROWSERS_PATH`). La skill usa **solo Chromium** in v2.17.

## Verifica

```bash
cd packages/app && npx playwright --version
# Atteso: Version 1.x.y, exit code 0
```

Se exit code != 0 → la skill `visual-oracle-protocol` STOP fail-loud con messaggio verbatim
che cita i comandi di install qui sopra.

## Ambienti corporate / air-gapped

Per ambienti senza accesso internet, pre-popola la cache `~/.cache/ms-playwright/` con i
binari Chromium scaricati altrove (stessa versione di `@playwright/test`), oppure imposta
`PLAYWRIGHT_BROWSERS_PATH` su un percorso condiviso. Il fail-loud della skill resta la
salvaguardia: mai render senza browser reale.

## Note

- I runner Bash generati dalla skill vivono in `.factory-runners/` (gitignored), non
  inquinano `packages/app`.
- Gli screenshot prodotti vanno nel side-channel `code_quality/reports/<TSK-id>-visual-iter-<N>/`.
