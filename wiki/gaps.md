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
**Aggiornamento 2026-06-01:** ROM libera ottenuta (dmg-acid2.gb, MIT) + e2e reale scaffoldato (opt-in SOLIBOY_E2E_REAL=1). Import/libreria/Player UI funzionano; **EmulatorJS reale NON inizializza in headless**: `EJS_ready` non emesso (timeout surfacato correttamente come errore). loader.js @4.2.1 raggiungibile (200). Tentativi senza effetto: COEP `credentialless`, `EJS_player` come selettore CSS. Causa non isolata → serve debug con console/network del browser e, probabilmente, **self-host dei core** (same-origin) anziché CDN. Gap RESTA APERTO.

**Aggiornamento 2026-06-01 (debug):** causa del CDN isolata = **ORB/COEP** blocca le sottorisorse interne di EmulatorJS (`emulator.min.js`, core). **Risolto** con **self-host same-origin**: `npm run setup:emu` copia `@emulatorjs/emulatorjs/data` + scarica `emulator.min.js` e `gambatte-wasm.data` in `public/emulatorjs/data/` (gitignorato); `EJS_pathtodata=/emulatorjs/data/`. Ora EmulatorJS **si inizializza completamente** (EJS_emulator + menu controlli + virtual gamepad). **Blocco residuo**: `EJS_Runtime is not defined!` + `Could not fetch core report JSON` → il **runtime del core WASM non si carica** (nessun canvas in headless). Lead: verificare decompressione/caricamento core (report JSON dei core, variante threads vs non-threads, possibile limite WebGL/WASM in Chromium headless); validare in browser **headed**. Gap RESTA APERTO (molto avanzato).

**Risolto 2026-06-01:** pivot a **WasmBoy** (ADR-005). Emulazione **GB/GBC reale** funzionante e verificata in e2e (`?engine=real` + `dmg-acid2.gb`, canvas reso, 5/5 e2e verdi). EmulatorJS abbandonato (gap superato). GBA tracciato in TSK-028; arcade in gap `arcade-emulation-engine`/EP-009.

## 2026-06-01 16:45 — design-system-real-package
**Origine:** fe-dev @ wiring stile app
**Gap:** l'app importa un tema SoliDS *approssimato* (vendorizzato dai mockup, `src/styles/solids-theme.css`) perché il pacchetto reale `@soli92/solids` non è disponibile/installato. Colori e alcune classi sono approssimati.
**Sospetta fonte:** pacchetto npm `@soli92/solids` (privato) — da fornire/installare.
**Impatto:** non-bloccante (UI ora leggibile/stilizzata); sostituire con `@import "@soli92/solids/css/index.css"` + rimuovere il tema approssimato quando il pacchetto è disponibile.

**CHIUSO 2026-06-01 (TSK-040):** `npm i @soli92/solids` ora risolve dal registry (1.14.1, `dist/css/*` presente; Q_001 chiusa). `main.tsx` importa `@soli92/solids/css/index.css` (token/temi/utilities/shadcn reali, autoritativo); `solids-theme.css` ha perso i blocchi colore `:root`/`[data-theme]` approssimati e tiene solo classi app `sb-` + scale token di fallback. Build+test verdi (49 unit + 6 e2e). DS reale in produzione.


**Aggiornamento 2026-06-01 (debug 2):** confermato che fallisce **anche in browser headed** (utente): "Error loading EmulatorJS runtime" / `EJS_Runtime is not defined`. NON è né versione né headless. Provati senza successo: self-host npm+CDN, `EJS_threads=false`, core variante threaded e non-threaded, build **coerente** stable (`emulator.min.zip` esteso in `data/`), min vs non-min. Sintomo costante: "Could not fetch core report JSON" + il runtime del core non si estrae/definisce. Cause residue da indagare (sessione dedicata): caricamento/decompressione del core EmulatorJS (modulo `compression/` + endpoint cores report), MIME `application/wasm`, eventuale necessità di un manifest `cores`/`version` specifico, o quirk noto di self-host EJS (consultare doc/community EmulatorJS). Engine config (threads=false, startOnLoaded, selettore, pathtodata locale) lasciata come base. Gap RESTA APERTO.

## 2026-06-01 17:35 — arcade-emulation-engine
**Origine:** lead-architect @ ADR-005
**Gap:** FBNeo/MAME (arcade) non hanno una libreria ESM standalone (come WasmBoy per GB); girano via libretro (EmulatorJS/RetroArch). Decisione: **rinvio** a epica dedicata (EP-009); il registry instrada l'arcade a "non ancora supportato".
**Sospetta fonte:** percorso libretro/RetroArch web (umbrella) da valutare in EP-009.
**Impatto:** non-bloccante per GB/GBA; le specifiche elencano arcade al lancio → rischio di scope da concordare con owner.

## 2026-06-01 — wasmboy-loadstate-canvas-lost
**Origine:** qa @ TSK-034
**Gap:** `WasmBoy.loadState()` rimuove il canvas dal DOM dopo il restore. Sintomo verificato a runtime nell'e2e `emulation-save.e2e.ts`: dopo aver chiamato `handleLoad` (slot occupato, nessun `role="alert"` di errore emesso), il canvas `.sb-screen canvas` scompare dal DOM (locator non trovato in 5 s). Il save state è scritto correttamente in IndexedDB (test "salva → slot occupato" verde); il problema è nel flusso `WasmBoy.loadState()` → il canvas viene de-montato/rimpiazzato internamente da WasmBoy durante il restore. Il `SaveStatePanel` non emette un `role="alert"` (quindi dal punto di vista UI non è un errore visibile: è un glitch di canvas DOM silenzioso). Il test e2e corrispondente è marcato `test.fixme`.
**Impatto:** bloccante per US-016 AC3 ("ripristinare un save state e riprendere esattamente da quello stato"). Il save (AC1/AC2) è verificato verde. Fix richiede: (a) indagare il comportamento di `WasmBoy.loadState()` sul canvas (riconfigurazione interna?), (b) eventuale re-init del canvas / re-render nel Player dopo restore.
**Azione richiesta:** aprire TSK bugfix in EP-004 (layer be, target WasmBoyEngine o Player) prima di chiudere US-016.

**CHIUSO 2026-06-01 — TSK-041:** la causa reale NON era `WasmBoy.loadState()` ma un anti-pattern React↔DOM imperativo nel Player: `.sb-screen` veniva passato all'engine come container DOM ma ospitava anche figli React (placeholder testuale + overlay scanline). Il `<canvas>` appeso imperativamente da `WasmBoyEngine.ensureCanvas` era un nodo non gestito tra fratelli React; i re-render successivi a `SaveStatePanel.handleLoad` (toggle `busy` / `message`) facevano riconciliare i figli di `.sb-screen` e il canvas veniva rimosso/clobberato. Fix engine-agnostico: isolato il canvas in un host React-VUOTO dedicato (`<div ref={canvasHostRef} className="sb-canvas-host" />`) reso dentro `.sb-screen`, passato all'engine come container al posto di `screenRef.current`. Verifica reale `npm run e2e`: **8/8 verdi** (era 7/8 + 1 fixme), test "salva → carica → canvas visibile" VERDE con engine reale (`dmg-acid2.gb`). `core/wasmboy-engine.ts` non modificato. US-016 AC3 verificata. TSK-034 → done.

## 2026-06-01 19:20 — gba-runtime-verification
**Origine:** be-dev @ TSK-028
**Gap:** MgbaEngine (GBA, @thenick775/mgba-wasm MPL-2.0) implementato contro l'API documentata e registrato (selectEngine mgba→MgbaEngine), build/typecheck verdi, ma NON verificato a runtime: manca una ROM GBA libera in public/test-roms/ per l'e2e (emulation-gba.e2e.ts, skip finché assente).
**Sospetta fonte:** ROM GBA homebrew/free (es. demo libere) da aggiungere + whitelist .gitignore.
**Impatto:** non-bloccante; GB già reale. GBA da validare quando si fornisce una ROM libera (l'e2e passerà da skip a verde).

**Risolto 2026-06-01:** ROM GBA libera ottenuta (gba-tests-thumb.gba, MIT, jsmolka/gba-tests). e2e reale verde: mGBA (MgbaEngine, ?engine=real) rende il canvas → **GBA reale verificato**. 6/6 e2e verdi (4 stub + GB WasmBoy + GBA mGBA).

## 2026-06-01 — ci-cd-pipeline-definition
**Origine:** product-manager @ definizione EP-011 (CI/CD)
**Gap:** la wiki non documenta una pipeline CI/CD per soli-boy. Il repository non contiene `.github/workflows/`; lo stack ([[stack-tecnologico-soli-boy]]) elenca le tecnologie (TS, Vite, Vitest, Playwright) ma non i job CI specifici, la matrice OS/Node, il trigger (push/PR/tag), i runner e l'orchestrazione delle fasi (install → typecheck → unit → e2e → build). [[distribuzione-web-e-desktop]] cita solo che la SPA è servita come web app e incapsulata in Electron.
**Sospetta fonte:** runbook/ADR ancora da scrivere per la pipeline (es. `wiki/runbooks/ci-pipeline.md`) + decisioni di topologia (GitHub Actions hosted vs self-hosted, parallelism, cache strategy).
**Impatto:** non-bloccante per la definizione PM dell'epica (storia inquadrabile a livello "cosa", non "come"); bloccante per il TPM che dovrà scomporre in TSK senza inventare dettagli operativi (matrice, versioni, action specifiche). Risolvere in design/architettura prima del breakdown TSK.

**CHIUSO 2026-06-01 — decisioni ratificate dall'owner (TPM Sprint 6):** GitHub Actions, workflow `.github/workflows/ci.yml`, trigger push+PR verso `main`, runner `ubuntu-latest`, Node 20 LTS, steps: checkout→setup-node (cache npm)→npm ci→typecheck→unit (vitest)→install Playwright chromium→e2e (chromium)→build. Working-directory `packages/app`. ROM e2e: MIT già in `public/test-roms/`. Implementato in TSK-049.

## 2026-06-01 — branch-protection-policy
**Origine:** product-manager @ definizione EP-011 (CI/CD)
**Gap:** la wiki cita R.14 "VCS gate umano" come vincolo della factory ma non documenta una policy esplicita di branch protection su `main` per soli-boy (chi può mergiare, quanti reviewer, status check obbligatori, linear history sì/no, signed commits sì/no, blocco force-push).
**Sospetta fonte:** policy di governance del repo `soli92/soli-boy` (impostata via UI GitHub o `repository_rulesets`) ancora da definire e tracciare in wiki.
**Impatto:** non-bloccante per definire la storia ("la main richiede CI verde prima del merge"); bloccante per implementazione tecnica esatta (numero approvers, status check names) → da definire con l'owner prima del TSK.

**CHIUSO 2026-06-01 — decisioni ratificate dall'owner (TPM Sprint 6):** status check obbligatorio = job `ci` del workflow CI; nessuna review obbligatoria (repo single-committer); no force-push; no cancellazione `main`; PR obbligatoria. Configurazione effettiva è gate umano (R.14/R.15). Descritta in TSK-050.

## 2026-06-01 — vercel-deploy-trigger-policy
**Origine:** product-manager @ definizione EP-011 (CD)
**Gap:** [[distribuzione-web-e-desktop]] e `packages/app/vercel.json` (presente nel repo, solo header COOP/COEP) confermano Vercel come target di deploy ma la wiki non documenta la policy di Continuous Deployment: trigger (push su main? tag `v*`? release GitHub?), ambienti (preview vs production), gestione segreti, dominio.
**Sospetta fonte:** decisione di product/owner + integrazione GitHub↔Vercel (project linking) da formalizzare in runbook.
**Impatto:** non-bloccante per la storia ("deploy del frontend su Vercel con header COOP/COEP"); bloccante per gli AC operativi dei TSK → da definire prima del breakdown.

**CHIUSO 2026-06-01 — decisioni ratificate dall'owner (TPM Sprint 6):** deploy produzione su tag `v*`, deploy preview automatico su PR. Output: dist di `packages/app`. Segreti GitHub necessari: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (creazione = gate umano). `packages/app/vercel.json` (COOP/COEP) non modificato. Implementato in TSK-051.

## 2026-06-01 — svg-react-import-strategy
**Origine:** tpm @ breakdown TSK-046 (logo header EP-010)
**Gap:** TSK-046 prevede di importare `soliboy-logo-mono.svg` come componente React. `packages/app/vite.config.ts` usa solo `@vitejs/plugin-react` — non è installato/configurato `vite-plugin-svgr` (necessario per l'import `?react` che trasforma SVG in componente React). L'alternativa (import `?url` + `<img src>`) non richiede plugin aggiuntivi ma perde il vantaggio di `currentColor`.
**Sospetta fonte:** decisione implementativa da prendere in TSK-046: (a) installare `vite-plugin-svgr` + aggiornare `vite.config.ts` e `tsconfig`; (b) oppure usare import URL + `<img>` con `aria-label`. Entrambe sono valide; (b) è zero-deps-extra.
**Impatto:** non-bloccante per il task (TSK-046 documenta entrambe le opzioni). L'agent deve scegliere e annotare la decisione. Se sceglie (a), `vite.config.ts` va modificato (fuori scope TSK-042).
**Azione:** risolto inline in TSK-046 (assunzione annotata). Nessun blocco su altri task.
