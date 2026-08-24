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

**Aggiornamento 2026-06-03 (TSK-024 — wiki-keeper):** qa-agent ha completato TSK-024 (sprint 3, P1, qa-dev). Nuova suite e2e `packages/app/e2e/emulation-emulatorjs-engine.e2e.ts` (4 test @slow con WasmBoyEngine + ROM `dmg-acid2.gb` MIT): ciclo completo caricamento ROM → avvio reale (canvas + `data-state=running`) → pausa (`data-state=paused`, "In pausa" visibile) → ripresa (canvas visibile, `data-state=running`) → arresto (`data-state=idle`, no leak) + verifica negativa. Suite completa: **15 passed / 0 regressioni** (28.7 s, Chromium). EmulatorJsEngine non esiste nel codice (rimosso TSK-029). Engine reale per GB/GBC = WasmBoyEngine (wasmboy ESM), conforme ADR-005. TSK-024.md → `status: done`.

**Stato finale del gap (2026-06-03):**
- **PARZIALMENTE CHIUSO — GB/GBC:** integrazione engine reale validata end-to-end via WasmBoyEngine (ADR-005 multi-engine, che ha superseded ADR-004 EmulatorJsEngine dopo il fallimento `EJS_Runtime not defined`). e2e verde: TSK-027 (5/5) + TSK-024 (15/15). DoD US-010 chiusa per GB/GBC.
- **APERTO — arcade/libretro:** FBNeo/MAME non coperti da WasmBoy; percorso libretro/RetroArch web rinviato a **EP-009** (gap dedicato: `arcade-emulation-engine`). Nessuna data di chiusura pianificata.

Fonti: `wiki/log.md` §"2026-06-03 — develop TSK-024 (qa)"; ADR-004 (`wiki/concepts/adr-004-emulatorjs-engine.md`); ADR-005 (`wiki/concepts/adr-005-multi-engine-registry.md`). [^src: wiki/log.md §2026-06-03 — develop TSK-024 (qa)]

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

## 2026-06-03 — electron-packaging-toolchain
**Origine:** tpm @ breakdown TSK-053/TSK-056/TSK-057 (EP-006)
**Gap:** il toolchain di packaging Electron non è specificato in alcun documento L4 (architettura, ADR, tech_stack). I candidati sono Electron Forge, electron-builder, o un setup custom. La scelta impatta: configurazione del build step, formato dei distribuibili (NSIS/DMG/AppImage), firma dei pacchetti, e il meccanismo di auto-update (electron-updater di electron-builder vs @electron/update-electron-app vs Squirrel).
**Sospetta fonte:** decisione lead-architect (ADR mancante su confezionamento desktop).
**Impatto:** bloccante per TSK-053 (Electron main process configuration), TSK-056 (bundling core offline), TSK-057 (auto-update). TSK-054 e TSK-055 (NativeFsAdapter + selezione runtime) sono indipendenti e possono procedere. TSK-058 (e2e con IPC mock) può procedere parzialmente.
**Azione richiesta:** lead-architect deve emettere un ADR (o decisione inline) su toolchain Electron prima che i task infra EP-006 possano essere assegnati all'agent.

**CHIUSO 2026-06-03 — ADR-007:** toolchain di packaging adottata = **electron-builder**. Nuovo workspace monorepo `packages/desktop/` (sibling di `packages/app/`), che riusa il `dist/` prodotto da Vite senza modifiche al bundler della SPA. Target: `nsis` (Windows), `dmg`+`zip` (macOS x64+arm64), `AppImage`+`deb` (Linux x64). Publish provider `github` (`soli92/soli-boy`), trigger su tag `v*`, allineato alla policy CD web. Cross-Origin Isolation in Electron via custom protocol `app://` (preferito su `file://`). Core WASM (WasmBoy/mGBA) già ESM-bundled in `packages/app/dist/` — nessun `extraResources` necessario. Code signing = prerequisito human (R.14), non bloccante per il primo release unsigned. [^src: design_&_architecture/decisions/ADR-007.md §Decisione]

## 2026-06-03 — electron-autoupdate-mechanism
**Origine:** tpm @ breakdown TSK-057 (EP-006, US-025)
**Gap:** il meccanismo di aggiornamento automatico dell'app Electron non è specificato in L4. US-025 definisce il "cosa" (rilevamento + applicazione senza reinstallazione + notifica esito) ma non il "come" (electron-updater di electron-builder, @electron/update-electron-app con GitHub Releases, Squirrel, server di update custom). La scelta dipende anche dal toolchain di packaging (`electron-packaging-toolchain`).
**Sospetta fonte:** decisione lead-architect + owner (feed di update: GitHub Releases vs altro).
**Impatto:** bloccante per TSK-057. Dipende dalla chiusura del gap `electron-packaging-toolchain`.
**Azione richiesta:** lead-architect decide il meccanismo di update contestualmente al toolchain di packaging.

**CHIUSO 2026-06-03 — ADR-008:** meccanismo di auto-update adottato = **electron-updater** (pacchetto della famiglia electron-builder) + **GitHub Releases** come canale di distribuzione. Check all'avvio (delay 10 s), periodico (ogni 4-6 h) e manuale da menu. Flusso IPC: eventi `update-available`/`download-progress`/`update-downloaded`/`error` inviati dal main process al renderer via `webContents.send`; UI (toast/banner/progress) in TSK-057. Integrità: verifica SHA-512 automatica sui pacchetti scaricati. Limite documentato: Linux `deb` non auto-updatable (richiede `apt`/privilegi); AppImage è il formato primary su Linux con auto-update completo. Release su tag `v*`, allineato ad ADR-007 e alla policy CD web. [^src: design_&_architecture/decisions/ADR-008.md §Decisione]

## 2026-06-01 — svg-react-import-strategy
**Origine:** tpm @ breakdown TSK-046 (logo header EP-010)
**Gap:** TSK-046 prevede di importare `soliboy-logo-mono.svg` come componente React. `packages/app/vite.config.ts` usa solo `@vitejs/plugin-react` — non è installato/configurato `vite-plugin-svgr` (necessario per l'import `?react` che trasforma SVG in componente React). L'alternativa (import `?url` + `<img src>`) non richiede plugin aggiuntivi ma perde il vantaggio di `currentColor`.
**Sospetta fonte:** decisione implementativa da prendere in TSK-046: (a) installare `vite-plugin-svgr` + aggiornare `vite.config.ts` e `tsconfig`; (b) oppure usare import URL + `<img>` con `aria-label`. Entrambe sono valide; (b) è zero-deps-extra.
**Impatto:** non-bloccante per il task (TSK-046 documenta entrambe le opzioni). L'agent deve scegliere e annotare la decisione. Se sceglie (a), `vite.config.ts` va modificato (fuori scope TSK-042).
**Azione:** risolto inline in TSK-046 (assunzione annotata). Nessun blocco su altri task.

## 2026-06-03 — visual-oracle-adapter-porting (non-bloccante)
**Origine:** framework-upgrade @ integrazione v2.17 (FE Visual Oracle)
**Gap:** il FE Visual Oracle (skill `visual-oracle-protocol` + `oracle-precheck` + comando `/visual-oracle` + runner Playwright) è scaffoldato e mirrorato sugli adapter installati `.claude/` e `.cursor/`. Il porting verso eventuali adapter futuri non installati in questo progetto (Aider, OpenAI/Codex, Gemini) è un gap noto **non-bloccante**: i file scaffoldati sono Markdown puri, ma il runner Playwright + l'invocazione skill vanno adattati alla sintassi command/rules di ciascun adapter. Coerente con la nota del seed §1.quinquies ("per Cursor/Aider/OpenAI/Gemini il porting è un gap noto non-bloccante").
**Sospetta fonte:** scelta di installazione adapter (PATTERN §12, factory.config.yaml.adapters).
**Impatto:** nessuno sugli adapter attivi (`.claude`, `.cursor`). Si materializza solo se in futuro si installa un nuovo adapter.
**Azione richiesta:** al momento dell'eventuale installazione di un nuovo adapter, replicare i 3 artefatti Visual Oracle (skill protocol + precheck + comando) + le sezioni delta nelle skill condivise, seguendo il mapping adapter di PATTERN §12. Nessuna azione richiesta ora.

## 2026-06-05 — ds-color-contrast-cross-cutting-90s-party-dark
**Origine:** scan a11y retroattivo EP-012/TSK-079..083 (verifica WCAG 2.2 AA con `a11y-scan.sh` + axe-playwright).
**Gap:** 3 finding `color-contrast` di severità **Major** (WCAG 1.4.3) sul DS shared `@soli92/solids@1.14.1`, riproducibili stabilmente in mobile-375 e desktop-1280:
  - `.sb-loader > label` (etichetta dropzone FileLoader) — tema `dark` → impatta TSK-003.
  - `.sb-chip-on` (chip filtro attivo, Library) — tema `90s-party` → impatta TSK-038.
  - `.sb-danger.sb-btn` (CTA Arresta, Player) — tema `90s-party` → impatta TSK-014.
  
  Origine cross-cutting (token DS, non componente-specifico) → TSK-040 portatore del gap; effetto trasversale via ThemeSelector (TSK-044) che applica i tre temi.
**Sospetta fonte:** matrice token × tema incompleta nel pacchetto `@soli92/solids` (o assenza di override `sb-*` per i casi mancanti).
**Impatto:** WCAG AA non rispettato sui tre stati nei rispettivi temi. Nessun finding `Critical`; uso possibile ma leggibilità ridotta. Cyberpunk non scansionato in iter-1 (gap secondario, manual check raccomandato).
**Azione richiesta:** patch upstream nei token DS `@soli92/solids` (o override `sb-*` lato `packages/app/src/styles/`) per portare i 3 stati sopra soglia AA. Re-scan a11y dei 5 TSK sorgente (TSK-003, TSK-014, TSK-038, TSK-040, TSK-044). Eseguire anche scan tema `cyberpunk` per chiudere il gap secondario. Auto-fix NON eseguito in questo task (vincolo remediation retroattiva: nessuna modifica `packages/app/`). Gate owner.

**Aggiornamento 2026-06-05 — owned/in-progress:** TSK-084 (EP-012/US-049, Sprint 10, P1, fe, consumer: agent) creato e assegnato per chiudere questo gap. Strategia: override CSS custom properties `sb-*` in `packages/app/src/styles/` per `[data-theme="90s-party"]` e `[data-theme="dark"]`. Include scan cyberpunk (gap secondario). Al completamento di TSK-084, aggiornare questa entry con stato CHIUSO e riferimento al commit.

**Aggiornamento 2026-06-05 — CHIUSO da TSK-084.** Override applicati in `packages/app/src/styles/app-extra.css` (importato in `main.tsx` DOPO `@soli92/solids/dist/css/index.css`, così le custom properties dell'app sovrascrivono effettivamente i token DS). Cinque blocchi:
  - `[data-theme="dark"] --sd-color-primary-default: #3B82F6 → #1d4ed8` + `--sd-color-primary-hover: → #1e40af`. Ratio `.sb-btn-primary` (incl. `.sb-loader > label`) bianco su nuovo blu = **6.70:1** (era 3.67).
  - `[data-theme="dark"] .sb-chip-on { color: #93c5fd }` — compensa lo scuriamento del primary sul chip dark (avrebbe regredito a 2.56:1) → **9.51:1**.
  - `[data-theme="90s-party"] .sb-chip-on { color: #ffd1ff }` (was `#e019dd`) → **10.48:1** (era 3.55).
  - `[data-theme="90s-party"] .sb-danger { color: #ff8fb8; border-color: #ff8fb8 }` (was `#ff0055`) → **7.78:1** (era 4.24).
  - `[data-theme="cyberpunk"] --sd-color-primary-subtle: #0e7490 → #052e36` → `.sb-chip-on` cyan FG su nuovo subtle = **5.96:1** (era 2.21, sub-gap iter-1 incluso).

Re-scan iter-2 (axe-playwright, 3 temi × 2 viewport + scope sintetico): **0 finding `color-contrast` major/critical** su tutte le combinazioni. I 5 TSK sorgente (TSK-003, TSK-014, TSK-038, TSK-040, TSK-044) sono `a11y_status: pass` con report `code_quality/reports/TSK-*-a11y-iter-2.{json,md}`. Sub-gap cyberpunk incluso e risolto. Tracce: `code_quality/reports/ep012-runs/all-runs-iter2.json`, `all-runs-iter2-synthetic.json`, screenshot `iter2-*`. Build `packages/app` verde post-fix.

## 2026-06-09 — app-inputmapping-not-wired-to-player (FINDING#1 TSK-067)
**Origine:** qa-dev @ TSK-067 (e2e mobile smoke)
**Gap:** `App.tsx` crea l'istanza `InputMapping` (variabile locale `input`) ma **non la passa** come prop `inputMapping` al `<Player>`. Di conseguenza `<TouchOverlay>` (montato in Player solo se `inputMapping` è presente — guard `{inputMapping && <TouchOverlay .../>}`) non viene mai renderizzato nel DOM reale, anche su un context touch/mobile. Il componente `TouchOverlay` e il prop `inputMapping` del Player sono stati implementati in TSK-060 con backward-compat (prop opzionale); il wiring in App.tsx è rimasto incompleto.
**Evidenza:** test e2e TSK-067 `Test 1` fallisce con `[data-testid="sb-touch-overlay"]` not found in DOM dopo avvio ROM su context iPhone 13 (mobile, hasTouch:true, pointer:coarse).
**Fix richiesto:** in `packages/app/src/App.tsx`, aggiungere `inputMapping={input}` e `touchConfigStorage={selectedConfig}` alle props di `<Player>`. Non richiede nuove dipendenze. Una riga di modifica.
**Impatto:** bloccante per US-026 (controlli touch su device reale). Tests TSK-067 Test 1, Test 2, Test 4 diventano verdi non appena questo wiring è completato.
**Azione richiesta:** aprire TSK bugfix (layer fe) per completare il wiring App.tsx → Player (inputMapping, touchConfigStorage). TPM da notificare.

## 2026-06-05 — rom-gated-ui-substates-not-exercised-headless
**Origine:** scan a11y retroattivo EP-012/TSK-081 (componenti ROM-gated: Player, controls, SaveStatePanel, Fullscreen, Settings sub-sezioni).
**Gap:** alcuni sub-stati della UI ROM-gated NON sono esercitabili banalmente in Playwright headless e quindi NON sono coperti dallo scan automatico iter-1:
  - Player in stato `fullscreen` attivo (Fullscreen API richiede user gesture realistico; headless concede `requestFullscreen` ma non sempre triggera la state machine completa) → TSK-035.
  - SaveStatePanel con slot popolati + dialog di errore engine-mismatch / not-found (richiede save reale + sequenza che provochi l'errore) → TSK-032.
  - Bugfix loadState (canvas persistente dopo `loadState`) verificato strutturalmente ma sub-stato `loadState completato` non esercitato → TSK-041.
  - Settings rimappatura comandi: `capture keybinding` non esercitato interattivamente → TSK-017.
  - Settings Dati: flusso esito KO `Importa` (file corrotto) non esercitato end-to-end → TSK-033.
**Sospetta fonte:** limite intrinseco dello scan headless retroattivo; copertura completa richiede test interattivi dedicati o auditor manuale con AT reale.
**Impatto:** sub-stati elencati hanno `a11y_status: pass` su axe ma con manual checks aperti (documentati nei report `TSK-{017,032,033,035,041}-a11y-iter-1.{json,md}`).
**Azione richiesta:** manual audit con AT (NVDA/VoiceOver) sui 5 sub-stati elencati prima di rilascio pubblico. In alternativa, estendere la suite e2e (`packages/app/e2e/`) con scenari dedicati che coprano i sub-stati e re-eseguire `a11y-scan.sh` su URL parametrizzati.

## 2026-06-30 10:00 — rtc-real-time-clock-piattaforme-e-giochi
**Origine:** product-manager @ EP-019 (modifica data/ora RTC dell'emulatore)
**Gap:** la wiki non documenta il concetto di Real Time Clock (RTC) interno all'hardware emulato. Né [[piattaforme-e-core-supportati]] né [[save-state-e-sram]] né [[persistenza-locale]] elencano quali piattaforme/giochi al lancio (Nintendo Game Boy / GBC via Gambatte, Nintendo Game Boy Advance via mGBA, arcade FBNeo/MAME) prevedono un RTC interno alla cartuccia/console (es. MBC3 su Game Boy Color: Pokémon Oro/Argento/Cristallo), né come tale stato debba essere persistito in IndexedDB accanto a SRAM e save state, né come debba essere incluso nelle istantanee dei save state. Le specifiche funzionali (RF-10..RF-19) non menzionano l'RTC esplicitamente. EP-019 procede citando i concetti generici di persistenza locale, SRAM/save-state e piattaforme/core supportati.
**Sospetta fonte:** estensione di `raw/2026-06-01-specifiche-funzionali.txt` (sezione "Salvataggi" e "Esecuzione e controlli") o nuovo raw dedicato (es. `raw/.../rtc-cartucce-game-boy.md`) che enumeri (a) quali piattaforme emulate espongono un RTC, (b) quali mapper/cartucce ne sono dotati, (c) il formato di serializzazione atteso dal core (Gambatte/mGBA) e (d) la policy attesa per drift, fuso orario e congelamento durante la pausa.
**Impatto:** non-bloccante. EP-019 e le sue US-065/066/067/068 sono scritte tecnologia-agnostiche ("orologio interno dell'emulatore", "stato dell'RTC", "orologio del dispositivo") e citano i requisiti esistenti più la pagina piattaforme. Una pagina futura (es. `wiki/concepts/rtc-orologio-interno.md`) consoliderebbe la mappa piattaforma↔presenza-RTC↔persistenza e chiuderebbe il gap senza retrofit sulle US già scritte. Bloccante invece per il lead-architect che dovrà decidere il modello di storage (IndexedDB extension, schema del payload RTC) e per il TPM al breakdown TSK.

**Risolto:** 2026-06-30 — ADR-009 + wiki/concepts/rtc-orologio-interno.md. ADR-009 (`design_&_architecture/decisions/ADR-009.md`) ratifica: (1) mappa piattaforma↔RTC (GB no; GBC sì solo su MBC3+RTC via Gambatte/WasmBoy; GBA sì solo su S-3511A via mGBA; arcade fuori scope → EP-009); (2) modello canonico `RtcState` wall-clock UTC `{year,month,day,hour,minute,second}` con formati raw engine-specifici (5 registri MBC3 / 7-byte BCD S-3511A) confinati nei bridge `WasmBoyRtcBridge`/`MgbaRtcBridge`; (3) quinto object store IDB `rtcState` (keyPath `romId`, campi `state`, `updatedAt`, `schemaVersion=1`, cascade-delete su `removeRom`) + campo opzionale `rtcState?` su entry `saveStates` con compat all'indietro; (4) interfaccia `RtcBridge { hasRtc(): boolean; getRtcState(): RtcState|null; setRtcState(state: RtcState): void }` esposta da `EmulatorEngine`; (5) policy: timezone canonico UTC + conversione locale solo in UI, freeze in pausa, freeze on close (no catch-up), sync to device esplicito e locale-only (no rete). Bridge concreti `WasmBoyRtcBridge`/`MgbaRtcBridge` sono TSK Sprint 16 (post EP-019); gli stub `rtcBridge=null` dei TSK-128 restano validi nello Sprint 15.

## 2026-06-28 15:30 — controlli-l-r-shoulder-per-piattaforma
**Origine:** product-manager @ EP-018 (controlli shoulder L/R in tutte le modalità)
**Gap:** la wiki enumera le piattaforme supportate al lancio (Nintendo Game Boy / GBC, Nintendo Game Boy Advance, arcade) in [[piattaforme-e-core-supportati]] e cita i comandi a livello generico in [[requisiti-funzionali-soli-boy]] (RF-12/RF-13) e [[controlli-touch]] (RFM-01), ma non elenca esplicitamente, per ciascuna piattaforma, l'insieme dei pulsanti hardware (in particolare la presenza/assenza dei pulsanti shoulder L e R). EP-018 procede comunque citando i requisiti generici e la presenza del core dedicato alla piattaforma che li espone (mGBA per GBA).
**Sospetta fonte:** raw/2026-06-01-specifiche-funzionali.txt §1.3 + tabelle hardware delle piattaforme citate (eventualmente nuovo raw di riferimento hardware per piattaforma).
**Impatto:** non-bloccante. EP-018 e le sue US-062/063/064 sono in `status: ready` e citano i requisiti esistenti più la pagina piattaforme. Una pagina futura (es. `wiki/concepts/comandi-hardware-per-piattaforma.md`) consoliderebbe la mappa pulsanti↔piattaforma e chiuderebbe il gap senza retrofit sulle US già scritte.

## 2026-07-03 — wcag255-touch-target-tab-buttons
**Origine:** qa-dev @ TSK-167 / ep022-fidelity-audit.e2e.ts S5
**Gap / Bug:** 8 elementi interattivi con height < 44px rilevati da ep022-fidelity-audit.e2e.ts S5 su TUTTI i viewport (mobile-portrait, mobile-landscape, tablet, desktop). Dettaglio: 4 tab buttons (Play/Libreria/Impostazioni/Info & Privacy) = 28px; ThemeSwitcher header = 32px; Avvia = 36px; Schermo intero = 36px; Vai alla Libreria = 32px. La soglia S5 è ≤3 violazioni; le attuali sono 8. WCAG 2.5.5 richiede touch target minimo 44×44 CSS px.
**Causa root:** Radix TabsTrigger/shadcn default height `h-9` (36px) è sotto soglia. In App.tsx le classi passate a TabsTrigger non includono un override `min-h-[44px]`. Gli altri pulsanti (Avvia, Schermo intero, ThemeSwitcher) usano altezze hard-coded < 44px nei rispettivi componenti.
**Impatto:** medio-alto per mobile UX. Tapping accuracy ridotta su touchscreen. S5 è un gate nel test di fidelity audit (ep022-fidelity-audit.e2e.ts) — blocca `npm run e2e:ci` verde.
**Azione richiesta (TPM):** aprire TSK fe layer, P1: (1) `min-h-[44px]` su TabsTrigger in App.tsx; (2) `min-h-[44px]` su ThemeSwitcher button; (3) revisione Avvia/Schermo intero/Vai alla Libreria buttons. Fix separato dal centering bug (gap tablist-play-tab-overflow-centering-bug).
**File di riferimento:** `packages/app/e2e/ep022-fidelity-audit.e2e.ts:229` (S5), `packages/app/src/App.tsx` (TabsTrigger), `packages/app/src/components/ThemeSwitcher/`.

## 2026-07-03 — tablist-play-tab-overflow-centering-bug
**Origine:** qa-dev @ TSK-167 (e2e portrait navbar)
**Gap / Bug:** `TabsList` in `packages/app/src/components/ui/tabs.tsx` include `justify-content: center` nel set di classi di default (shadcn preset). Combinato con `overflow-x: auto` applicato via App.tsx, quando i 4 tab totalizano ~272px su un nav di ~213px (viewport 390px), il centering posiziona il tab "Play" (primo, leftmost) a x≈94px nel viewport — parzialmente sotto il logo (img.sb-logo, x≈24–137px). Il logo img (non pointer-events:none) intercetta i click Playwright a quella coordinata. L'effetto è che il tab "Play" non è visibile/cliccabile via pointer events standard su mobile portrait al di fuori del fix TSK-166 (è un bug pre-esistente, separato dal fix ThemeSwitcher).
**Riproduzione:** `test.use({ viewport: { width: 390, height: 844 } })` → navigare su Libreria → tentare `page.getByRole('tab', { name: 'Play' }).click()` → intercepted by logo. `getBoundingClientRect()` del tab Play: `{ x: 93.625, y: 22, width: 49, height: 28 }`. Logo: `{ x: 24, width: ~113 }` → overlap.
**Causa root:** `justify-content: center` in `packages/app/src/components/ui/tabs.tsx` (linea ~8) non viene overridden dalla classe `bg-transparent` aggiunta in App.tsx; `justify-content` va overridden esplicitamente (es. `justify-start` o `justify-content: flex-start`).
**Workaround in TSK-167:** uso di keyboard navigation (`press('ArrowLeft')` su Libreria → attiva Play via Radix rover) per testare il cambio di stato Tabs indipendentemente dall'occlusione visiva.
**Sospetta fonte:** `packages/app/src/components/ui/tabs.tsx` default classes; fix = aggiungere `justify-start` alle classi di override in `App.tsx` `TabsList` o rimuovere `justify-center` dalla primitiva.
**Impatto:** medio. Il tab Play NON è cliccabile con tap a centro-schermo su iPhone 14 Pro portrait quando si trova alla sinistra del nav overflowed con centering. Impatta l'UX reale (tap touch). Va aperto TSK separato (layer: fe, priority: P1).
**Azione richiesta (TPM):** aprire TSK fe layer, P1, fix `justify-content` su TabsList in App.tsx o tabs.tsx; US-105 o nuova US.

## 2026-08-24 — dangling-concept batch (sweep-reviews EP-056 battle-test)

**Origine:** sweep-reviews (EP-056) — pass di qualità semantica su `wiki/`. Detector ha
rilevato 29 wikilink `[[X]]` verso pagine inesistenti. Nessuno è typo/variante di una pagina
soli-boy esistente (verifica manuale sulle pagine referenzianti): sono concetti del
**meta-framework factory** (o di prodotti esterni) citati come cross-reference ma privi di
pagina-concetto locale e privi di una fonte in `raw/` che li supporti. Risoluzione onesta =
gap (nessuna pagina fabbricata, coerente con `sweep-reviews-protocol` §dangling-concept:
"crea stub SE supportato da ≥1 fonte, altrimenti apri gap").

### Cluster A — pattern/architettura del compression layer e framework
- [[circuit-breaker]] — referenziato da concepts/factory-compression-layer.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[code-quality-review-layer]] — referenziato da concepts/factory-compression-layer.md, runbooks/accessibility-testing-runbook.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[evaluator-optimizer]] — referenziato da concepts/factory-compression-layer.md, runbooks/ux-ui-design-runbook.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[federated-topology]] — referenziato da concepts/factory-compression-layer.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[orchestrator-workers]] — referenziato da concepts/factory-compression-layer.md, concepts/knowledge-graph-codebase.md, syntheses/token-reduction-tools.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[parallel-scheduler]] — referenziato da concepts/factory-compression-layer.md, concepts/token-compression.md, runbooks/accessibility-testing-runbook.md, runbooks/compression-validation-template.md, syntheses/token-reduction-tools.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test). Nota: esiste la skill `.claude/skills/parallel-scheduling.md` (namespace diverso, nome diverso); non è una pagina-concetto wiki, quindi il link resta dangling e non è un typo correggibile.
- [[stack-aware-ruleset]] — referenziato da concepts/factory-compression-layer.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[sync-adapters]] — referenziato da concepts/factory-compression-layer.md, concepts/knowledge-graph-codebase.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[verifier-as-gate]] — referenziato da concepts/factory-compression-layer.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)

### Cluster B — riferimenti a source/deep-dive con prefisso data (raw senza pagina wiki)
- [[2026-05-28-caveman-deep-dive]] — referenziato da concepts/factory-compression-layer.md ma assente (source `raw/caveman_deep_dive.md` non promosso a pagina wiki) — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[2026-05-28-graphify-deep-dive]] — referenziato da concepts/factory-compression-layer.md ma assente (source `raw/graphify_deep_dive.md` non promosso a pagina wiki) — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[2026-06-03-accessibility-testing-capability]] — referenziato da runbooks/accessibility-testing-runbook.md ma assente (source `raw/accessibility-testing-capability.md` non promosso) — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[2026-06-03-ux-ui-capability]] — referenziato da runbooks/ux-ui-design-runbook.md, runbooks/ux-ui-review-runbook.md ma assente (source `raw/ux-ui-capability.md` non promosso) — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[migration-v214]] — referenziato da concepts/factory-compression-layer.md, runbooks/compression-validation-template.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[migration-v214-fase2]] — referenziato da concepts/factory-compression-layer.md, runbooks/graphify-installation.md, runbooks/wiki-as-graph-poc-template.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)

### Cluster C — capability a11y / UX-UI importate (concetti generici, non prodotto)
- [[accessibility-testing-capability]] — referenziato da runbooks/accessibility-testing-runbook.md, runbooks/ux-ui-design-runbook.md, runbooks/ux-ui-review-runbook.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[axe-core]] — referenziato da runbooks/accessibility-testing-runbook.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[wcag-automated-coverage-limit]] — referenziato da runbooks/accessibility-testing-runbook.md, runbooks/ux-ui-review-runbook.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[ux-ui-review-design-capability]] — referenziato da runbooks/accessibility-testing-runbook.md, runbooks/ux-ui-design-runbook.md, runbooks/ux-ui-review-runbook.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[ux-ui-rubric-anti-subjectivity]] — referenziato da runbooks/ux-ui-design-runbook.md, runbooks/ux-ui-review-runbook.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[correctness-oracle]] — referenziato da runbooks/ux-ui-design-runbook.md, runbooks/ux-ui-review-runbook.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[design-token]] — referenziato da runbooks/ux-ui-design-runbook.md, runbooks/ux-ui-review-runbook.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test). Nota: esiste concepts/temi-e-design-token-solids.md ma è il concetto SoliDS-specifico di prodotto, distinto dal design-token generico citato in questi runbook di capability → non è un typo correggibile.

### Cluster D — pattern wiki-as-graph / llm-wiki
- [[citation-grounded]] — referenziato da runbooks/wiki-as-graph-poc-sub-corpus-snapshot.md, runbooks/wiki-as-graph-poc-template.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[llm-wiki-pattern]] — referenziato da runbooks/wiki-as-graph-poc-template.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[promotion-pipeline]] — referenziato da runbooks/wiki-as-graph-poc-template.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)

### Cluster E — persone/entità del framework
- [[andrej-karpathy]] — referenziato da concepts/factory-compression-layer.md, concepts/knowledge-graph-codebase.md, entities/graphify.md, syntheses/token-reduction-tools.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)

### Cluster F — content-share / soli-frames (prodotto esterno)
- [[content-share-hub-pattern]] — referenziato da runbooks/content-share-setup.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[soli-frames]] — referenziato da runbooks/content-share-setup.md ma assente (repo/prodotto esterno) — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)
- [[soli-frames-integration]] — referenziato da runbooks/content-share-setup.md ma assente — aperto 2026-08-24 (sweep-reviews EP-056 battle-test)

**Nota di verifica (onestà detection):** il detector battle-test `sweep_detect.py` conta i
`[[...]]` grezzi nelle pagine e **non** implementa l'esenzione "presente in `wiki/gaps.md`"
prevista dal `sweep-reviews-protocol` (§Categorie: dangling = link inesistente *e* non in
gaps.md). Di conseguenza, dopo questa registrazione il conteggio grezzo resta 29: le 29
occorrenze vivono ancora nelle pagine sorgente (non sono state fabbricate pagine né rimossi i
link dai design-doc). La risoluzione onesta qui è il **tracciamento** in gaps.md, non
l'azzeramento del contatore ingenuo. Feedback per l'hardening EP-056: il detector dovrebbe
escludere gli slug già tracciati in `wiki/gaps.md` (e la stessa `gaps.md` come pagina-sorgente).

