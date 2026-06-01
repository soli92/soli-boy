---
type: gap
status: draft
created: 2026-06-01
updated: 2026-06-01
append_only: true
---

# Gaps — informazioni assenti in wiki/

File **append-only condiviso in scrittura** fra `wiki-keeper`, `product-manager`,
`lead-architect`, `tpm`, `wiki-query`. Canale formale del wiki feedback loop (vedi
`PATTERN.md §10`).

## Quando appendere

Quando un agente — durante una produzione qualsiasi — scopre che una conoscenza
necessaria **non è presente in `wiki/`** e non può essere inventata.

## Entries

_(nessun gap registrato al bootstrap)_

## 2026-06-01 19:50 — palette-brand-da-verificare
**Origine:** wiki-keeper @ ingest brand-kit (raw/soliboy-brand/)
**Gap:** la palette del brand kit deriva dal tema cyberpunk SoliDS e non è verificata sui brand asset ufficiali (`soli-icons`, pacchetto npm). Tonalità esatte da confermare.
**Sospetta fonte:** brand asset ufficiali Soli (`soli-icons`) — non ancora forniti in raw/.
**Impatto:** non-bloccante. Logo/icone usabili; allineare le tonalità (e l'export PNG con font reali) prima del rilascio brand-definitivo.

## 2026-06-01 20:10 — e2e-browser-runtime
**Origine:** qa-dev @ TSK-011/TSK-019
**Gap:** i test e2e sono implementati a livello di integrazione modulo (vitest+jsdom/node, engine fake). Manca un vero e2e browser con Playwright + EmulatorJS reale che esegua una ROM end-to-end.
**Sospetta fonte:** nessuna (richiede setup tooling: Playwright + harness EmulatorJS, fuori dal Core web MVP corrente).
**Impatto:** non-bloccante. Il flusso è coperto a livello logico; il browser-e2e è follow-up pre-release.
**Risolto:** 2026-06-01 — e2e Playwright (Chromium) in `packages/app/e2e/app.e2e.ts`: 4 spec verdi (avviso legale, carica→avvia→pausa, file non supportato, rimappatura). Engine = StubEngine. La validazione dell'emulazione *reale* (EmulatorJS WASM + ROM) è tracciata nel nuovo gap `emulatorjs-real-integration`.

## 2026-06-01 20:55 — emulatorjs-real-integration
**Origine:** qa-dev @ e2e setup (StubEngine)
**Gap:** l'app usa `StubEngine` (placeholder); manca l'adapter EmulatorJS reale (core Libretro WASM) che esegua davvero una ROM. L'e2e valida UI/flusso ma non l'emulazione effettiva.
**Sospetta fonte:** integrazione EmulatorJS (CDN/npm) + ROM di test legittima; richiede design dell'adapter `EmulatorEngine` reale.
**Impatto:** non-bloccante per l'UI del Core web MVP; bloccante per la giocabilità reale → prioritario nel prossimo ciclo dev.
