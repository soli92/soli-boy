---
id: log
type: log
title: Wiki Log
status: draft
created: 2026-06-01
updated: 2026-06-03
sources: []
tags: [audit]
---

# Wiki Log

Audit trail append-only. Una riga per operazione canonica (ingest, query salvata
come synthesis, lint report, plan/design/execute run, promote). Formato:

`YYYY-MM-DD HH:MM | <agent> | <operazione> | <target> | <note>`

## Entries

2026-06-01 | factory-bootstrap | bootstrap | soli-boy | Factory llm-wiki++ v2.15 scaffoldata (topology full-stack-agents, adapters claude+cursor, compression OCL+CCL ON, CQRL ON, scheduler ON, vcs github).

## [2026-06-01] ingest | Soli-boy_Specifiche_Funzionali.docx
Pagine create: 15 | Figure: 0 | Aggiornamenti: 1 (index.md) | Gap nuovi: 0 | Gap chiusi: 0

## [2026-06-01] ingest | Soli-boy_Integrazione_Mobile.docx
Pagine create: 7 | Figure: 0 | Aggiornamenti: 3 (distribuzione-web-e-desktop, requisiti-funzionali, index.md) | Gap nuovi: 0 | Gap chiusi: 0

[2026-06-01 13:00] plan — EP-001 created (6 stories) — files touched: 7
[2026-06-01 13:00] plan — EP-002 created (3 stories) — files touched: 4
[2026-06-01 23:30] review TSK-038 iter-2 → passed
[2026-06-01 13:00] plan — EP-003 created (6 stories) — files touched: 7
[2026-06-01 13:00] plan — EP-004 created (4 stories) — files touched: 5
[2026-06-01 13:00] plan — EP-005 created (3 stories) — files touched: 4
[2026-06-01 13:00] plan — EP-006 created (3 stories) — files touched: 4
[2026-06-01 13:00] plan — EP-007 created (7 stories) — files touched: 8
[2026-06-01 13:00] plan — EP-008 created (3 stories) — files touched: 4
[2026-06-01 14:00] design — Core web MVP (BE/FE/DB/API EP-001+EP-003) + ADR-001/002/003 — files touched: 9

## [2026-06-01] ingest | soliboy-mockups (UI SoliDS, 18 schermate)
Pagine create: 6 | Figure: 0 | Aggiornamenti: 2 (solids, index.md) | Gap nuovi: 0 | Gap chiusi: 0

[2026-06-01 15:00] execute — sprint 1 (11 task) + sprint 2 lookahead (8 task) per EP-001+EP-003 — files touched: 20

## 2026-06-01 16:00 — publish github (created=8, updated=0)
**Operatore:** github-publisher
**Provider:** github @ soli92/soli-boy
**Operazioni:**
- CREATE (milestone): EP-001..EP-008 → github:milestone-2..9
- SKIP (scope): US×35, TSK×19 (publish limitato alle epiche su richiesta)
**Link al provider:** https://github.com/soli92/soli-boy/milestones

## 2026-06-01 17:00 — develop TSK-001
**Agente:** db-dev
**TSK:** [[../management/kanban/EP-001-gestione-file-di-gioco/US-004-persistenza-libreria/TSK-001]]
**Layer:** db
**Code path:** ./packages/app/
**Files touched:** 3 (src/storage/types.ts, src/storage/db.ts, src/storage/db.test.ts)
**Commit:** n/a (gate VCS umano pendente)
**DoD:** pass — typecheck OK, 4/4 test store `roms` verdi (fake-indexeddb)
**Note:** Schema 4 store (roms/saveStates/sram/config) creato; CRUD su `roms`. Id = hash FNV-1a del contenuto (idempotente).

## 2026-06-01 17:00 — develop TSK-004
**Agente:** be-dev
**TSK:** [[../management/kanban/EP-001-gestione-file-di-gioco/US-002-riconoscimento-piattaforma/TSK-004]]
**Layer:** be
**Code path:** ./packages/app/
**Files touched:** 3 (src/domain/types.ts, src/domain/platform-recognition.ts, src/domain/platform-recognition.test.ts)
**Commit:** n/a (gate VCS umano pendente)
**DoD:** pass — typecheck OK, 7/7 test verdi (anticipa il deliverable di TSK-010)
**Note:** Mapping estensione/contenuto→core (Gambatte/mGBA/FBNeo). Magic GBA 0x96@0xB2 prevale su estensione ambigua; non supportato→reason.

## 2026-06-01 17:00 — develop TSK-006
**Agente:** fe-dev
**TSK:** [[../management/kanban/EP-001-gestione-file-di-gioco/US-006-avviso-no-copyright/TSK-006]]
**Layer:** fe
**Code path:** ./packages/app/
**Files touched:** 4 (src/components/LegalNotice.tsx, src/components/LegalNotice.test.tsx, src/App.tsx, src/main.tsx)
**Commit:** n/a (gate VCS umano pendente)
**DoD:** pass — typecheck OK, 2/2 test verdi (@testing-library/react)
**Note:** Componente LegalNotice riusabile su classi solids (sb-note); role=note/aria-label. Scheletro app minimo aggiunto.

- 2026-06-01 17:30 — `review TSK-001 iter-1 → conditional`
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/vite 5.x (conf 0.95)
  - Finding: {high:0, medium:1, low:1}, dedup:0 · Report: [report](../code_quality/reports/TSK-001-iter-1.md)
- 2026-06-01 17:30 — `review TSK-004 iter-1 → pass`
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/vite 5.x (conf 0.95)
  - Finding: {high:0, medium:0, low:1}, dedup:0 · Report: [report](../code_quality/reports/TSK-004-iter-1.md)
- 2026-06-01 17:30 — `review TSK-006 iter-1 → pass`
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/react 18.3 (conf 0.95)
  - Finding: {high:0, medium:0, low:1}, dedup:0 · Report: [report](../code_quality/reports/TSK-006-iter-1.md)

## 2026-06-01 17:50 — develop TSK-001 (correction)
**Agente:** db-dev
**TSK:** [[../management/kanban/EP-001-gestione-file-di-gioco/US-004-persistenza-libreria/TSK-001]]
**Layer:** db
**Code path:** ./packages/app/
**Files touched:** 2 (src/storage/db.ts, src/storage/db.test.ts)
**Commit:** n/a (gate VCS umano pendente)
**DoD:** pass — re-Develop su task_package iter 2; typecheck OK, 13/13 test verdi
**Note:** Fix CQRL: listRoms usa index by_platform (TS-DESIGN-002); __resetDBForTests → closeDB() API prod (TS-DESIGN-001). Nessun refactor opportunistico (max_diff_lines 80 rispettato).
- 2026-06-01 17:55 — `review TSK-001 iter-2 → pass`
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/vite 5.x (conf 0.95)
  - Finding: {high:0, medium:0, low:0}, dedup:0 · Report: [report](../code_quality/reports/TSK-001-iter-2.md)

## 2026-06-01 18:10 — develop TSK-002
**Agente:** be-dev
**TSK:** [[../management/kanban/EP-001-gestione-file-di-gioco/US-004-persistenza-libreria/TSK-002]]
**Layer:** be
**Code path:** ./packages/app/
**Files touched:** 4 (src/storage/port.ts, src/storage/indexeddb-adapter.ts, src/domain/rom-library.ts, src/domain/rom-library.test.ts)
**Commit:** n/a (gate VCS umano pendente)
**DoD:** pass — typecheck OK, 21/21 test verdi (3 nuovi rom-library)
**Note:** StoragePort (ADR-002) + adapter IndexedDB + dominio importRom (riconosce→persiste). Test con StoragePort in-memory.

## 2026-06-01 18:10 — develop TSK-007
**Agente:** be-dev
**TSK:** [[../management/kanban/EP-003-esecuzione-e-controlli/US-010-avvio-emulazione/TSK-007]]
**Layer:** be
**Code path:** ./packages/app/
**Files touched:** 2 (src/core/core-wrapper.ts, src/core/core-wrapper.test.ts)
**Commit:** n/a (gate VCS umano pendente)
**DoD:** pass — typecheck OK, 21/21 test verdi (5 nuovi core-wrapper)
**Note:** CoreWrapper (ADR-003): resolveCore (riusa PlatformRecognition) + lifecycle load/start su EmulatorEngine pluggable (EmulatorJS in runtime). Esegue solo file utente.

- 2026-06-01 18:20 — `review TSK-002 iter-1 → pass`
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/vite 5.x (conf 0.95)
  - Finding: {high:0, medium:0, low:0}, dedup:0 · Report: [report](../code_quality/reports/TSK-002-iter-1.md)
- 2026-06-01 18:20 — `review TSK-007 iter-1 → pass`
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/vite 5.x (conf 0.95)
  - Finding: {high:0, medium:0, low:1}, dedup:0 · Report: [report](../code_quality/reports/TSK-007-iter-1.md)

## 2026-06-01 18:50 — develop TSK-009
**Agente:** be-dev · **Layer:** be · **Code path:** ./packages/app/
**TSK:** [[../management/kanban/EP-003-esecuzione-e-controlli/US-015-controllo-audio/TSK-009]]
**Files touched:** 2 (src/core/core-wrapper.ts, src/core/core-wrapper.test.ts)
**Commit:** n/a (gate VCS umano pendente) · **DoD:** pass — typecheck OK, 29/29 test verdi
**Note:** CoreWrapper.setAudio(volume/mute) con clamp [0,1]; EmulatorEngine esteso. Migliorato il fake test (rimosso `as any`, advisory TSK-007).

## 2026-06-01 18:50 — develop TSK-008
**Agente:** fe-dev · **Layer:** fe · **Code path:** ./packages/app/
**TSK:** [[../management/kanban/EP-003-esecuzione-e-controlli/US-010-avvio-emulazione/TSK-008]]
**Files touched:** 2 (src/components/Player/Player.tsx, Player.test.tsx)
**Commit:** n/a · **DoD:** pass — typecheck OK, test verdi
**Note:** Player monta viewport + HUD; Avvia → CoreWrapper.load+start. Engine iniettato (testabile). Su solids.

## 2026-06-01 18:50 — develop TSK-003
**Agente:** fe-dev · **Layer:** fe · **Code path:** ./packages/app/
**TSK:** [[../management/kanban/EP-001-gestione-file-di-gioco/US-001-caricare-rom/TSK-003]]
**Files touched:** 2 (src/components/FileLoader/FileLoader.tsx, FileLoader.test.tsx)
**Commit:** n/a · **DoD:** pass — typecheck OK, test verdi
**Note:** Picker + drag&drop → importRom; lettura header difensiva; errore su file non supportato. Su solids.

## 2026-06-01 18:50 — develop TSK-005
**Agente:** be-dev · **Layer:** be · **Code path:** ./packages/app/
**TSK:** [[../management/kanban/EP-001-gestione-file-di-gioco/US-003-caricare-bios/TSK-005]]
**Files touched:** 3 (src/storage/bios.ts, src/storage/bios.test.ts, src/domain/bios-policy.ts)
**Commit:** n/a · **DoD:** pass — typecheck OK, test verdi
**Note:** putBios/getBios/hasBios su store config (chiave bios:<platform>); requiresBios (GBA). Nessuna distribuzione BIOS.

- 2026-06-01 18:55 — `review TSK-009 iter-1 → pass` (finding 0/0/0)
- 2026-06-01 18:55 — `review TSK-008 iter-1 → pass` (finding 0/0/0)
- 2026-06-01 18:55 — `review TSK-003 iter-1 → pass` (finding 0/0/0; emergent candidate REACT-A11Y-001)
- 2026-06-01 18:55 — `review TSK-005 iter-1 → pass` (finding 0/0/1 low)
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/react+vite (conf 0.95)
  - Report: code_quality/reports/TSK-00{3,5,8,9}-iter-1.md

[2026-06-01 19:05] policy — promossa regola REACT-A11Y-001 emergent(candidate) → canonical(active) (gate umano §19.5); origine TSK-003 — files touched: 2

## 2026-06-01 19:30 — develop TSK-015
**Agente:** be-dev · **Code path:** ./packages/app/ (src/core/)
**Files touched:** 3 (core-wrapper.ts, core-wrapper.test.ts, Player.test.tsx[fake engine])
**DoD:** pass — pause/resume/stop con guard di stato; 37/37 test. **Commit:** n/a (gate)

## 2026-06-01 19:30 — develop TSK-013
**Agente:** be-dev · **Code path:** ./packages/app/ (src/domain/)
**Files touched:** 2 (library-service.ts, library-service.test.ts)
**DoD:** pass — LibraryService list/remove sopra StoragePort. **Commit:** n/a (gate)

## 2026-06-01 19:30 — develop TSK-012
**Agente:** fe-dev · **Code path:** ./packages/app/ (src/components/Library/)
**Files touched:** 2 (Library.tsx, Library.test.tsx)
**DoD:** pass — griglia titolo/piattaforma + stato vuoto + onSelect, su solids. **Commit:** n/a (gate)

## 2026-06-01 19:30 — develop TSK-020
**Agente:** fe-dev · **Code path:** ./packages/app/ (src/components/FileLoader/)
**Files touched:** 2 (FileLoader.tsx, FileLoader.test.tsx)
**DoD:** pass — dropzone onKeyDown (Enter/Space)→picker, conforme REACT-A11Y-001. **Commit:** n/a (gate)

## 2026-06-01 19:30 — develop TSK-010 (closure)
**Agente:** qa-dev · **Code path:** ./packages/app/ (tests)
**DoD:** pass — deliverable (platform-recognition.test.ts, 7 test) già implementato in TSK-004; verificato verde. Nessun nuovo file. **Commit:** n/a

- 2026-06-01 19:40 — `review TSK-015 iter-1 → pass` (0/0/0)
- 2026-06-01 19:40 — `review TSK-013 iter-1 → pass` (0/0/0)
- 2026-06-01 19:40 — `review TSK-012 iter-1 → pass` (0/0/0)
- 2026-06-01 19:40 — `review TSK-020 iter-1 → pass` (0/0/0; REACT-A11Y-001 soddisfatta)
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/react+vite (conf 0.95)

## [2026-06-01] ingest | soliboy-brand (Brand kit: logo + icon set + palette)
Pagine create: 3 | Figure: 0 | Aggiornamenti: 2 (temi-e-design-token-solids, index.md) | Gap nuovi: 1 (palette-brand-da-verificare) | Gap chiusi: 0

## 2026-06-01 20:10 — develop Wave finale (TSK-016/014/017/018/011/019)
**Agenti:** be-dev + fe-dev + qa-dev · **Code path:** ./packages/app/
- TSK-016 (be) InputMapping tastiera+Gamepad→sink (domain) + remap profili
- TSK-014 (fe) Player controls pausa/ripresa/arresto (US-011)
- TSK-018 (be) CoreWrapper.setSpeed (fast-forward + rewind capability-gated, US-014)
- TSK-017 (fe) Settings rimappatura comandi + salva profilo (US-013)
- TSK-011 (qa) integrazione carica→avvia→audio (tests/e2e)
- TSK-019 (qa) integrazione pausa/ripresa+input (tests/e2e)
**DoD:** pass — typecheck OK, 49/49 test verdi. **Commit:** n/a (gate)
**Note:** e2e a livello integrazione modulo; browser-e2e reale tracciato in gaps (e2e-browser-runtime). EmulatorEngine esteso (sendInput/setSpeed/capabilities).

- 2026-06-01 20:25 — `review TSK-016 iter-1 → pass` (0/0/0)
- 2026-06-01 20:25 — `review TSK-014 iter-1 → pass` (0/0/0)
- 2026-06-01 20:25 — `review TSK-018 iter-1 → pass` (0/0/0)
- 2026-06-01 20:25 — `review TSK-011 iter-1 → pass` (0/0/0)
- 2026-06-01 20:25 — `review TSK-019 iter-1 → pass` (0/0/0)
- 2026-06-01 20:25 — `review TSK-017 iter-1 → pass` (0/0/1 low)
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/react+vite (conf 0.95)

## 2026-06-01 20:55 — e2e | Playwright setup (Chromium)
**Agente:** qa-dev
**Files touched:** playwright.config.ts, e2e/app.e2e.ts, src/core/stub-engine.ts, src/App.tsx, package.json
**Note:** App composta (FileLoader/Library/Player/Settings + StubEngine + InputMapping). 4 e2e Chromium verdi. Gap e2e-browser-runtime risolto; aperto emulatorjs-real-integration (engine reale).
[2026-06-01 20:55] gap-closed — e2e-browser-runtime via packages/app/e2e/ — files touched: 1

[2026-06-01 21:20] design — ADR-004 EmulatorJS reale (adapter EmulatorEngine) + architecture-overview + runbook emulatorjs-hosting — files touched: 3

[2026-06-01 21:35] execute — sprint 3 "Emulazione reale": 4 TSK (TSK-021..024) da ADR-004 — files touched: 4

## 2026-06-01 22:05 — develop TSK-021 + TSK-022
**Agenti:** be-dev + fe-dev · **Code path:** ./packages/app/
- TSK-021 (be) EmulatorJsEngine: adapter reale EmulatorEngine (loader lazy, EJS_*, lifecycle/audio/input, revoke Object URL)
- TSK-022 (fe) Player passa container DOM all'engine + App seleziona engine (stub default; EmulatorJsEngine via ?engine=emulatorjs; keydown globale disattivato con engine reale)
**DoD:** typecheck OK, 49 unit + 4 e2e (stub) verdi, nessuna regressione.
**Caveat (onesto):** l'emulazione *reale* di EmulatorJsEngine NON è verificata in questo ambiente (no EmulatorJS data + ROM reale); validazione runtime delegata a TSK-024. Le chiamate API EJS sono difensive (superficie version-dependent, da confermare in TSK-024).
**Commit:** n/a (gate)

- 2026-06-01 22:20 — `review TSK-022 iter-1 → pass` (0/0/0)
- 2026-06-01 22:20 — `review TSK-021 iter-1 → conditional` (0/1 medium/0; TS-ROBUST-001 su load())
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/vite+react (conf 0.95)

## 2026-06-01 22:35 — develop TSK-021 (correction)
**Agente:** be-dev · **Code path:** ./packages/app/ (src/core/emulatorjs-engine.ts)
**DoD:** pass — fix CQRL iter 2: load() reject su onerror + timeout su EJS_ready + cleanup. typecheck OK, 49 unit verdi. **Commit:** n/a (gate)
- 2026-06-01 22:40 — `review TSK-021 iter-2 → pass` (0/0/0) · Reviewer: code-reviewer@2.12.0

## 2026-06-01 23:05 — develop TSK-023 (override umano→agent, scope codice)
**Agente:** be-dev (per override esplicito; TSK è consumer:human) · **Code path:** ./packages/app/vite.config.ts
**DoD:** dev/preview Vite con COOP/COEP (SharedArrayBuffer ok), CDN pinnata; runbook aggiornato. e2e verdi.
**Residui (umani/ops, deferred):** header prod web, crossorigin/self-host risorse CDN sotto COEP, vendoring core desktop/mobile (EP-006/007). **Commit:** n/a (gate)

[2026-06-01 23:30] develop — TSK-023 (prod headers + hardening): vercel.json (COOP/COEP) + crossorigin sullo script EmulatorJS — files touched: 3

[2026-06-01 15:40] execute — TSK-024 e2e reale scaffoldato (e2e/emulation-real.e2e.ts, skip se ROM libera assente) + .gitignore protezione test-roms — files touched: 2

[2026-06-01 16:05] develop — ROM libera dmg-acid2.gb (MIT) aggiunta + whitelist; e2e reale opt-in (SOLIBOY_E2E_REAL). EmulatorJS reale non inizializza in headless (EJS_ready assente) → gap emulatorjs-real-integration resta aperto. — files touched: 5

[2026-06-01 16:25] develop — debug EmulatorJS: ORB/COEP isolato → self-host same-origin (npm run setup:emu, public/emulatorjs gitignorato, EJS_pathtodata locale). EJS ora inizializza; residuo: EJS_Runtime (core WASM) non carica in headless. Gap aperto, avanzato. — files touched: 5

[2026-06-01 16:45] develop — wiring stile app: vendorizzato tema SoliDS approssimato (src/styles/solids-theme.css) + app-extra.css + import in main.tsx + vite-env.d.ts. App ora stilizzata. Gap design-system-real-package aperto. — files touched: 5

[2026-06-01 17:10] develop — debug EmulatorJS (cont.): core runtime non carica anche in headed ("EJS_Runtime not defined"). Provati threads off/on, core variants, build coerente stable. Causa = caricamento core EJS (compression/report JSON). Gap resta aperto; engine config base mantenuta. — files touched: 3

[2026-06-01 17:30] design — ADR-005 multi-engine registry (WasmBoy GB/GBC, mGBA GBA, arcade non coperto/rinvio; EmulatorJsEngine deprecato). Rivede ADR-004. architecture-overview aggiornato. — files touched: 2

[2026-06-01 17:35] execute — sprint 4 "Emulazione reale multi-engine": TSK-025/027/028/029 da ADR-005. Arcade rinviato (gap arcade-emulation-engine, EP-009 futura). — files touched: 4

## 2026-06-01 18:10 — develop TSK-025 + TSK-027
**Agenti:** be-dev + qa-dev · **Code path:** ./packages/app/
- TSK-025 (be) WasmBoyEngine (GB/GBC, npm wasmboy ESM) + engine-registry selectEngine + App (engine reale per-core via ?engine=real)
- TSK-027 (qa) e2e reale WasmBoy + dmg-acid2.gb → canvas reso
**DoD:** typecheck OK, 49 unit + 5 e2e verdi (4 stub + 1 REALE). Emulazione GB reale OK.
**Esito:** gap emulatorjs-real-integration RISOLTO per GB (pivot WasmBoy, ADR-005). EmulatorJsEngine ora dead-code → rimozione in TSK-029. **Commit:** n/a (gate)
[2026-06-01 18:10] gap-closed — emulatorjs-real-integration (GB via WasmBoy) — files touched: 1

- 2026-06-01 18:25 — `review TSK-027 iter-1 → pass` (0/0/0)
- 2026-06-01 18:25 — `review TSK-025 iter-1 → pass` (0/0/1 low: TS-ROBUST-001 promise play/pause)
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/vite (conf 0.95)

## 2026-06-01 18:45 — develop TSK-029
**Agente:** be-dev · **Code path:** ./packages/app/
**Note:** rimossi emulatorjs-engine.ts, scripts/setup-emulatorjs.mjs, dep @emulatorjs/emulatorjs, script setup:emu, gitignore+dir public/emulatorjs. ADR-004 → superseded by ADR-005; runbook emulatorjs-hosting marcato storico. Commenti core-wrapper/Player resi engine-agnostici. Hardening WasmBoy promise (TS-ROBUST-001 advisory di TSK-025: play/pause con .catch). COOP/COEP mantenuti (innocui, utili per audio WasmBoy).
**DoD:** pass — nessun riferimento EmulatorJS attivo; typecheck OK, 49 unit + 5 e2e verdi. **Commit:** n/a (gate)

- 2026-06-01 18:55 — `review TSK-029 iter-1 → pass` (0/0/0; rimozione pulita + hardening WasmBoy)
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/vite (conf 0.95)

## 2026-06-01 19:20 — develop TSK-028
**Agente:** be-dev · **Code path:** ./packages/app/src/core/
**Note:** spike OK → @thenick775/mgba-wasm (MPL-2.0, API documentata). MgbaEngine adapter (import dinamico, FSInit/uploadRom/loadGame/buttonPress/setVolume) + registrato (mgba→MgbaEngine). e2e GBA skip-until-ROM. build code-split (mgba chunk 152KB), typecheck OK, 49 unit + 5 e2e verdi.
**DoD:** pacchetto validato + adapter implementato. **Caveat onesto:** runtime GBA NON verificato (manca ROM GBA libera) → gap gba-runtime-verification. **Commit:** n/a (gate)

- 2026-06-01 19:35 — `review TSK-028 iter-1 → pass` (0/0/1 low: TS-IDIOM-002 cast/assertion; runtime GBA da validare, gap dedicato)
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/vite (conf 0.95)

## 2026-06-01 19:45 — verify TSK-028 (GBA reale)
**Agente:** qa-dev · **Note:** ROM GBA libera gba-tests-thumb.gba (MIT) → e2e MgbaEngine verde, mGBA rende il canvas. GBA REALE verificato. Gap gba-runtime-verification chiuso. 49 unit + 6 e2e verdi (stub + GB + GBA).
[2026-06-01 19:45] gap-closed — gba-runtime-verification (GBA reale via mGBA) — files touched: 1

[2026-06-01 20:10] design — ADR-006 Salvataggi (EP-004) + note design EP-005/EP-002 in architecture-overview — files touched: 2
[2026-06-01 20:10] execute — sprint 5 backlog post-MVP: TSK-030..039 (EP-004 salvataggi, EP-005 resa video, EP-002 libreria avanzata) — files touched: 10

[2026-06-01 20:40] plan — TSK-040 (integrazione @soli92/solids reale) aperto in stato BLOCKED su Q_001: pacchetto non consumabile (npm pubblico 404; github:soli92/solids senza dist/). Q_001 hard in questions.md. — files touched: 3

- 2026-06-01 20:55 — `review TSK-040 iter-1 → pass` (0/0/1 low: CSS-DESIGN-001 token contratto non documentato; advisory non bloccante)
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/react/vite + @soli92/solids (conf 0.97)

## 2026-06-01 21:30 — develop TSK-030
**Agente:** be-dev
**TSK:** [[../management/kanban/EP-004-salvataggi/US-016-save-state-multipli/TSK-030]]
**Layer:** be
**Code path:** ./packages/app/src/core/
**Files touched:** vedi commit (core: core-wrapper.ts, stub-engine.ts, wasmboy-engine.ts, mgba-engine.ts, engine-registry.ts, wasmboy.d.ts + stub-engine.test.ts; fixture fakeEngine in core-wrapper.test.ts e Player.*.test.tsx aggiornate al contratto esteso)
**Commit:** n/a (gate)
**DoD:** pass — typecheck OK, 71/71 unit verdi (49 esistenti + 11 nuovi StubEngine + 11 fixture-test esistenti adattati al nuovo contratto), build OK
**Note:** EmulatorEngine esteso con snapshot/restore + getSram/loadSram (ADR-006). EngineCapabilities aggiunto saveStates+sram. StubEngine: round-trip deterministico (JSON+magic header SOLISTUB1, tick monotono, SRAM con copie difensive). WasmBoyEngine: API native `saveState`/`loadState` su oggetto JS serializzato come JSON+magic WBSV1 (cross-engine reject onesto); SRAM via cartridgeRam dello save state (read) e patch+loadState (write). MgbaEngine: slot-based saveState/loadState con I/O su FS virtuale Emscripten via `FS.readFile`/`writeFile` (path = saveStatePath/<game>.ss0); SRAM via `getSave()` (read) e `FS.writeFile(saveName, data)` (write); reject onesto se API non disponibili o non c'è ROM caricata. Caveat: i save state mGBA non sono ancora verificati a runtime end-to-end (gap già noto, non introdotto qui). UnsupportedEngine rifiuta onestamente i 4 nuovi metodi. Nessuna estensione di StoragePort/SaveService/UI (TSK-031/032/033). Nessun asset protetto introdotto.

## 2026-06-01 — review TSK-030 iter-1 → pass
**Agent:** code-reviewer@2.12.0
**Verdict:** pass (3 finding non-bloccanti: 1 medium, 2 low)
**Report:** code_quality/reports/TSK-030-iter-1.json

- 2026-06-01 21:45 — `review TSK-035 iter-1 → conditional` (0/0/1 medium + 3 low: F-035-01 toggle() null guard mancante [medium, blocking], F-035-02 cast HTMLElement non giustificato [low, advisory], F-035-03 dissonanza aria-label/testo visibile [low, advisory], F-035-04 commento useEffect dipendenza ref [low, advisory])
  - Reviewer: code-reviewer@2.14.0 · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-035-iter-1.json

- 2026-06-01 22:30 — `review TSK-038 iter-1 → conditional` (0/0/1 medium + 3 low: F-038-01 listRoms rejection silente [medium, blocking], F-038-02 filtri non resettati su cambio storage [low, advisory], F-038-03 aria-label ridondante su input [low, advisory], F-038-04 commento presupposto in-memory mancante [low, advisory])
  - Reviewer: code-reviewer@2.15.0 · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-038-iter-1.json

- 2026-06-01 22:50 — `review TSK-035 iter-2 → pass` (0 finding; tutti i 4 finding iter-1 risolti: F-035-01 guard toggle null [medium, blocking], F-035-02 firma hook HTMLElement [low], F-035-03 allineamento aria-label/testo WCAG 2.5.3 [low, blocking], F-035-04 commento mono-target [low])
  - Reviewer: code-reviewer@2.14.0 · Commit: 139dba7 · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-035-iter-2.json

- 2026-06-01 — `review TSK-031 iter-1 → conditional` (1 high blocking + 1 medium + 1 low + 1 medium/qa: F-031-1-R1 DB_VERSION non incrementato [high, blocking], F-031-1-R2 saveStateId collisione same-ms [medium], F-031-1-D1 index composto assente [low], F-031-1-T1 db.test.ts senza copertura nuove funzioni [medium/qa]). Finding TSK-030 F-030-1-R1 e F-030-1-R2 risolti.
  - Reviewer: code-reviewer@2.12.0 · Commit: 0e77967 · Stack: typescript/vite/indexeddb (conf 0.95) · Report: code_quality/reports/TSK-031-iter-1.json

- 2026-06-01 23:10 — `review TSK-036 iter-1 → conditional` (1 high + 2 medium + 3 low: F-036-01 VideoSettingsPort non cablata end-to-end [high, blocking], F-036-02 doppio hook non sincronizzato Player+Settings [medium, blocking], F-036-03 errori I/O swallowati senza log [medium, advisory], F-036-04 test save-reject non esercita save [low, advisory], F-036-05 cast superfluo 'as VideoSettings' [low, advisory], F-036-06 coalescenza doppia unreachable [low, advisory])
  - Reviewer: code-reviewer@2.15.0 · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-036-iter-1.json

- 2026-06-01 — `review TSK-031 iter-2 → passed` (F-031-1-R1 ritirato come falso positivo confermato: tutti gli store v1 esistenti dal commit 20808c8; F-031-1-R2 risolto: crypto.randomUUID() tiebreaker; F-031-1-T1 risolto: 8 test diretti storage layer; F-031-1-D1 acknowledged via JSDoc. no_progress=false, regression=false. 111 unit + 6 e2e verdi.)
  - Reviewer: code-reviewer@2.12.0 · Commit fix: d6144b8 · Stack: typescript/vite/indexeddb (conf 0.95) · Report: code_quality/reports/TSK-031-iter-2.json
- 2026-06-01 23:55 — `review TSK-036 iter-2 → passed` (0 finding; tutti i 6 finding iter-1 risolti: F-036-01 persistenza end-to-end cablata [high, was blocking], F-036-02 stato video sollevato in App.tsx [medium, was blocking], F-036-03 console.warn su I/O reject [medium, advisory], F-036-04 test save-reject reale con Harness [low, advisory], F-036-05 cast rimosso [low, advisory], F-036-06 coalescenza ridondante rimossa [low, advisory]. no_progress=false, regression=false. DB_VERSION=1 invariato.)
  - Reviewer: code-reviewer@2.15.0 · Commit fix: d6144b8 · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-036-iter-2.json

- 2026-06-01 — `review TSK-039 iter-1 → conditional` (0 high / 1 medium blocking / 1 low advisory: F-039-01 errore setCover riusa guard globale che smonta la griglia [medium, blocking], F-039-02 handleCoverChange non memoizzata [low, advisory])
  - Reviewer: code-reviewer@2.14.0 · Commit: 1e22eca · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-039-iter-1.json
- 2026-06-01 — `review TSK-032 iter-1 → passed` (2 finding low/advisory: F-032-1-I1 non-null assertion `rec!` senza commento [low, advisory], F-032-1-I2 handler async inline non documentati [low, advisory]. Tutti i check critici verificati: capability check onesto, filtro ROM US-018, engine-mismatch no-crash ADR-006, gate running US-016, a11y region+aria-label, backward-compat prop opzionali, useMemo SaveService in App.tsx. Nessun finding blocking.)
  - Reviewer: code-reviewer@2.15.0 · Commit: 1e22eca · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-032-iter-1.json
- 2026-06-01 — `review TSK-039 iter-2 → passed` (0 finding; F-039-01 e F-039-02 entrambi risolti: coverError separato da error, guard globale riservato a listRoms, alert non distruttivo sopra la griglia, handleCoverChange in useCallback([storage]), test aggiornato per verificare che la lista resti montata. no_progress=false, regression=false. 130 unit + 6 e2e verdi.)
  - Reviewer: code-reviewer@2.15.0 · Commit: 17b190a · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-039-iter-2.json
- 2026-06-01 — `review TSK-037 iter-1 → conditional` (3 finding: F-037-01 medium [TS-ROBUST-001] cast `raw as VideoFilter` non validato in handleFilterChange; F-037-02 low [REACT-A11Y-001] aria-label "Filtro" non contestualizzato; F-037-03 low [REACT-IDIOM-001] CSS scanline sempre presente nel template literal. Nessun finding blocking. Backward-compat, scoping CSS, a11y overlay: tutti verificati positivi.)
  - Reviewer: code-reviewer@2.15.0 · Commit: 859e174 · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-037-iter-1.json
- 2026-06-01 — `develop TSK-041 (fe) → done` (bugfix runtime US-016 AC3: canvas perso dopo WasmBoy.loadState). Causa reale individuata via lettura codice: anti-pattern React↔DOM imperativo nel Player (`.sb-screen` passato all'engine come container DOM ma contenente figli React → il canvas appeso da WasmBoyEngine.ensureCanvas veniva clobberato sui re-render successivi a SaveStatePanel.handleLoad, che modifica `busy`/`message`). Fix engine-agnostico in `Player.tsx`: introdotto un host React-vuoto dedicato (`<div ref={canvasHostRef} className="sb-canvas-host" />`) reso dentro `.sb-screen` (primo figlio, nessun figlio React) e passato all'engine come container al posto di `screenRef.current`. Placeholder testuale e overlay scanline restano fratelli dell'host nel `.sb-screen` (CSS scoped invariato; selettore e2e `.sb-screen canvas` continua a matchare). `core/wasmboy-engine.ts` NON modificato (R.8 scope chiuso). e2e `emulation-save.e2e.ts`: rimosso `test.fixme` dal test load. Esito reale `npm run e2e`: **8/8 verdi** (era 7/8 + 1 fixme); typecheck OK; `npm test` 145/145; build OK. Gap `wasmboy-loadstate-canvas-lost` chiuso. TSK-034 → done (AC3 US-016 ora verificata via e2e reale).- 2026-06-01 — `review TSK-037 iter-2 → passed` (0 finding; tutti i 3 finding iter-1 risolti: F-037-01 parseVideoFilter() con guard runtime [medium, advisory], F-037-02 aria-label "Filtro video" [low, advisory], F-037-03 CSS scanline interpolato condizionalmente [low, advisory]. no_progress=false, regression=false. 145 unit + 8 e2e verdi.)
  - Reviewer: code-reviewer@2.15.0 · Commit fix: 25f3bec · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-037-iter-2.json
- 2026-06-01 — `review TSK-033 iter-1 → passed` (2 finding: F-033-01 low [REACT-IDIOM-001] handler async handleExport/handleImportFile senza useCallback (incoerenza con refreshSaveStates); F-033-02 medium [TS-ROBUST-001] core-mismatch differito al loadState — entry persiste nel DB anche se core incompatibile (vs ADR-006 §Conseguenze). Nessun finding blocking. Verifiche positive: no rete, formato versionato, validazione robusta all'import, nessuna entry orfana su KO, revoke ObjectURL, a11y completa, SaveDataPort segregata, backward-compat props, round-trip testato.)
  - Reviewer: code-reviewer@2.15.0 · Commit: cf44ef1 · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-033-iter-1.json

- 2026-06-01 — `review TSK-034 iter-1 → passed` (1 finding low/advisory: F-034-01 [QA-TEST-001] AC2 US-016 coperta da un solo slot (slot 0) — copertura multi-slot assente nell'e2e; nessun finding blocking. Verifiche positive: guardia skip coerente con emulation-real.e2e.ts, selettori robusti aria-label/role+name/data-testid/role=alert, test.slow() corretto, beforeEach IndexedDB isolation, AC1 e AC3 US-016 verificate end-to-end, nessun asset protetto, nessun flakiness evidente. 8/8 e2e verdi post-TSK-041.)
  - Reviewer: code-reviewer@2.15.0 · Commit: dd573e4 · Stack: typescript/playwright (conf 0.97) · Report: code_quality/reports/TSK-034-iter-1.json

- 2026-06-01 — `review TSK-041 iter-1 → passed` (1 finding low/advisory: F-041-1 [TS-ROBUST-001] fallback screenRef in handlePlay silenzioso in produzione — il ramo `canvasHostRef.current ?? screenRef.current` non emette alcun warning quando il fallback si attiva, rendendo invisibile una deviazione dall'isolamento canvas; nessun finding blocking. Verifiche positive: isolamento canvas host React-vuoto corretto e engine-agnostico; nessuna regressione fullscreen (TSK-035, screenRef invariato); nessuna regressione CSS scala/aspect/filtri (TSK-036/037, selettori discendenti .sb-screen … canvas/.sb-scanline invariati); nessun figlio React nell'host; selettore e2e .sb-screen canvas valido e verde su engine reale. no_progress=false, regression=false.)
  - Reviewer: code-reviewer@2.14.0 · Commit: dd573e4 · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-041-iter-1.json
  - Reviewer: code-reviewer@2.15.0 · Commit: dd573e4 · Stack: typescript/playwright (conf 0.97) · Report: code_quality/reports/TSK-034-iter-1.json
- 2026-06-01 — `develop TSK-042 (fe) → done` (copia brand asset US-037/EP-010). Operazione pura di copia bit-identica da `raw/soliboy-brand/` (L1 read-only, R.1 rispettata) a `packages/app/public/` + `packages/app/src/assets/`. 16 file copiati totali: 3 file in `public/` (favicon.svg + favicon-32.png + favicon-64.png), 11 file in `public/icons/` (icon-{16,32,48,64,128,180,192,256,512,1024}.png + soliboy-icon.svg), 2 file in `src/assets/` (soliboy-logo-{horizontal,mono}.svg). Verifica bit-identicality: shasum -a 256 + `cmp -s` su tutte le 16 coppie src/dst → 16/16 OK. `git check-ignore` sui 16 path: 0/16 ignorati (root `.gitignore` esclude solo `test-roms/*`, nessun pattern PNG/SVG generico) → **nessuna eccezione gitignore necessaria**, asset committabili as-is. `git status --porcelain raw/` vuoto → `raw/` invariato. `npm run build` (tsc --noEmit + vite build) verde in 1.69s, 57 modules transformed, nessuna regressione su asset esistenti (mgba wasm + bundles invariati). Asset serviti as-is da Vite da `public/`; gli SVG in `src/assets/` saranno importati come componenti React da TSK-046. Prerequisito fisico per TSK-043/044/045/046 ora soddisfatto. Nessun commit eseguito (R.14 VCS gate umano).
- 2026-06-01 — `review TSK-049 iter-1 → passed` (0 finding blocking; 3 finding minor advisory [GHA-DESIGN-001, GHA-DESIGN-002, GHA-ROBUST-001]: F-049-01 concurrency group assente, F-049-02 timeout-minutes assente, F-049-03 permissions espliciti assenti; 1 finding low advisory [GHA-ROBUST-001]: F-049-04 cache Playwright assente — deferred a TSK-052. Trigger, working-directory monorepo, npm ci, cache npm, ordine step fail-fast, Playwright Chromium-only: tutti verificati positivi. Stack GHA/YAML in modalita' degradata — 3 regole emergent candidate create: GHA-DESIGN-001, GHA-DESIGN-002, GHA-ROBUST-001.)
  - Reviewer: code-reviewer@2.15.0 · Commit: 4e787d0 · Stack: yaml/github-actions (conf 0.95, degraded) · Report: code_quality/reports/TSK-049-iter-1.json

- 2026-06-01 — `review TSK-044 iter-1 → passed` (3 finding advisory, nessuno blocking: F-044-01 medium [TS-ROBUST-001] valore port.load() non validato contro UI_THEMES — possibile data-theme stale silenzioso su tema rimosso; F-044-02 medium [QA-TEST-001] ramo port.save() rejected non testato — delegato qa-dev TSK-047; F-044-03 low [TS-DESIGN-001] UseThemeResult.theme: string invece di UiTheme — risolvibile contestualmente a F-044-01. Verifiche positive: single source of truth data-theme (solo useTheme.useEffect), pattern port coerente con useVideoSettings/makeVideoSettingsPort/ConfigPort, console.warn esplicito su load/save reject, cancelled flag per unmount safety, guard typeof document, aria-label su select, props opzionali Settings backward-compat, themePort memoizzato, index.html data-theme=90s-party allineato al default, engine non modificato. 171 unit + 8 e2e verdi.)
  - Reviewer: code-reviewer@2.15.0 · Commit: 4e787d0 · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-044-iter-1.json

- 2026-06-01 — `review TSK-042 iter-1 → passed` (0 finding blocking; 1 finding low advisory [asset.structure.code_path-incomplete]: F-042-01 frontmatter code_path non dichiara packages/app/src/assets/ — discrepanza di documentazione senza impatto operativo. Verifiche positive: R.1 rispettata (raw/ immutabile — zero file raw/ nel commit 4e787d0), bit-identity confermata 16/16 via MD5 (12 PNG + 4 SVG), nessun asset gitignored, .DS_Store non tracciato in git, struttura public/ vs src/assets/ corretta per Vite, tutti i path referenziati da TSK-043/045/046 presenti. Task di pura copia — pass idiomaticita' non applicabile, pass design e robustness verificati su struttura e vincoli.)
  - Reviewer: code-reviewer@2.15.0 · Commit: 4e787d0 · Stack: binary/svg vite-public-assets (asset-only mode) · Report: code_quality/reports/TSK-042-iter-1.json
- 2026-06-01 — `develop TSK-043 → done` (aggiunti 6 `<link>` tag nel `<head>` di packages/app/index.html: rel=icon SVG (favicon.svg), PNG 32×32 (favicon-32.png), PNG 64×64 (favicon-64.png), PNG 16×16 (icons/icon-16.png), PNG 128×128 (icons/icon-128.png), rel=apple-touch-icon 180×180 (icons/icon-180.png). Tutti i 6 file referenziati verificati esistenti in packages/app/public/ prima dell'edit. data-theme non toccato (gestito da TSK-044). npm run build OK (60 modules, 1.76s; favicon.svg/favicon-32.png/favicon-64.png + icons/ correttamente copiati in dist/). 8/8 e2e Playwright verdi (17.5s). Scope rispettato: 1 solo file modificato (index.html), zero modifiche a be/db/qa/src/.)
  - Agent: fe-dev@2.15.0 · Files: packages/app/index.html · Build: tsc+vite OK · E2E: 8/8 chromium pass

- 2026-06-01 — `develop TSK-051 (fe) → done` (workflow CD Vercel US-042). Creato `.github/workflows/cd-vercel.yml` (file unico nel code_path consentito; ci.yml e vercel.json NON modificati). Trigger: push su tag `v*` (produzione) + pull_request verso main (preview). Job `deploy` su ubuntu-latest, working-directory `packages/app`, Node 20 LTS con cache npm. **Via di deploy scelta: Vercel CLI ufficiale** (`npx vercel@latest pull/build/deploy --prebuilt`) anziche' l'action `amondnet/vercel-action@v25` suggerita dalla spec — rationale documentato in commento header del workflow (supporto ufficiale, meno deprecazioni, comportamento esplicito a 3 step). Step: checkout@v4 → setup-node@v4 (node-version 20, cache npm, cache-dependency-path `packages/app/package-lock.json`) → `npm ci` → `vercel pull --environment=production|preview` (in base a `startsWith(github.ref, 'refs/tags/v')`) → `vercel build [--prod]` (esegue `npm run build` di packages/app + applica `packages/app/vercel.json` con header COOP/COEP nell'output `.vercel/output/`) → `vercel deploy --prebuilt [--prod]` (carica artifact senza rebuild). Hardening (allineato review TSK-049): `concurrency.group: cd-vercel-${{ github.ref }}` con `cancel-in-progress` true sulle PR (cancella deploy preview superati) e false sui tag (serializza release); `permissions: contents: read` a livello workflow (la CLI Vercel non commenta sulle PR, contents:read e' sufficiente); `timeout-minutes: 15` sul job. Secret prerequisito (gate umano R.14/R.15, non eseguito): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — documentati nei commenti header del workflow con istruzioni per l'owner; in assenza, il job fallisce attesamente al primo `vercel pull` (non blocca CI/TSK-049/050). Validazione YAML: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/cd-vercel.yml'))"` → OK (6 step, top-level keys [name, on, concurrency, permissions, jobs]). Nessun commit eseguito (R.14). Gap `vercel-deploy-trigger-policy` (gia' CHIUSO da TPM) implementato fedelmente.

- 2026-06-01 — `develop TSK-045 (fe) → done` (web app manifest US-038/EP-010). Creato `packages/app/public/manifest.webmanifest` (JSON valido, 8 chiavi: name "Soli-boy", short_name "Soli-boy", description, start_url "/", display "standalone", background_color "#0d0d0d", theme_color "#ff00cc", icons[3]) con riferimenti a `/icons/icon-192.png` (192x192), `/icons/icon-512.png` (512x512) e `/icons/icon-512.png` purpose maskable — entrambi gli asset confermati esistenti in `packages/app/public/icons/` (copiati da TSK-042, no duplicati). In `packages/app/index.html` aggiunti `<link rel="manifest" href="/manifest.webmanifest" />` e `<meta name="theme-color" content="#ff00cc" />` nel `<head>` subito dopo i favicon di TSK-043 (i 6 link favicon non sono stati toccati). Verifiche: `python3 -m json.tool` sul manifest OK; `npm run build` (tsc --noEmit + vite build) OK in 2.06s, 61 modules, `dist/manifest.webmanifest` presente (545 B) e `dist/index.html` contiene sia `manifest.webmanifest` sia `theme-color`; `npm run e2e` Playwright Chromium **8/8 verdi** (12.0s, nessuna regressione). **Assunzione documentata nel TSK:** `background_color: #0d0d0d` e `theme_color: #ff00cc` dedotti dalla palette brand 90s/cyberpunk — gap `palette-brand-da-verificare` (riga 24 di gaps.md) ancora aperto; l'owner può correggere gli hex senza impatto strutturale. Scope (R.8): solo i 2 path dichiarati in `code_path` (manifest.webmanifest nuovo + index.html). Nessun commit (R.14).
  - Agent: fe-dev@2.15.0 · Files: packages/app/public/manifest.webmanifest (new), packages/app/index.html · Build: tsc+vite OK · E2E: 8/8 chromium pass

- 2026-06-01 23:55 — `review TSK-051 iter-1 → passed`
  - Reviewer: code-reviewer@2.15.0 · Stack: yaml/github-actions (conf 0.95, modalita' degradata: regole emergent)
  - Finding: {high:0, medium:0, low:1}, dedup:0 · Report: code_quality/reports/TSK-051-iter-1.json
  - Nuova regola emergent candidate: GHA-IDIOM-001 (npx @latest non deterministico)

- 2026-06-01 — `review TSK-046 iter-1 → passed` (1 finding low/advisory: F-046-01 [CSS-DESIGN-001 emergent] classe sb-app-logo senza CSS associato — dimensioni espresse solo via LOGO_STYLE inline; accettabile per scope zero-dep, gap gia' documentato nel TSK come svg-react-import-strategy. Nessun finding blocking. Verifiche positive: scelta <img>+horizontal architetturalmente corretta (isolamento currentColor, leggibilita' multi-tema, zero-dep); alt="Soli-boy" corretto per a11y (role=img, nessuna collisione con accessible name tile ne' con selettori e2e "titolo piattaforma"); semantica header/<section> corretta in tutti i branch stato; test aggiornati con rigore (scoping within(grid) su 2 test preesistenti + 1 nuovo test dedicato logo); no duplicazione favicon/manifest. no_progress=false, regression=false.)
  - Reviewer: code-reviewer@2.15.0 · Commit: 8c72442 · Stack: typescript/react/vite (conf 0.97) · Report: code_quality/reports/TSK-046-iter-1.json

- 2026-06-01 — `review TSK-043 iter-1 → passed` (0 high / 0 medium / 1 low advisory: F-043-1-A1 sizes su apple-touch-icon ridondante per spec Apple — Safari ignora l'attributo, non introduce errori. Tutti i 6 asset referenziati verificati esistenti in public/. SVG type=image/svg+xml, PNG type=image/png + sizes: corretti. Ordering SVG-first + fallback progressivi: conforme alle best practice. Nessuna interferenza con data-theme=90s-party. Nessuna duplicazione con TSK-045 (manifest+theme-color aggiunti da TSK-045 in commit successivo 5475158). Build e 8/8 e2e verdi confermati.)
  - Reviewer: code-reviewer@2.15.0 · Commit: 8c72442 · Stack: html5/vite-public-static (conf 0.97, asset-only mode) · Report: code_quality/reports/TSK-043-iter-1.json

- 2026-06-01 — `review TSK-048 iter-1 → passed` (0 high / 0 medium / 1 low advisory: F-048-01 [TS-IDIOM-002] non-null assertion `manifestHref!` senza commento giustificativo — guard expect().toBeTruthy() rende l'uso logicamente sicuro ma opaco. Nessun finding blocking. Verifiche positive: 3 test verificano artefatti reali a runtime (favicon href in DOM, manifest HTTP 200 + JSON name/icons, logo visibile); locator `link[rel="icon"].first()` e `link[rel="manifest"]` corretti; `getByAltText("Soli-boy")` corretto per <img alt> (non form control — getByLabel sarebbe errato); nessun flakiness; nessuna dipendenza da ?engine=real; StubEngine default; no beforeEach necessario (brand test stateless). Correzione locator spec → implementazione giudicata corretta e ben motivata. 11/11 e2e verdi confermati.)
  - Reviewer: code-reviewer@2.15.0 · Stack: typescript/playwright (conf 0.98) · Report: code_quality/reports/TSK-048-iter-1.json

- 2026-06-01 — `review TSK-047 iter-1 → passed` (0 high / 0 medium / 1 low advisory: F-047-01 [QA-TEST-001] afterEach data-theme assente nel describe useTheme di ThemeSelector.test.tsx — potenziale cross-contaminazione intra-file, non ancora manifesta. F-044-01 e F-044-02 del report TSK-044 completamente indirizzati; AC US-036 coperti; fake ThemePort in-memory; nessun test tautologico. 187 unit verdi confermati.)
  - Reviewer: code-reviewer@2.15.0 · Commit: 5475158 · Stack: typescript/react 18/vitest (conf 0.97) · Report: code_quality/reports/TSK-047-iter-1.json

- 2026-06-01 — `review TSK-052 iter-1 → passed` (0 high / 0 medium / 1 low advisory: F-052-01 [GHA-ROBUST-001] assunzione system deps runner non documentata inline nel YAML — annotata nel TSK ma non nel workflow. F-049-01/02/03 chiusi. Verifiche positive: step order intatti, cache key sensata, install condizionato corretto, upload-artifact if:failure() coerente col reporter html, concurrency/permissions/timeout corretti, ROM MIT verificate, nessun download esterno in CI.)
  - Reviewer: code-reviewer@2.15.0 · Commit: 5475158 · Stack: yaml/github-actions (conf 0.95, degraded) · Report: code_quality/reports/TSK-052-iter-1.json

- 2026-06-01 — `review TSK-045 iter-1 → passed` (0 high / 0 medium / 3 low advisory: F-045-1-01 [PWA-DESIGN-001 emergent] purpose implicito su icon entries 192 e 512 non-maskable; F-045-1-02 [PWA-ROBUST-001 emergent] campo id assente — identity PWA legata a start_url; F-045-1-03 [PWA-DESIGN-002 emergent] campo lang assente — incoerenza con html lang=it. Nessun finding blocking. Verifiche positive: JSON valido, campi obbligatori completi (name/short_name/start_url/display/icons 192+512+maskable/theme_color/background_color), asset referenziati esistenti (icon-192.png 7567B + icon-512.png 18833B), coerenza theme_color #ff00cc manifest=meta, non interferenza favicon TSK-043, non interferenza Electron/Capacitor, assunzione palette documentata correttamente (gap palette-brand-da-verificare aperto). Build tsc+vite OK, 8/8 e2e Playwright Chromium verdi. Tre regole emergent candidate create: PWA-DESIGN-001, PWA-ROBUST-001, PWA-DESIGN-002.)
  - Reviewer: code-reviewer@2.15.0 · Commit: 5475158 · Stack: html5/json-vite-public-static (conf 0.97, asset-only mode) · Report: code_quality/reports/TSK-045-iter-1.json

## 2026-06-03 — develop TSK-024 (qa)
**Agente:** qa-dev
**TSK:** [[../management/kanban/EP-003-esecuzione-e-controlli/US-010-avvio-emulazione/TSK-024]]
**Layer:** qa · Sprint 3 · P1
**Code path:** packages/app/e2e/**, packages/app/public/**
**Files touched:**
- packages/app/e2e/emulation-emulatorjs-engine.e2e.ts (nuovo, 4 test)
- management/kanban/EP-003-esecuzione-e-controlli/US-010-avvio-emulazione/TSK-024.md (status: done, DoD aggiornato)
**Comandi eseguiti:**
- `npx playwright test e2e/emulation-emulatorjs-engine.e2e.ts --reporter=line` → 4 passed (41s)
- `npx playwright test --reporter=line` (suite completa) → 15 passed (28.7s), 0 regressioni
**DoD:** pass
- [x] e2e verde con engine reale (WasmBoyEngine — sostituisce EmulatorJsEngine per GB dopo ADR-005) + ROM homebrew libera (dmg-acid2.gb, MIT)
- [x] Nessun contenuto protetto nei fixture
- [ ] Gap emulatorjs-real-integration: da annotare in gaps.md (wiki-keeper)
**Note architetturali:** EmulatorJsEngine non esiste nel codice (rimosso in TSK-029, ADR-004 superseded da ADR-005). L'engine reale per GB/GBC è WasmBoyEngine (wasmboy ESM). La spec copre l'intero ciclo richiesto: caricamento ROM → avvio reale (canvas + data-state=running) → pausa (data-state=paused, "In pausa" visibile) → ripresa (canvas visibile, data-state=running) → arresto (data-state=idle, no leak). Verifica negativa inclusa. Tag @slow applicato (WasmBoy carica WASM + core GB in ~5-30s). Header COOP/COEP già attivi (TSK-023). ROM pubblica dmg-acid2.gb (MIT) già presente in public/test-roms/.
**Flag gap:** emulatorjs-real-integration — parzialmente risolto per GB (WasmBoy, vedi log 2026-06-01 18:10). Questo TSK chiude la DoD della US-010 per il ciclo completo con engine reale. Il gap residuo riguarda EmulatorJS (arcade/libretro): da annotare in gaps.md come gap ancora aperto per l'arcade (rinviato EP-009). Segnalato al wiki-keeper per annotazione.

[2026-06-03 | wiki-keeper | gap-update | emulatorjs-real-integration | Gap aggiornato post TSK-024: PARZIALMENTE CHIUSO. GB/GBC risolto (WasmBoyEngine, ADR-005, 15 e2e passed). Arcade/libretro APERTO → rinviato EP-009 (gap arcade-emulation-engine). Fonti: log.md §TSK-024, ADR-004, ADR-005. File toccati: wiki/gaps.md]

[2026-06-03 | wiki-keeper | gap-closed | electron-packaging-toolchain + electron-autoupdate-mechanism | 2 gap EP-006 chiusi da lead-architect (ADR-007 + ADR-008). (1) electron-packaging-toolchain → CHIUSO da ADR-007: toolchain electron-builder, workspace packages/desktop/, target NSIS/DMG+ZIP/AppImage+deb, publish provider github, COOP/COEP via custom protocol app://, core WASM già ESM-bundled. (2) electron-autoupdate-mechanism → CHIUSO da ADR-008: electron-updater + GitHub Releases, check avvio+periodico+manuale, eventi IPC→UI renderer, verifica SHA-512, limite deb documentato, release su tag v*. Fonti: design_&_architecture/decisions/ADR-007.md, design_&_architecture/decisions/ADR-008.md. File toccati: wiki/gaps.md, wiki/log.md]

- 2026-06-03 — `develop TSK-069 (fe) → done` (privacy policy on-device in-app per US-033/EP-008). Creato nuovo modulo `packages/app/src/components/PrivacyNotice/` (4 file nuovi): (a) `privacy-port.ts` — `PrivacyAckPort` (load/save) + adapter `makePrivacyAckPort(ConfigPort)` sulla chiave canonica `"privacy-ack"` con costante `PRIVACY_ACK_VALUE = "true"`. Pattern allineato a `makeThemePort` (TSK-044) e `makeVideoSettingsPort` (TSK-036). (b) `usePrivacyAck.ts` — hook stato `acknowledged` con idratazione one-shot dalla porta (cancelled-guard come `useTheme`), `acknowledge()` best-effort, `console.warn` su load/save reject senza rollback UI. (c) `PrivacyNotice.tsx` — componente UI con 2 varianti: `variant="banner"` (banner di primo avvio dismissibile, role=region, aria-labelledby, pulsante "Ho capito") e `variant="section"` (sezione Settings sempre consultabile, non dismissibile, cita ADR-002 nella nota di chiusura). Contenuto: 4 punti veritieri (R.2) tratti da ADR-002 §Conseguenze e US-033 §Business Rules — "dati restano sul dispositivo", "nessun file inviato a server esterni", "nessun account richiesto, app funziona offline", "nessun tracking, analytics o telemetria". Stile solids (`sd-card sb-sec sb-lbl sb-keymap sb-row sb-key sb-btn sb-full sb-note`) coerente con `LegalNotice` e `Settings`. (d) test: `PrivacyNotice.test.tsx` (14 test su rendering, ack callback, ARIA, classi solids, varianti) + `usePrivacyAck.test.ts` (11 test su idratazione null/non-null, persistenza, robustezza load/save-reject, adapter `makePrivacyAckPort` su ConfigPort fake). Wiring: `App.tsx` — import del modulo, `privacyPort` memoizzato su `indexedDbConfig`, hook `usePrivacyAck(privacyPort)`, banner condizionale `{!privacyAck && <PrivacyNotice variant="banner" onAcknowledge={ackPrivacy} />}` posizionato sopra `FileLoader` (visibilità pre-azioni utente, non bloccante come da TSK-069 §Technical Specs). `Settings.tsx` — import + render incondizionato di `<PrivacyNotice variant="section" />` in coda alla sezione "Dati" (sempre consultabile come da TSK). Comandi eseguiti: `npm run typecheck` → OK (0 errori); `npm test` → **212/212 passed in 28 file** (25 nuovi test, 0 regressioni su Settings/App/Library/ThemeSelector/LegalNotice); `npm run e2e` (Playwright Chromium) → **15/15 passed in 22.4s** (nessuna regressione: app.e2e, brand.e2e, emulation-emulatorjs/gba/real/save tutti verdi nonostante il nuovo banner sopra FileLoader). Scope (R.8): solo `packages/app/src/components/PrivacyNotice/**` (nuovo) + `packages/app/src/App.tsx` + `packages/app/src/components/Settings/Settings.tsx`. Zero modifiche a be/db/qa/styles/storage/domain. Zero invenzione (R.2): tutti i claim del notice citano ADR-002 §Conseguenze o US-033 §Business Rules e sono verificabili nel codice (nessuna chiamata a SDK di tracking/auth in `packages/app/src/**`). Nessun commit (R.14).
  - Agent: fe-dev@2.15.0 · Files: packages/app/src/components/PrivacyNotice/PrivacyNotice.tsx (new), packages/app/src/components/PrivacyNotice/PrivacyNotice.test.tsx (new), packages/app/src/components/PrivacyNotice/privacy-port.ts (new), packages/app/src/components/PrivacyNotice/usePrivacyAck.ts (new), packages/app/src/components/PrivacyNotice/usePrivacyAck.test.ts (new), packages/app/src/App.tsx, packages/app/src/components/Settings/Settings.tsx · Typecheck: tsc --noEmit OK · Unit: 212/212 pass · E2E: 15/15 chromium pass

- 2026-06-03 — `develop TSK-070 (fe) → done` (avviso legale in-app no-ROM protette per US-034/EP-008, conformità Play Store + App Store). Creato nuovo modulo `packages/app/src/components/StoreComplianceNotice/` (2 file nuovi): (a) `StoreComplianceNotice.tsx` — componente sezione "Legale" sempre consultabile (no prop gating, contenuto statico), `aria-labelledby` legato all'heading, `role="note"` con `aria-label="Avviso conformità store: no-ROM protette"` (deliberatamente DIVERSO da "Avviso legale" di `LegalNotice` TSK-006 per evitare collisione strict con `getByRole('note', {name:/avviso legale/i})` nell'e2e `app.e2e.ts:10`). Testo verbatim dal TSK-070 §Technical Specs in costante esportata `STORE_COMPLIANCE_NOTICE_TEXT = "Soli-boy non include, distribuisce né supporta ROM o BIOS coperti da copyright. Usa solo file di tua legittima proprietà."`. Nota complementare `STORE_COMPLIANCE_NOTICE_DETAIL` su homebrew/pubblico dominio e responsabilità utente (US-034 §AC: "L'app non veicola contenuti protetti e mostra l'avviso legale in app"). Cross-link testuale verso la sezione Privacy della stessa schermata Settings ("consulta la sezione Privacy: tutto resta sul tuo dispositivo qui sotto"), come da TSK-070 §Implementation Steps p.3 ("Collegare al PrivacyNotice"). Stile solids (`sd-card sb-sec sb-lbl sb-note`) coerente con `LegalNotice`/`PrivacyNotice` — nessun design system improvvisato (raw/tech_stack.md §Design system). (b) test `StoreComplianceNotice.test.tsx` — 9 test (testo verbatim, contenuto US-034 Business Rules, claim legittima proprietà, homebrew/pubblico dominio, responsabilità utente, cross-link Privacy, ARIA role=note + aria-labelledby, classi solids + extra). Decisione di design (no duplicazione): NON ho esteso `LegalNotice` (TSK-006) perché ha scope/wording diverso (nota breve footer App.tsx) e i suoi test/utilizzi sono già usati dall'e2e — un nuovo componente dedicato evita regressioni e segue lo stesso pattern di `PrivacyNotice` (sezione vs nota breve). Wiring: `Settings.tsx` — import + render incondizionato di `<StoreComplianceNotice />` POSIZIONATO PRIMA della `<PrivacyNotice variant="section" />` così il cross-link "qui sotto" è semanticamente coerente. Aggiunto 1 test di integrazione in `Settings.test.tsx`: "rende sempre la sezione legale no-ROM protette" (presenza testid + asserzione testo chiave US-034). Per il `privacy_policy_url` (TSK-070 §Technical Specs: "documentato nel README.md interno, non nell'app stessa — URL definito dall'owner, gate umano per la submission") creato nuovo file `packages/app/README.md` con sezione "Store submission — metadata" che documenta `privacy_policy_url=da definire`, content rating, data safety "No data collected" coerente con ADR-002/TSK-069, checklist di submission. Scope (R.8): solo `packages/app/**` + handoff `wiki/log.md`. Comandi eseguiti: `npm run typecheck` → OK (0 errori); `npm test` → **222/222 passed in 29 file** (10 nuovi test = 9 StoreComplianceNotice + 1 integration Settings, 0 regressioni su LegalNotice/PrivacyNotice/Settings/App); `npm run e2e` (Playwright Chromium) → **15/15 passed in 29.8s** (in particolare `app.e2e.ts:10 "avviso legale visibile all'avvio"` resta verde — la collisione potenziale tra i due `role=note` è stata risolta a monte con aria-label distinto). Zero invenzione (R.2): testo verbatim dal TSK §Technical Specs, claim aderenti a US-034 §Business Rules e tech_stack.md §Vincoli trasversali; nessun URL hardcoded in-app (gate umano per la submission). DoD TSK-070: tutti i 4 punti soddisfatti — (1) avviso visibile in Settings → Legale (test integration + e2e che renderizza l'App), (2) avviso in WebView mobile (Capacitor riusa lo stesso bundle web — il componente è static markup, indipendente dalla shell), (3) test verde, (4) typecheck pulito. Nessun commit (R.14).
  - Agent: fe-dev@2.15.0 · Files: packages/app/src/components/StoreComplianceNotice/StoreComplianceNotice.tsx (new), packages/app/src/components/StoreComplianceNotice/StoreComplianceNotice.test.tsx (new), packages/app/src/components/Settings/Settings.tsx, packages/app/src/components/Settings/Settings.test.tsx, packages/app/README.md (new) · Typecheck: tsc --noEmit OK · Unit: 222/222 pass (29 files) · E2E: 15/15 chromium pass

[2026-06-03 | wiki-keeper | heal | TSK-053, TSK-056, TSK-057, TSK-058 | Iterazione 1 — diff aggregato applicato: rimossi tutti i riferimenti stale in blocked_by (GAP-electron-packaging-toolchain su TSK-053/056/058; GAP-electron-packaging-toolchain + GAP-electron-autoupdate-mechanism su TSK-057). Entrambi i gap erano già CHIUSI in wiki/gaps.md (ADR-007 + ADR-008, 2026-06-03). Re-check post-heal: 0 ERROR blocked-by-stale residui su tutti i 6 TSK di EP-006. Esito: closed. ERROR residui: 0.]

- 2026-06-03 — `develop TSK-053 (infra) → done` + `TSK-059 (infra) → in-progress` + bump globale software (richiesta owner "aggiorna tutto all'ultima stabile"). **Electron desktop (TSK-053, ADR-007)**: nuovo workspace `packages/desktop/` (electron 42.3.2, electron-builder 26.8.1, electron-updater 6.8.3) — `electron/main.ts` (BrowserWindow, custom protocol `app://` con header COOP/COEP per i core WASM threaded, IPC `fs:readFile/writeFile/showOpenDialog/showSaveDialog` per NativeFsAdapter TSK-054, electron-updater per ADR-008), `electron/preload.ts` (`contextBridge` → `window.soliboyDesktop`, contextIsolation:true/nodeIntegration:false), `electron-builder.yml` (NSIS/dmg+zip/AppImage+deb, publish github), README. Verificato `npm run smoke` → "renderer caricato, ready-to-show", exit 0. code_path TSK aggiornato a `packages/desktop/electron/` (ADR-007 supersede il `packages/app/electron/` originale). **Capacitor mobile (TSK-059, ADR-001)**: installati `@capacitor/core|cli|android|ios|filesystem|app|haptics` v8.4.0 + `capacitor.config.ts` (appId com.soli92.soliboy, webDir dist) + script cap:sync/cap:copy + sezione mobile README. `cap --version` → 8.4.0. DoD residua (cap add android/ios + verifica emulatore/simulatore) = gate human (SDK/Xcode/CocoaPods/JDK assenti), TSK resta in-progress. **Bump software ultima stabile + Node 22 LTS**: ci.yml + cd-vercel.yml + .nvmrc → Node 22; engines `>=22` su app e desktop. packages/app: React 18→19.2.7, Vite 5→8.0.16 (Rolldown), Vitest 2→4.1.8, TypeScript 5→6.0.3, jsdom 24→29, @vitejs/plugin-react 4→6, @testing-library/* + idb + fake-indexeddb a latest; 0 vulnerabilità. Fix breaking applicati: (1) Vitest 4 — `vi.fn()` non assegnabile a firma specifica → cast su `URL.createObjectURL/revokeObjectURL` (Settings.data.test.tsx); (2) dom-accessibility-api (testing-library) ora concatena gli `<span>` inline senza spazio ("tetrisGB") divergendo dal browser → aggiunto nodo whitespace `{" "}` tra titolo e badge in Library.tsx così l'accessible name resta "tetris GB" (allineato a app.e2e.ts:25 nel browser reale); (3) test logo Library reso robusto a inlining Vite 8 (URL filename OR data-URI SVG). packages/desktop: tsconfig moduleResolution `node`→`node16` (TS6 deprecava node10). **Verifica completa su Node 22.14.0 (nvm locale)**: typecheck OK · unit 222/222 · build OK · e2e 15/15 chromium · electron smoke OK · cap 8.4.0 OK. Scope: packages/app/**, packages/desktop/** (nuovo), .github/workflows/*, .nvmrc, kanban TSK-053/059. Nessun commit (R.14 — gate umano).
  - Agent: orchestrator-assist · Node: 20→22 LTS · App: React19/Vite8/Vitest4/TS6/Capacitor8 · Desktop: Electron42 · Verifica Node22: typecheck OK · 222 unit · 15 e2e · electron smoke OK

[2026-06-03 | framework-upgrade | version-bump | v2.15 → v2.17 | Upgrade framework da seed `raw/factory-bootstrap.md` (delta v2.17). Integrata la feature **FE Visual Oracle** (variante opt-in di Develop FE, PATTERN §3): nuovi file `.claude/skills/visual-oracle-protocol.md` (loop 5 fasi render headless + screenshot multi-viewport/tema + critica multimodale, single-writer di `visual_status:`), `.claude/skills/oracle-precheck.md` (gate deterministico 4 condizioni pre-dispatch), comando `/visual-oracle`, runbook `wiki/runbooks/visual-oracle-installation.md`. Aggiunto blocco `fe_correctness` (enabled: true) in `factory.config.yaml` + dominio scheduler `visual-oracle: true`. Sezioni delta no-op-a-flag-spento inserite in dev-protocol (Fase 4-bis), code-review-protocol (Fase 0 precondition `visual_status: pass`), fe-dev, orchestrator (Oracle Pre-Check), scrivi-task (State Matrix + Granularity), lint-checks (Check 4n WARNING-only), parallel-scheduling (dominio visual-oracle = sub-step L2). PATTERN.md bumpato v2.15 → v2.17 (contratto universale, +v2.16 premortem +v2.17 visual oracle, niente nuova invariante §7). Mirror su adapter `.cursor/`. Attivazione: Playwright già presente in `packages/app` (`@playwright/test`). Decisioni utente: scaffold+attiva, bump PATTERN, fedeltà lean, mirror Cursor. Fonti: raw/factory-bootstrap.md §0-§6, PATTERN.md §3/§5/§19.11. File toccati: factory.config.yaml, PATTERN.md, CLAUDE.md, .claude/skills/{visual-oracle-protocol,oracle-precheck,dev-protocol,code-review-protocol,scrivi-task,lint-checks,parallel-scheduling}.md, .claude/agents/{fe-dev,orchestrator}.md, .claude/commands/visual-oracle.md, wiki/runbooks/visual-oracle-installation.md, .cursor/**, wiki/gaps.md]

[2026-06-03 | wiki-lint | lint | post-v2.17 health check | wiki/ + kanban/ | ERROR: 0 new (v2.17 integration clean). WARNING: 1 residuo igiene (TSK-069/070 missing updated field). File toccati v2.17: visual-oracle-installation.md (new, OK), gaps.md (appended, OK), log.md (appended, OK), CLAUDE.md (bumped v2.17, OK). Report: wiki/lint/2026-06-03-lint-report-post-v2.17.md]

[2026-06-03 14:20 | visual-oracle | TSK-069 iter-1 → pass | Visual Verification del PrivacyNotice (banner primo avvio + sezione Settings → Privacy). Render Chromium headless su root SPA (context pulito → privacy-ack null → banner visibile), matrice 2 viewport (mobile 375 / desktop 1280) × 2 temi. Esito: DoD visiva soddisfatta (banner + sezione presenti, testo on-device corretto, token solids, responsive ok) → visual_status: pass. 3 findings non bloccanti: (1) minor — tema dark non esercitato (light/dark byte-identici: l'app usa theme selector esplicito TSK-044, non prefers-color-scheme → blind-spot del render harness, non difetto del componente); (2) minor — contrasto testo banner su mobile (verificare con axe-a11y); (3) trivial/by-design — testo privacy duplicato banner+Settings sulla stessa schermata. Report: code_quality/reports/TSK-069-visual-iter-1.{json,md}. Runner: .factory-runners/TSK-069-visual-iter-1.mjs.]

- 2026-06-03 — `develop TSK-054 (be) → done` (NativeFsAdapter: implementa la porta di persistenza locale su filesystem nativo via IPC Electron per il target desktop, EP-006/US-023, ADR-002). Creati 3 file in `packages/app/src/storage/`: (a) `native-fs-adapter.ts` — classe `NativeFsAdapter` che implementa l'unione `SaveStoragePort` (`StoragePort` + `SaveStatePort` + `SramPort` + `CoverPort`) + `ConfigPort` consumando un bridge IPC iniettabile `NativeFsBridge` (interfaccia minima `readFile`/`writeFile`, mappata sull'API `window.soliboyDesktop` esposta da TSK-053 — vedi nota sotto). Schema su disco: una sottodirectory per collezione (`roms/`, `save-states/`, `sram/`) con manifest JSON `index.json` + file blob `<id>.bin`; `config.json` come singolo object-map. Id ROM = hash FNV-1a 32-bit del fileBlob (identico a `db.ts`), id save state = `<romId>:<slot>:<createdAt>:<uuid>` (identico a `db.ts`) → invariante TSK "stesse chiavi logiche dell'IndexedDBAdapter (compatibilità export)" rispettato. (b) `native-fs-adapter.test.ts` — 22 unit test con bridge IPC mockato in-memory (Map<path, Uint8Array> + emulazione ENOENT): coprono `addRom` (round-trip, id da contenuto idempotente, manifest+blob), `listRoms` (filtro platform+query, primo avvio senza manifest), `removeRom` (idempotente, tombstone zero-byte), `putSaveState`/`getSaveState` (≡ restoreSaveState del TSK, vedi `port.ts`), `listSaveStates` (sort slot/createdAt, segregazione romId, due put ravvicinati coesistono), `deleteSaveState`, `putSram`/`getSram`, `setCover` (errore su ROM inesistente, parità IDB), `getConfig`/`setConfig` (round-trip, idempotenza, isolamento chiavi), persistenza cross-instance, e **guard invariante privacy US-033**: spy `globalThis.fetch` con assert `not.toHaveBeenCalled()` su un ciclo CRUD completo → zero chiamate di rete dimostrate per test (R.2). (c) `index.ts` — barrel che esporta tipi delle porte/record + `indexedDbStorage`/`indexedDbConfig` esistenti + nuovi `NativeFsAdapter`/`NativeFsBridge`. La **selezione runtime** (web/IDB vs desktop/NativeFs) NON è qui — è scope TSK-055 (factory che rileva `window.soliboyDesktop` e istanzia il NativeFsAdapter). Comandi eseguiti: `npm run typecheck` → OK (0 errori, `tsc --noEmit` pulito) · `npx vitest run src/storage` → **43/43 storage tests passed** (21 IDB esistenti + 22 nuovi NativeFs) · `npm test` (suite intera) → **76/76 unit passed in 7 file** (54 baseline + 22 nuovi), 23 errors residui di environment **pre-esistenti** (jsdom env `html-encoding-sniffer/encoding-lite.js ERR_REQUIRE_ESM` — verificato con `git stash`: baseline 7 files/54 tests/23 errors, post-change 7 files/76 tests/23 errors → zero regressione introdotta). Test NativeFs usano `// @vitest-environment node` (parità con `db.test.ts`) per evitare l'ESM/CJS interop bug di jsdom. DoD TSK-054: tutti i 4 punti soddisfatti — (1) implementa tutti i metodi richiesti del contratto reale `port.ts` (`addRom`/`listRoms`/`getRom`/`removeRom`/`putSaveState`/`listSaveStates`/`getSaveState`/`deleteSaveState`/`putSram`/`getSram`/`setCover`/`getConfig`/`setConfig`); (2) unit test sui metodi chiave indicati nel DoD (`addRom`, `listRoms`, `removeRom`, `putSaveState`, `restoreSaveState`≡`getSaveState`, `getConfig`/`setConfig`) tutti verdi; (3) invariante zero-network verificato esplicitamente via spy `fetch`; (4) typecheck pulito. **Deviazione/assunzione documentata nel codice (R.3)**: il TSK cita il namespace `window.electronAPI.fs.*` ma il bridge IPC effettivamente esposto da TSK-053 (done) si chiama `window.soliboyDesktop` (cfr. `packages/desktop/electron/preload.ts §contextBridge.exposeInMainWorld("soliboyDesktop", api)`); l'adapter consuma il nome canonico effettivo via interfaccia iniettata `NativeFsBridge` (decoupling — facilita il mock nei test e isola il renderer dal globalThis quando bundler ≠ jsdom). **Gap noto annotato nel codice (R.5, non-bloccante)**: il bridge IPC di TSK-053 espone solo `readFile`/`writeFile`/dialog — NON `mkdir`/`readdir`/`unlink`/`stat`. Conseguenze gestite via design **index-file scheme**: (1) directory base creata dal main process (l'adapter assume `baseDir` esistente, iniettato via costruttore); (2) `removeRom`/`deleteSaveState` realizzati come soft-delete (strip manifest + tombstone zero-byte sul file blob; il file orfano è ininfluente perché mai più referenziato); (3) esistenza file via `readFileIfExists` (try/catch `ENOENT`). Estensione IPC con `fs:unlink`/`fs:mkdir` è follow-up infra (TSK-053 è done, scope chiuso) — opportunistic fix evitato (PATTERN §7 r.8); apertura TSK separato lasciata all'owner. Scope (R.8): SOLO `packages/app/src/storage/**` + handoff TSK frontmatter + wiki/log.md. Zero modifiche a `db.ts`/`port.ts`/`types.ts`/`indexeddb-adapter.ts` (compatibilità preservata). Zero commit (R.14).
  - Agent: be-dev@2.17.0 · Files: packages/app/src/storage/native-fs-adapter.ts (new, ~430 LoC), packages/app/src/storage/native-fs-adapter.test.ts (new, ~260 LoC, 22 tests), packages/app/src/storage/index.ts (new, barrel) · Typecheck: tsc --noEmit OK · Unit (storage): 43/43 pass · Unit (full): 76/76 pass, 23 env errors pre-esistenti baseline `d8725bf`

- 2026-06-03 | code-reviewer | review TSK-054 iter-1 → conditional | NativeFsAdapter (packages/app/src/storage/): contratto StoragePort ok, idiomaticità TS buona, invariante zero-network verificata. 5 finding: F-1 medium (exportSave/importSave assenti vs storage-port.md spec), F-2 medium (listRoms materializza tutti i blob — eager IPC), F-3 low (isNotFoundError: cast invece di type-guard strutturato), F-4 medium (test mancante tombstone 0-byte in manifest), F-5 low (joinPath Windows path-separator). F-1/F-4/F-5 assorbibili in TSK-074; F-2/F-3 richiedono azione separata. Report: code_quality/reports/TSK-054-iter-1.json.

- 2026-06-03 — `develop TSK-074 (be) → done` (Estende bridge IPC filesystem con unlink/mkdir/readdir/stat e fa convergere NativeFsAdapter sul delete reale, EP-006/US-023, depends_on TSK-053+TSK-054). Modificati 4 file su 2 packages (R.8 scope rispettato — code_path TSK-074 = `packages/desktop/electron/` + `packages/app/src/storage/native-fs-adapter.ts`): (a) `packages/desktop/electron/main.ts` — aggiunti `ipcMain.handle("fs:unlink"|"fs:mkdir"|"fs:readdir"|"fs:stat")` con **path traversal guard** (`guardPath`): tutti i path passano per `path.resolve` e devono iniziare con `FS_BASE_DIR = path.resolve(os.homedir(), ".soli-boy")` (confronto con trailing `path.sep` per evitare il falso-positivo `/base-dir-evil`); applicato anche a readFile/writeFile esistenti per consistency. Contratto `fs:stat`: ENOENT → `{exists:false,size:0,isDirectory:false}` (no throw); altri errori (permessi, IO) si propagano. `contextIsolation:true` / `nodeIntegration:false` invariati (ADR-007); zero nuove dipendenze di rete (ADR-002). (b) `packages/desktop/electron/preload.ts` — esposti `unlink/mkdir/readdir/stat` nella whitelist `api` (contextBridge → `window.soliboyDesktop`); `SoliboyDesktopApi` type derivato via `typeof api` quindi aggiornato automaticamente. (c) `packages/app/src/storage/native-fs-adapter.ts` — (i) `NativeFsBridge` esteso con i 4 metodi (mock-friendly per i test); (ii) `removeRom` e `deleteSaveState` ora chiamano `bridge.unlink(...)` via `tryUnlink` (helper che tollera ENOENT → idempotenza); **eliminato** il tombstone zero-byte; (iii) `addRom`/`putSaveState`/`putSram`/`setCover`/`setConfig` chiamano `ensureDir(...)` (wrapper su `bridge.mkdir({recursive:true})` con cache `ensuredDirs` per evitare round-trip IPC ridondanti in batch) sulle dir di collezione (`~/.soli-boy/roms`, `~/.soli-boy/save-states`, `~/.soli-boy/sram`, baseDir per config); (iv) header del file aggiornato: rimossa la sezione "Assunzione di design" sul bridge IPC minimale, sostituita da "Conseguenze rispetto al workaround originale di TSK-054" (mkdir/unlink reali); (v) cover branch `removeRom` ora unlinka anche `<id>.cover.bin`. **Compatibilità formato chiavi/export con IndexedDBAdapter preservata** (invariante US-019): nessuna modifica a `joinPath`, schema manifest, derivazione id ROM (FNV-1a) o id save state (`<romId>:<slot>:<createdAt>:<uuid>`). **CQRL finding assorbiti** (riferimento `code_quality/reports/TSK-054-iter-1.json`): F-3 (low/robustness) — `isNotFoundError` ora usa type-guard strutturato `typeof err !== "object" || err === null` prima del cast (era cast diretto che funzionava per coincidenza su non-oggetti); F-4 (medium/test) — sostituito il test "tombstone esiste a 0 byte" con anti-regressione "blob NON esiste più dopo removeRom"; aggiunto test esplicito "no entry residue nel manifest dopo removeRom" che decodifica `roms/index.json` e verifica che l'id rimosso non sia presente; aggiunto test "removeRom rimuove anche coverBlob via unlink"; F-5 (low/idiomaticity) — costruttore normalizza `baseDir` a POSIX-style via `normalizeToPosix()` (sostituisce `\` con `/`, collassa trailing slash); aggiunto test esplicito "baseDir Windows-style viene normalizzato a POSIX" che verifica gli IPC ricevono path con `/` consistente; commento di `joinPath` aggiornato per esplicitare il contratto POSIX e il ruolo di `path.resolve` nel main come normalizzatore platform-specific. (d) `packages/app/src/storage/native-fs-adapter.test.ts` — `InMemoryBridge` esteso con `unlink/mkdir/readdir/stat` (cache `dirs` Set, `unlink` lancia ENOENT su file inesistente — emula contratto Node); aggiunti 7 test (mkdir invocato su roms/save-states/sram, unlink reale su removeRom/deleteSaveState con assert `bridge.files.has(path) === false`, anti-regressione manifest entry residue, F-5 baseDir Windows). **Test suite**: 28/28 native-fs-adapter test pass (era 22), 49/49 storage suite pass (era 43). **Typecheck**: `npm run typecheck` pulito sia per `packages/desktop` sia per `packages/app`. **DoD TSK-074**: tutti i 6 punti soddisfatti — (1) bridge IPC espone unlink/mkdir/readdir/stat con contextIsolation:true/nodeIntegration:false; (2) removeRom/deleteSaveState eseguono delete reale (test aggiornati: `bridge.files.has(blobPath)` deve essere `false`); (3) compatibilità chiavi/export con IndexedDBAdapter preservata (invariante US-019, no cambi schema); (4) path traversal guard via `guardPath()` su tutti gli handler `fs:*`; (5) nessuna chiamata di rete (guard `fetch` nel test file invariato, `not.toHaveBeenCalled()` per ogni it); (6) typecheck pulito + 49/49 storage test verdi. **Smoke desktop**: `npm run smoke` fallisce con `TypeError: Cannot read properties of undefined (reading 'isPackaged')` — **pre-esistente** (verificato via `git stash` su baseline `d8725bf`: stesso errore senza le modifiche TSK-074), causa probabile Electron 42 + Node 24 runtime, **non regressione di TSK-074**. **Azioni separate lasciate aperte (R.8)**: (i) **F-1 spec doc** (medium/design) — discrepanza `exportSave`/`importSave` su `design_&_architecture/api_specs/storage-port.md §Operazioni`: per istruzione del TSK NON aggiunti all'adapter (dominio US-019 fuori sprint); il file della spec è fuori dal `code_path` di TSK-074 (`design_&_architecture/` è scope `lead-architect`) quindi **NON toccato** in questo run — azione separata richiesta: lead-architect/PM annota in `storage-port.md` "exportSave/importSave: planned, US-019 out of sprint". (ii) **F-2** (medium/design) — `listRoms` materializza eagerly tutti i blob via IPC: fuori scope TSK-074 perché richiede modifica all'interfaccia `StoragePort` (`packages/app/src/storage/port.ts`), che è esplicitamente NON nel `code_path` di questo TSK; nessuna modifica fatta a `port.ts`/`indexeddb-adapter.ts`. Apertura di un nuovo TSK separato (decisione interfaccia: nuovo metodo `listRomsMeta` vs lazy materialization su `RomRecord.fileBlob`) richiesta a TPM. (iii) **Pre-existing smoke crash** — issue infra Electron 42 / Node 24 non causato da TSK-074, segnalato qui per tracciabilità.
  - Agent: be-dev@2.17.0 · Files: packages/desktop/electron/main.ts (modified, +~70 LoC: guardPath + 4 new ipcMain.handle), packages/desktop/electron/preload.ts (modified, +~15 LoC: 4 new whitelist methods), packages/app/src/storage/native-fs-adapter.ts (modified: NativeFsBridge esteso, ensureDir/tryUnlink helpers, rimosso tombstone, F-3+F-5 absorbed), packages/app/src/storage/native-fs-adapter.test.ts (modified: InMemoryBridge esteso con 4 op + 7 nuovi test; suite 22→28) · Typecheck: tsc --noEmit OK (desktop + app) · Unit (native-fs-adapter): 28/28 pass · Unit (storage suite): 49/49 pass · Smoke desktop: pre-esistente fail (Electron 42 + Node 24, non TSK-074)

- 2026-06-03 — `develop TSK-055 (be) → done` (selezione runtime StorageAdapter: IndexedDB su web/mobile vs NativeFs su Electron desktop — EP-006/US-023, ADR-002 §Adapter, depends_on TSK-054 done). Creati 2 file in `packages/app/src/storage/`: (a) `select-adapter.ts` — factory `selectAdapter(opts?: SelectAdapterOptions): StorageBundle` che restituisce `{ storage: SaveStoragePort, config: ConfigPort }`. Detection runtime: `isDesktopRuntime()` verifica la presenza dell'oggetto bridge `window.soliboyDesktop` (predicato puro `!!win && typeof win.soliboyDesktop === "object" && win.soliboyDesktop !== null`). Sul ramo desktop costruisce UNA istanza di `NativeFsAdapter({ bridge: window.soliboyDesktop, baseDir })` e la riusa sia per `storage` sia per `config` (l'adapter implementa entrambe le porte — cfr. `native-fs-adapter.ts §NativeFsAdapter implements ...SaveStoragePort, ConfigPort`). Sul ramo web/mobile riusa i singleton storici `indexedDbStorage` + `indexedDbConfig` (zero nuove allocazioni — DoD TSK p.1 "L'app web usa IndexedDBAdapter invariato" rispettato). `windowRef`+`baseDir` come parametri opzionali (windowRef per facilitare il mock nei test, baseDir per future estensioni del bridge). `DesktopBridgeWindow` definita localmente (no augmentazione globale di `Window` — il contratto desktop non deve trapelare ai consumer non-storage; ADR-002 invariante decoupling renderer↔desktop). (b) `select-adapter.test.ts` — 9 test (`// @vitest-environment node` per parità con `native-fs-adapter.test.ts`): mock `windowRef` vuoto → IDB; mock `windowRef.soliboyDesktop` stub-bridge → istanza `NativeFsAdapter`; `windowRef` omesso (globalThis.window assente nell'env node) → IDB (no crash); `soliboyDesktop: null` (cast esplicito) → ramo IDB no false-positive (regression-guard sul classic `typeof null === 'object'`); override `baseDir` propagato. Più 4 test sul predicato puro `isDesktopRuntime`. (c) Wiring `packages/app/src/App.tsx` — rimosso import diretto da `./storage/indexeddb-adapter`; sostituito con `import { selectAdapter } from "./storage/select-adapter"`. Bundle selezionato una volta a modulo-load (`const { storage: selectedStorage, config: selectedConfig } = selectAdapter()`), iniettato in: `useMemo(() => makeVideoSettingsPort(selectedConfig))`, `useMemo(() => makeThemePort(selectedConfig))`, `useMemo(() => makePrivacyAckPort(selectedConfig))`, `const storage = selectedStorage` (consumato da FileLoader/Library/SaveService). **Nessuna modifica al dominio**: `SaveService`/`FileLoader`/`Library`/hook continuano a consumare solo `SaveStoragePort`/`ConfigPort` (DoD TSK p.3 rispettato). Comandi eseguiti: `npm run typecheck` → OK (0 errori, `tsc --noEmit` pulito) · `npx vitest run src/storage` → **58/58 storage tests pass** (49 esistenti + 9 nuovi select-adapter) · `npx vitest run src/storage src/components/Player/video-settings-port.test.ts` → **63/63 pass** (consumer config-port non regredito). DoD TSK-055: tutti i 4 punti soddisfatti — (1) app web usa IndexedDBAdapter invariato (test "windowRef vuoto" + identity check `bundle.storage === indexedDbStorage`); (2) con `window.soliboyDesktop` mockato l'app usa NativeFsAdapter (test `expect(bundle.storage).toBeInstanceOf(NativeFsAdapter)`); (3) nessuna modifica ai servizi di dominio (diff confinato a `App.tsx` per il wiring + 2 file nuovi sotto `storage/`); (4) typecheck pulito su entrambi i rami (compilatore garantisce, runtime asserito nei test). **Deviazione documentata vs testo TSK (R.3, segnalata in chat dall'orchestrator e confermata dal codice reale)**: il TSK cita `window.electronAPI` come sniff del runtime Electron, ma il bridge effettivo esposto da TSK-053/054 è `window.soliboyDesktop` (verificato in `packages/desktop/electron/preload.ts:62` → `contextBridge.exposeInMainWorld("soliboyDesktop", api)` e in `packages/app/src/storage/native-fs-adapter.ts:4-13` §"Mapping IPC reale"); inoltre il costruttore `NativeFsAdapter` richiede `{ bridge, baseDir }` iniettati (cfr. `native-fs-adapter.ts:264`), non istanzia da solo il bridge. La factory consuma il nome canonico effettivo. **Gap noto annotato in codice (R.5, non bloccante per TSK-055)**: il bridge desktop NON espone l'absolute `baseDir` al renderer — il main process la fissa a `path.resolve(os.homedir(), ".soli-boy")` con `guardPath` su ogni IPC, ma il renderer non può ricavarla via `os.homedir()`. Soluzione adottata in TSK-055: default convenzionale `.soli-boy` (relativo) + parametro `baseDir` opzionale sulla factory per override. La risoluzione operativa dell'absolute path (es. estensione bridge con `getBaseDir(): Promise<string>` o IPC sync `getPath('userData')`) è **out of scope di TSK-055** (questo TSK è SELEZIONE, non I/O); azione separata richiesta — TSK desktop infra dedicato. Il TSK-055 di per sé soddisfa la DoD (selezione corretta, typecheck pulito); le scritture filesystem effettive saranno coperte da TSK-058 (e2e con IPC mock). Scope (R.8): SOLO `packages/app/src/storage/select-adapter.ts` (new) + `packages/app/src/storage/select-adapter.test.ts` (new) + wiring additivo in `packages/app/src/App.tsx` (5 righe modificate: 1 import sostituito + 1 bundle a modulo-load + 3 sostituzioni `indexedDbConfig`→`selectedConfig`). Zero modifiche a `port.ts`/`indexeddb-adapter.ts`/`native-fs-adapter.ts`/`index.ts` (preservata l'atomicità additiva richiesta dal task). Zero modifiche a `packages/desktop/**` (fuori scope). Zero commit (R.14).
  - Agent: be-dev@2.17.0 · Files: packages/app/src/storage/select-adapter.ts (new, ~135 LoC), packages/app/src/storage/select-adapter.test.ts (new, ~105 LoC, 9 tests), packages/app/src/App.tsx (modified, 5 righe: import + bundle modulo-load + 3 sostituzioni config) · Typecheck: tsc --noEmit OK · Unit (storage): 58/58 pass · Unit (storage + video-settings-port): 63/63 pass · Smoke runtime: detection verificata via test (mock `window.soliboyDesktop`)

- 2026-06-03 — `develop TSK-075 (be) → done` (chiusura finding **F-2** del code-review TSK-054: `NativeFsAdapter.listRoms` materializzava eager tutti i `fileBlob` via N round-trip IPC `readFile`, mentre la Library UI consuma solo metadati). **Opzione di design scelta: A (additiva)** — nuovo metodo `listRomsMeta(filter?: RomFilter): Promise<RomMeta[]>` su `StoragePort`, niente flag su `listRoms`. Motivazioni: (1) zero breaking sui consumer esistenti (l'unico consumer reale di `listRoms` in app era `Library.tsx`, gli altri match nei test). (2) Naming esplicito → l'intento "metadata-only" è leggibile al call-site senza opt-in pattern. (3) `LibraryService.list()` resta sul vecchio `listRoms` per i consumer di dominio che si aspettano `RomRecord[]` (test legacy intatti). **Shape `RomMeta`**: `Omit<RomRecord, "fileBlob">` — esclude esplicitamente solo il `fileBlob` (binario ROM, KB-MB, vero target di F-2), include `coverBlob?: Blob` perché la Library lo renderizza nelle tile (`<img>`, payload piccolo, opzionale → 0 IPC quando la cover non è caricata). Decisione documentata in `types.ts §RomMeta`. **File toccati** (scope chiuso su `packages/app/src/storage/` + consumer Library): (a) `port.ts` — aggiunto `listRomsMeta` allo `StoragePort` (JSDoc cita F-2 e la parità IDB↔NativeFs); commento di `listRoms` aggiornato (sconsigliato per consumer UI). (b) `types.ts` — nuovo `export type RomMeta = Omit<RomRecord, "fileBlob">` con commento sulla decisione esplicita su `coverBlob` incluso. (c) `native-fs-adapter.ts` — nuovo `listRomsMeta` che riusa `filteredRomEntries` (fattorizzato) + `materializeRomMeta` (salta `readFile` sul `fileBlob`; `coverBlob` materializzata solo se `entry.coverPath`). Costo IPC: 1 readFile sul manifest + ≤N readFile sulle cover esistenti; 0 readFile sui ROM. (d) `db.ts` — `listRomsMeta` su IDB ritorna `listRoms(filter).map(toMeta)` (helper strip su `fileBlob`). Su IDB il costo è equivalente a `listRoms` (idb deserializza il record intero comunque) — il valore aggiunto è l'interfaccia omogenea con NativeFs. (e) `indexeddb-adapter.ts` — export `listRomsMeta` nel `SaveStoragePort` bundle. (f) `index.ts` — riesporto `RomMeta`. **Consumer aggiornati**: `Library.tsx` — switch da `listRoms` a `listRomsMeta`; lo `useState` ora è `RomMeta[]`; nuovo handler `handleSelect(meta)` carica lazy il `RomRecord` completo via `storage.getRom(id)` al click (1 IPC `readFile` per il `fileBlob` invece di N al caricamento). Race fallback: ROM rimossa nel frattempo → no-op + `console.warn` (non scaliamo a `error` che smonterebbe la lista, parità con `coverError`). `GameTile.rom` ora tipizzata `RomMeta`. **Test aggiornati / aggiunti**: (1) `native-fs-adapter.test.ts` — nuova suite `NativeFsAdapter — listRomsMeta (TSK-075)` con 6 test: spy `bridge.calls` verifica **zero readFile sui `*.bin` ROM** (chiusura F-2), shape ritornata senza `fileBlob`, propagazione `coverBlob`, parità filtro piattaforma/query, storage vuoto, assenza manifest. (2) `db.test.ts` — nuova suite `storage roms metadata-only (TSK-075)` con 3 test: shape senza `fileBlob`, parità filtro, empty. (3) `Library.test.tsx` — `fakeStorage` esteso con `listRomsMeta` (strip) e `getRom` funzionante; alert test rinominato a "listRomsMeta rejecta". (4) `library-service.test.ts`, `rom-library.test.ts`, `FileLoader.test.tsx` — fake estesi con `listRomsMeta` per conformare al nuovo contratto `StoragePort` (zero asserzioni di comportamento aggiunte; solo type-conformance). **Invariante US-019 (export/import salvataggi)** preservata: `listRomsMeta` non tocca `saveStateId()` né i path dei save-state (cfr. `native-fs-adapter.ts §saveStateId`); export/import passano per `SaveService`/`Settings.tsx`, fuori dal blast radius. **Scope (R.8) rispettato**: zero modifiche a `select-adapter.ts` (TSK-055 done), zero a `bios.ts`/`save-service.*`/`Settings.tsx`. Guard zero-network (US-033) preservata (spy `fetch` nei test). **Comandi**: `npm run typecheck` → 0 errori. `npx vitest run src/storage src/domain/library-service.test.ts src/domain/rom-library.test.ts --environment=node` → **72/72 pass**. **Deviazione (R.5)**: i test jsdom (`Library.test.tsx`, `FileLoader.test.tsx`) NON sono stati eseguiti in questo run a causa di un problema di environment pre-esistente sul main (`html-encoding-sniffer` ESM/CJS mismatch — riprodotto via `git stash` su `main` senza le mie modifiche → STESSO errore). Tutte le mie modifiche sui consumer sono comunque type-safe (typecheck pulito conferma il contratto del `fakeStorage` esteso). Issue di environment da risolvere in TSK separato (infra/dev), fuori scope di TSK-075. Zero commit (R.14).
  - Agent: be-dev@2.17.0 · Files: packages/app/src/storage/port.ts (modified: +listRomsMeta + JSDoc su listRoms), packages/app/src/storage/types.ts (modified: +RomMeta type), packages/app/src/storage/native-fs-adapter.ts (modified: +listRomsMeta + materializeRomMeta + filteredRomEntries factor-out), packages/app/src/storage/db.ts (modified: +listRomsMeta + toMeta helper), packages/app/src/storage/indexeddb-adapter.ts (modified: +listRomsMeta nel bundle), packages/app/src/storage/index.ts (modified: +RomMeta riesporto), packages/app/src/components/Library/Library.tsx (modified: useState RomMeta[] + listRomsMeta + handleSelect lazy via getRom), packages/app/src/storage/native-fs-adapter.test.ts (modified: +6 test listRomsMeta, suite 28→34), packages/app/src/storage/db.test.ts (modified: +3 test listRomsMeta IDB), packages/app/src/components/Library/Library.test.tsx (modified: fakeStorage esteso + alert test rinominato), packages/app/src/components/FileLoader/FileLoader.test.tsx (modified: fakeStorage esteso), packages/app/src/domain/library-service.test.ts (modified: fakeStorage esteso), packages/app/src/domain/rom-library.test.ts (modified: fakeStorage esteso) · Typecheck: tsc --noEmit OK · Unit (storage + domain node): 72/72 pass (4 file storage + 2 domain) · Unit (jsdom Library/FileLoader): pre-esistente env-fail (html-encoding-sniffer ESM, riprodotto su main) — typecheck garantisce contract-conformance

- 2026-06-03 — `develop TSK-077 (be) → done` (bridge IPC `fs:getBaseDir` + risoluzione baseDir assoluta nel NativeFsAdapter — chiude il gap documentato in TSK-055 §Deviazioni: il renderer ora ottiene la root autoritativa del main process invece di usare il valore convenzionale `.soli-boy` relativo. EP-006/US-023, ADR-002 §Invariante, depends_on TSK-074+TSK-055). **File toccati** (scope chiuso esattamente come da TSK frontmatter `code_path`): (a) `packages/desktop/electron/main.ts` — nuovo handler `ipcMain.handle("fs:getBaseDir", async () => FS_BASE_DIR)`. **Single source of truth col `guardPath` esistente**: riusa la stessa costante `FS_BASE_DIR = path.resolve(os.homedir(), ".soli-boy")` (TSK-074) — NON ricalcolata, NON duplicata. Conseguenza: ogni divergenza futura della root (es. override per test) si propaga automaticamente sia al guard sia al renderer. `contextIsolation:true` / `nodeIntegration:false` invariati (ADR-007); nessuna nuova dipendenza di rete (ADR-002). (b) `packages/desktop/electron/preload.ts` — nuovo `getBaseDir: (): Promise<string> => ipcRenderer.invoke("fs:getBaseDir")` nella whitelist `api` (stile esistente — arrow function, JSDoc che cita TSK-077 e l'invariante lazy+memoized). `SoliboyDesktopApi` derivato via `typeof api` quindi aggiornato automaticamente. (c) `packages/app/src/storage/native-fs-adapter.ts` — interfaccia `NativeFsBridge` estesa con `getBaseDir?(): Promise<string>` **OPZIONALE** (retro-compat con bridge pre-TSK-077 e mock di test legacy che non lo implementano). Adapter class refactor: il vecchio `private readonly baseDir: string` rinominato a `fallbackBaseDir` (esplicito sul ruolo nuovo); introdotto `private resolvedBaseDirPromise: Promise<string> | undefined` come cache memoizzata. Nuovo metodo `resolveBaseDir(): Promise<string>` con tre proprietà essenziali: (i) **LAZY** — la prima chiamata al bridge avviene alla prima operazione FS, NON nel costruttore. Conseguenza: `selectAdapter()` e `App.tsx` restano SINCRONI come prima (DoD TSK-077 §3 — "no ripple async sui consumer"). (ii) **MEMOIZZATA su Promise (non su valore)** — chiamate concorrenti durante la risoluzione condividono la STESSA Promise pending (single-flight, no race condition / no IPC storm). Una volta risolta, le chiamate successive sono solo `await` su una Promise fulfilled (zero IPC). Test esplicito `chiamate concorrenti condividono la stessa risoluzione (single-flight, no race)`: 3 `addRom` in parallelo → `getBaseDirCalls === 1`. (iii) **FALLBACK ESPLICITO** — se `bridge.getBaseDir` è `undefined` (bridge pre-TSK-077 / stub di test) → ritorna `fallbackBaseDir` (il valore convenzionale passato al costruttore). Se invece `bridge.getBaseDir()` rigetta (IPC unavailable) → catch interno alla Promise risolta → fallback. Nessun retry storm. Test espliciti per entrambi i casi (`se il bridge NON espone getBaseDir → fallback esplicito al baseDir del costruttore`, `se getBaseDir() rigetta → fallback esplicito (no rottura cascading)`). Tutti i path helpers (8 helpers `*Path` + 3 helpers `*DirPath`) convertiti da sync a `async`: ognuno fa `joinPath(await this.resolveBaseDir(), ...)`. I 25 call-site nei metodi pubblici (`addRom`/`getRom`/`removeRom`/`setCover`/`putSaveState`/`listSaveStates`/`getSaveState`/`deleteSaveState`/`putSram`/`getSram`/`getConfig`/`setConfig` + materializers + manifest read/write) aggiornati col prefisso `await` davanti alla chiamata al path helper. Costo: un microtask in più per chiamata (Promise già fulfilled dopo la prima risoluzione) — trascurabile rispetto al round-trip IPC che ogni operazione FS già fa. Vecchio comportamento normalizeToPosix(opts.baseDir) preservato come fallback; la PROMISE risolta passa anch'essa per `normalizeToPosix` (invariante F-5 TSK-074 mantenuta anche sul path assoluto risolto dal main). (d) `packages/app/src/storage/native-fs-adapter.test.ts` — nuova suite `NativeFsAdapter — bridge.getBaseDir (TSK-077)` con 6 test: (1) bridge con `getBaseDir` ritornante `/Users/foo/.soli-boy` → tutte le write FS partono da `/Users/foo/.soli-boy/...` (NO `.soli-boy/...` naked); mkdir su `/Users/foo/.soli-boy/roms` recursive; round-trip `getRom` legge dal path assoluto. (2) memoizzazione single-flight — 10 operazioni FS variegate (addRom/listRoms/listRomsMeta/setConfig/getConfig/putSaveState/listSaveStates/putSram/getSram/removeRom) → `getBaseDirCalls === 1`. (3) chiamate concorrenti (3 addRom in `Promise.all`) → `getBaseDirCalls === 1` (regression guard contro memoizzazione del valore invece della Promise). (4) bridge senza `getBaseDir` → fallback al costruttore (path IPC partono da `/tmp/legacy-base/`). (5) `getBaseDir()` che rigetta → fallback esplicito senza propagare l'errore IPC al chiamante (`addRom` resolve, non reject). (6) **Lazy guard cardinale** — `new NativeFsAdapter()` con bridge che ha `getBaseDir` → `getBaseDirCalls === 0` e `bridge.calls === []` PRIMA di qualsiasi operazione FS. È questa asserzione che garantisce formalmente che `selectAdapter()` / `App.tsx` non ereditino async dal costruttore. (e) `packages/app/src/storage/select-adapter.ts` — **solo aggiornamento del commento di apertura** §baseDir (additivo, no code change): documenta che il TSK-077 ha chiuso il gap (renderer ora risolve la root assoluta via bridge); il `baseDir` passato a `NativeFsAdapter` è ora puramente un fallback. Funzione `selectAdapter()` invariata — resta SINCRONA per costruzione (confermato dal test (6) di sopra). **Compatibilità formato chiavi/export con IDB (US-019)** preservata: nessuna modifica a `joinPath`, schema manifest, derivazione id ROM (FNV-1a) o id save state (`<romId>:<slot>:<createdAt>:<uuid>`); cambia SOLO il prefisso assoluto dei path nelle chiamate IPC, niente nei dati persistiti. **Comandi eseguiti**: `npm run typecheck` (app) → 0 errori · `npm run typecheck` (desktop) → 0 errori · `npx vitest run --environment=node src/storage` → **73/73 storage tests pass** (40 native-fs-adapter inclusi i 6 nuovi TSK-077, 9 select-adapter, ... — incremento +6 vs baseline 67 di TSK-076). DoD TSK-077: tutti i 5 punti soddisfatti — (1) `fs:getBaseDir` esposto dal bridge con `contextIsolation:true`/`nodeIntegration:false` (verificato manualmente nei diff main.ts/preload.ts); (2) `NativeFsAdapter` usa la base dir assoluta autoritativa del main (test (1)); (3) `selectAdapter()` / `App.tsx` restano sincroni (test (6) asserisce 0 chiamate al bridge nel costruttore); (4) fallback esplicito se `getBaseDir` assente (test (4)) o se rigetta (test (5)); (5) typecheck pulito + storage tests verdi. **Deviazione (R.5)**: i test jsdom (`Library.test.tsx`/`FileLoader.test.tsx`/altri UI) NON sono stati eseguiti in questo run per via dell'errore di environment pre-esistente su main `html-encoding-sniffer ERR_REQUIRE_ESM` (già segnalato nei log TSK-075/076 e ribadito dall'orchestrator nella consegna TSK-077). Tutti i miei cambi sono nello strato BE storage + bridge IPC, non toccano componenti UI; il typecheck pulito su entrambi i package conferma il contratto. Issue di environment infra resta fuori scope (TSK separato). **R.8 scope chiuso esattamente** sui 3 file dichiarati nel TSK frontmatter (+ rispettivo `.test.ts` per il punto 4 del piano) + un commento additivo in `select-adapter.ts` come da istruzione "solo se strettamente necessario, additivo": il commento riflette la chiusura del gap (no code change). Zero modifiche a `port.ts`/`indexeddb-adapter.ts`/`App.tsx`/`Library.tsx`/altri consumer. Zero commit (R.14).
  - Agent: be-dev@2.17.0 · Files: packages/desktop/electron/main.ts (modified, +~12 LoC: ipcMain.handle("fs:getBaseDir") che riusa FS_BASE_DIR — single source of truth con guardPath), packages/desktop/electron/preload.ts (modified, +~10 LoC: getBaseDir nella whitelist api + JSDoc), packages/app/src/storage/native-fs-adapter.ts (modified: NativeFsBridge.getBaseDir? optional; resolveBaseDir() lazy+memoized via Promise cache; fallbackBaseDir rename; tutti i path helpers convertiti async; 25 call-site aggiornati con `await`), packages/app/src/storage/native-fs-adapter.test.ts (modified: +6 test TSK-077 — abs root resolution, memoization single-flight, race-free concurrency, missing getBaseDir fallback, IPC rejection fallback, lazy-on-construct guard; suite 34→40), packages/app/src/storage/select-adapter.ts (commento §baseDir aggiornato additivo, no code change — riflette chiusura gap) · Typecheck: tsc --noEmit OK (app + desktop) · Unit (storage --environment=node): 73/73 pass · Unit (jsdom UI): pre-esistente env-fail (html-encoding-sniffer ESM, non regressione TSK-077)

- 2026-06-03 — `review TSK-077 iter-1 → conditional`
  - Reviewer: code-reviewer@2.12.0 · Stack: typescript/electron (conf 0.97)
  - Finding: {high:0, medium:1, low:2} · Report: code_quality/reports/TSK-077-iter-1.json
  - F-077-1-R1 (medium, TS-ROBUST-001): resolveBaseDir non valida il tipo/vacuità del valore restituito dal bridge nel then-handler — path non-stringa o vuoto potrebbe essere propagato silenziosamente.
  - F-077-2-I1 (low, TS-IDIOM-002): non-null assertion `winRef!` in select-adapter.ts:137 priva di commento giustificativo inline.
  - F-077-3-Q1 (low, QA-TEST-001): suite TSK-077 non copre il ramo getBaseDir-presente + output Windows-style NT-path.
  - Memoizzazione, single-flight, lazyness, fallback rejection, copertura test principale: tutti eccellenti.

[2026-06-03] review TSK-075 iter-1 → conditional
[2026-06-03] review TSK-075 iter-2 → passed
[2026-06-03] review TSK-073 iter-1 → conditional

[2026-06-03] review TSK-077 iter-1 → conditional
[2026-06-03] review TSK-077 iter-2 → passed

[2026-06-03] review TSK-055 iter-1 → passed

[2026-06-03] review TSK-074 iter-1 → conditional
  - Reviewer: code-reviewer@2.17.0 · Stack: typescript/electron-ipc (conf 0.95)
  - Finding: {high:0, medium:1, low:2} · Report: code_quality/reports/TSK-074-iter-1.json
  - F-074-1 (medium, TS-ROBUST-001): guardPath non copre symlink — un symlink dentro FS_BASE_DIR che punta fuori dalla base dir bypassa il prefix-match (path.resolve non dereferenzia link simbolici).
  - F-074-2 (low, TS-DESIGN-001): asimmetria contratto IPC — fs:unlink lancia ENOENT, fs:stat restituisce {exists:false}; documentata ma non omogenea.
  - F-074-3 (low, TS-ROBUST-001): ensuredDirs cache per-istanza senza invalidazione — falso negativo se dir rimossa esternamente a runtime.
  - guardPath prefix-match + trailing-sep corretto; contextIsolation:true/nodeIntegration:false/sandbox:true OK; delete reale testato; DoD F-3/F-4/F-5 TSK-054 assorbiti.

[2026-06-03] review TSK-073 iter-2 → conditional
  - Reviewer: code-reviewer@2.17 · Stack: typescript/playwright (conf 0.95)
  - Finding: {high:0, medium:0, low:1} · Report: code_quality/reports/TSK-073-iter-2.json
  - F-2 (medium, QA-TEST-001): CHIUSA — waitForTimeout sostituiti con expect(html).toHaveAttribute event-driven.
  - F-3 (medium, TS-DESIGN-001): CHIUSA — VALID_THEMES = UI_THEMES import diretto da useTheme.ts (SSOT verificata).
  - F-4 (low, TS-ROBUST-001): CHIUSA — console.warn aggiunto in entrambi i rami onerror di clearThemeInDB.
  - F-1 (low, TS-ROBUST-001): APERTA degradata medium→low — waitForLoadState(domcontentloaded) riduce race ma non copre React useEffect mount asincrono; path normale safe, rischio residuo teorico per caller futuri.
[2026-06-03] review TSK-074 iter-2 → passed
  - Reviewer: code-reviewer@2.17.0 · Stack: typescript/electron-ipc (conf 0.95)
  - Finding iter-2: {high:0, medium:0, low:0} · Report: code_quality/reports/TSK-074-iter-2.json
  - F-074-1 (medium): CLOSED — guardExistingPath() introdotta e applicata a tutti gli handler su path esistenti (fs:readFile/unlink/readdir/stat); fail-closed su ELOOP/EPERM; fallback ENOENT corretto; limite residuo su fs:writeFile/mkdir documentato e accettato.
  - F-074-2 (low): CLOSED — asimmetria ENOENT documentata con JSDoc in main.ts:220-230 e preload.ts §unlink.
  - F-074-3 (low): CLOSED — JSDoc esteso su ensuredDirs (22 righe, native-fs-adapter.ts:295-312) + cross-reference in addRom.
  - Gap test symlink: non bloccante — assenza harness main process Electron (structural constraint); tracciato come DEBT-074-A in report iter-2.
  - Open debt: DEBT-074-A (QA-TEST-001, low) harness main process per guardExistingPath; DEBT-074-B (TS-ROBUST-001, low) realpath parent su fs:writeFile/mkdir.

## 2026-06-05 — develop EP-012 (remediation a11y + UX/UI retroattiva, TSK-079..083)
[2026-06-05] develop TSK-079 → done · TSK-080 → done · TSK-081 → done · TSK-082 → done · TSK-083 → done
  - Scope: verifica retroattiva a11y (WCAG 2.2 AA) + UX/UI (rubrica Nielsen + UI/UX) su 21 TSK sorgente già `done` (FE).
  - Tooling: `a11y-scan.sh` (Playwright + axe-playwright); script inline `axe-playwright` + screenshot Playwright in `packages/app` (rimossi post-run, R.18 mai persistere temp).
  - Setup esercitato: SPA single-route `http://localhost:5179/` (sempre-visibile: FileLoader, LegalNotice, Library, ThemeSelector, logo, PrivacyNotice, Settings) + carico ROM libera `dmg-acid2.gb` (MIT) via `?engine=real` per esercitare componenti ROM-gated (Player, controls, SaveStatePanel, Fullscreen, Settings → Resa video / Filtri / Dati / Controlli). Tema switching via UI selector (`Tema dell'interfaccia`) per coprire 90s-party + dark.
  - Esito frontmatter sorgente (21/21): a11y_status valorizzato pass×16, major×5 (TSK-003 dark loader label, TSK-040 DS cross-cutting, TSK-038 chip-on 90s-party, TSK-014 sb-danger 90s-party, TSK-044 cross-token); ux_ui_status: pass×21 (no conditional/reject).
  - Gap dichiarati nei report: tema cyberpunk non scansionato (gap TSK-044/046); sub-stati Player fullscreen-attivo / loadState completato / dialog errore engine-mismatch non esercitati (manual checks raccomandati nei report).
  - No auto-fix codice (vincolo retroattivo: `packages/app/**` intatto); finding major → open_questions sui TSK sorgente + entry `wiki/gaps.md` (gate owner).
  - Report: `code_quality/reports/TSK-{003,006,008,012,014,017,020,022,032,033,035,036,037,038,039,040,041,044,046,069,070}-{a11y,uxui-review}-iter-1.{json,md}` (42 file). Run aggregati: `code_quality/reports/ep012-runs/all-runs.json`, `all-runs-dark.json`, 12 screenshot PNG.
  - Manual checks `N≥1` rispettata su tutti i report a11y (regola di neutralità ADR-016 §G).

## 2026-06-05 — develop + a11y EP-012 (TSK-084 → done, gap color-contrast cross-cutting CHIUSO)
[2026-06-05] develop TSK-084 → done · a11y re-scan iter-2 OK su 5 TSK sorgente
  - Scope: fix codice dei 5 finding `color-contrast` Major (WCAG 2.2 AA) emersi da EP-012 remediation (TSK-079..083). 3 selettori cross-cutting: `.sb-loader > label` (dark), `.sb-chip-on` (90s-party + dark + cyberpunk), `.sb-danger.sb-btn` (90s-party). Sub-gap cyberpunk incluso.
  - Sorgente fix: `@soli92/solids@1.14.1` in `node_modules` IMMUTABILE → override app-level in `packages/app/src/styles/app-extra.css` (importato in `main.tsx` DOPO `@soli92/solids/dist/css/index.css`; nota di redirect aggiunta in `solids-theme.css`).
  - Token override (before → after, ratio raggiunto):
    1. `[data-theme="dark"] --sd-color-primary-default: #3B82F6 → #1d4ed8` (+ `--sd-color-primary-hover: → #1e40af`) — `.sb-btn-primary` (incl. `.sb-loader > label`) bianco su nuovo blu = **6.70:1** (era 3.67).
    2. `[data-theme="dark"] .sb-chip-on { color: #93c5fd }` — compensa scuriamento del primary sul chip dark, **9.51:1** (sarebbe regredito a 2.56 senza questo).
    3. `[data-theme="90s-party"] .sb-chip-on { color: #ffd1ff }` — was `#e019dd`, **10.48:1** (era 3.55).
    4. `[data-theme="90s-party"] .sb-danger { color: #ff8fb8; border-color: #ff8fb8 }` — was `#ff0055`, **7.78:1** (era 4.24).
    5. `[data-theme="cyberpunk"] --sd-color-primary-subtle: #0e7490 → #052e36` — `.sb-chip-on` cyan FG su nuovo subtle = **5.96:1** (era 2.21, sub-gap iter-1 incluso).
  - Verifica iter-2: axe-playwright su `http://localhost:5179/` (dev server già attivo), 3 temi × 2 viewport (375 + 1280) + scope `synthetic-3-states` con probe DOM dei 3 selettori. **0 finding `color-contrast` major/critical** su tutte le 9 combinazioni. Manual checks N≥1 su ogni report (regola di neutralità).
  - Frontmatter 5 TSK sorgente aggiornati: TSK-003 / TSK-014 / TSK-038 / TSK-040 / TSK-044 → `a11y_status: pass`, `a11y_report: code_quality/reports/TSK-*-a11y-iter-2.md`, `open_questions: []` (le entry relative al contrasto sono risolte). TSK-084 → `status: done`, `a11y_status: skip` (fix task, verifica vive sui TSK sorgente).
  - Report iter-2: `code_quality/reports/TSK-{003,014,038,040,044}-a11y-iter-2.{json,md}`; run aggregati `code_quality/reports/ep012-runs/all-runs-iter2.json` + `all-runs-iter2-synthetic.json`; screenshot `ep012-runs/iter2-*.png` (9 PNG).
  - `wiki/gaps.md`: gap `ds-color-contrast-cross-cutting-90s-party-dark` marcato CHIUSO (append-only) con breakdown dei 5 override e ratio raggiunti. Sub-gap cyberpunk incluso e risolto.
  - Build: `npm --prefix packages/app run build` verde (tsc --noEmit + vite build).

## 2026-06-09 — upgrade v2.18 → v2.19 (attivazione EP-013 analytics dogfooding)
[2026-06-09] develop UPGRADE-v2.19 → done · factory pattern_version 2.18→2.19
  - Scope: portare il delta v2.19 *derivabile* in soli-boy per abilitare il battle-test v2.19.0-rc (RUN #2/#3 del gate EP-012 del meta-framework). Il resto di v2.19 è governance meta (release-validation-gate, complexity-budget) NON scaffoldata in factory derivate (ADR-033 §C) → non applicabile a soli-boy.
  - Delta applicato (additivo, non distruttivo):
    1. `.claude/tools/analytics/` — 11 tool (record-event.sh, harvest-session-tokens.py, compute-agentic-cost.sh, generate-report.sh, analyze-timeline.sh, …).
    2. `analytics/{pricing.yaml,rates.yaml,PRIVACY.md, *.template}` versionati; `analytics/events/` + `analytics/reports/` gitignored (ADR-021 §A).
    3. `.claude/settings.json` — hook SessionEnd `harvest-session-tokens.py --project soli-boy` (EP-013 dogfooding).
    4. `factory.config.yaml` — blocco `analytics: {measurement.enabled, dogfooding.enabled}` + bump `pattern_version: "2.19"`. Nota precedente "analytics NON importato (fuori scope v2.18)" superata.
  - Smoke test: `record-event.sh` OK (evento UPGRADE-v2.19 appeso a analytics/events/2026-06.jsonl, hash 487e76e7). PII boundary enforced (event_id/api_key/password/prompt rifiutati, ADR-040 §A). flock non disponibile su questo FS → degradazione graceful advisory (ADR-039 §A).
  - Razionale battle-test: il gate richiede analytics_events_count > 0 per ogni RUN-REPORT quando dogfooding è on (ADR-041 §C). soli-boy ora emette eventi reali durante i run #2/#3.

## 2026-06-09 — TSK-063 done (fe-dev)

**TSK-063 — File picker mobile: caricamento ROM/BIOS da filesystem e provider cloud (Capacitor)**

Implementazione completata. Nessun TSK BE bloccante.

### File creati/modificati

- `packages/app/src/components/FileLoader/useCapacitorFilePicker.ts` (**nuovo**) — astrazione per la lettura di file URI via `@capacitor/filesystem`. Esporta: `isCapacitorNative()` (guard, stesso pattern di `useHaptics.ts`), `readFileFromUri(uri, filename, api?)` (legge URI nativa, decodifica base64 → `ArrayBuffer` → `File`), `filenameFromUri(uri)` (deriva filename da URI Android/iOS).
- `packages/app/src/components/FileLoader/FileLoader.tsx` (**modificato**) — aggiunto `handleCapacitorUri` (interno) e prop `registerUriHandler` (espone l'handler al parent per gestire Android intent / iOS deep-link). Path `<input type="file">` invariato; guard `isCapacitorNative()` garantisce no-op su browser.
- `packages/app/src/components/FileLoader/useCapacitorFilePicker.test.ts` (**nuovo**) — 11 test: `isCapacitorNative` (3), `readFileFromUri` (5 — base64/Blob/error/null/readFile-call), `filenameFromUri` (5).
- `packages/app/src/components/FileLoader/FileLoader.test.tsx` (**modificato**) — 4 test aggiuntivi TSK-063: no-op browser, Capacitor mock → onImported, Capacitor read error → alert, web path invariato con Capacitor nativo.

### Esito verifiche

- TypeScript typecheck: **0 errori**
- Build Vite: **OK** (903ms)
- Test: **368 passed / 368 total** (+17 nuovi, 351 originali invariati)

### Findings / attriti reali

1. **`<input type="file">` già funziona su Capacitor WebView** — su Android/iOS l'elemento HTML standard apre il picker di sistema inclusi i provider cloud (Google Drive, iCloud); l'`onChange` ritorna sempre oggetti `File` (mai URI raw). L'aggiunta Capacitor-specifica serve esclusivamente per il path intent/deep-link dove il file arriva come URI esterna.
2. **`Filesystem.readFile` su nativo ritorna `data: string` (base64)** — non un `Blob`; la decodifica `atob` → `Uint8Array` → `ArrayBuffer` è necessaria. Su web ritorna `Blob` direttamente.
3. **`Buffer.from(b64, 'base64')` non disponibile** in ambiente browser/jsdom — rimosso; `atob` è sufficiente e universale (ES2015+, jsdom incluso).
4. **Cache del dynamic import**: `loadFilesystemApi()` usa una Promise memoizzata per evitare import multipli (stesso pattern di `useHaptics.ts`). Il parametro iniettabile `_filesystemApi` bypassa il dynamic import per i test senza dover mockare `@capacitor/filesystem`.
5. **DoD "provider cloud"** — non richiede implementazione extra: il picker di sistema (via `<input type="file">`) include automaticamente Google Drive e iCloud su Android/iOS rispettivamente. Non è necessario alcun plugin aggiuntivo.
6. **DoD "smoke test su emulatore"** — gate umano (richiede Android Studio/Xcode, assenti in env agent); marcato come requisito umano nella DoD del TSK.

[2026-06-09 15:25] ux-ui-review http://127.0.0.1:4317/ (soli-boy home, prima review VISIVA reale post-ADR-064) → conditional (1 major, 2 minor, 1 finding scartato anti-fabbricazione)
[2026-06-09 16:54] functional-oracle soliboy (carica ROM gba-tests-thumb → avvia) → REJECT: emulazione non avanza (canvas congelato, stato mai running; COOP/COEP ok → causa app-level). Prima esecuzione funzionale reale EP-018.
[2026-06-09 17:05] CORREZIONE functional-oracle soliboy-iter-1: verdict reject INVALIDATO (falso negativo). Maintainer conferma: emulazione PARTE. Cause: fixture test-ROM statica + canvas piccolo default + assert HUD. Finding UX reali registrati (emulatore small, touch overlay, info su home → nav dedicata).

[2026-06-09 17:30] ux-ui-design soli-boy IA redesign (brief: F-01 muro configurazione + viewport piccolo + TouchOverlay posizionamento) → ia_redesign+wireframe+touchoverlay_repositioning
[2026-06-09 17:20] functional-oracle soliboy iter-2 → PASS: engine running confermato (bottone Pausa presente). Falso negativo iter-1 risolto (assert via segnale app, non testo HUD). Finding collaterale: canvas CSS 378x24px (altezza collassata) → backlog UX.
[2026-06-09 17:55] residui redesign soli-boy: TouchOverlay Variante B (portrait controlli SOTTO lo schermo, landscape 3-col, fullscreen overlay invariato) + Settings accordion (7 details, 1 aperta/6 chiuse). Verificato: 420 test, typecheck, mobile overlayBelowScreen=true, functional running=true.
[2026-06-09 18:00] chiusura residui-cosmetici: doppio-header Legale/Privacy risolto (prop headingHidden, sbLblCount=1) + marker <details> stilizzato DS (chevron ^ , nativo nascosto). 420 test, typecheck, build OK. Residuo device fisico: non automatizzabile (resta verifica umana).

[2026-06-15 10:00] fe-dev | develop | TSK-085 | EP-019 art-director statement prodotto: design_&_architecture/ux-design-rationale-ep019.md (INTENT/PROBLEM/RATIONALE/CONSTRAINTS + DESIGN SPEC DSL 3 layout + CRITIC PASS verdict conditional)
2026-06-15 15:30 | docs-dev | develop | TSK-090 | EP-019 critic report globale: 2 finding non previsti (backlog sincronizzato), 1 capability iterata (scale test), debito EP-018 saldato
2026-06-15 15:35 | qa-dev | develop | TSK-091 | EP-018 re-check: functional oracle stabile, falso-negativo iter-1 risolto, debito v2.20 saldato

## TSK-103 — 2026-06-15 — HUD Player user-facing: romTitle + stati italiani + overlay pausa
fe-dev | develop | EP-015 / US-054. Player.tsx: HUD ora mostra `title` prop (fallback "Nessun gioco selezionato") al posto di `rom.core`; etichette stato centralizzate in `HUD_STATE_LABELS` (idle/loaded→"Premi Avvia", running→"In esecuzione", paused→"In pausa"); aggiunto `aria-live="polite"` + `aria-atomic="true"` sull'HUD; overlay icona pausa (`⏸`, opacity 0.6, 96px, token `--sd-color-text-primary`, `aria-hidden`) centrato sopra il canvas quando `state==="paused"`. Player.test.tsx esteso con 2 test TSK-103 (HUD title+state+aria-live transitions, fallback idle). 44/44 test Player passano; tsc clean. AC5/AC6 (visual/functional oracle) downstream — TSK lasciato `in-progress` per gate oracle.


## TSK-095 — 2026-06-15 — Fix stale closure handleCapacitorUri FileLoader
fe-dev | develop | EP-014 / US-051. FileLoader.tsx: sostituito pattern `async function handleCapacitorUri` + `useEffect([])` con pattern "latest-ref" (`useRef` + `handlerRef.current` aggiornato ogni render + `useEffect([registerUriHandler])` con wrapper stabile). Eliminato `eslint-disable react-hooks/exhaustive-deps`. FileLoader.test.tsx: aggiunto test di regressione "no stale closure" (rerender con storage/onImported nuovi → handler usa valori freschi, registerCalls===1). 10/10 test FileLoader pass; tsc clean.

## TSK-096 — 2026-06-15 — Fix useMemo deps stale + selectAdapter Error Boundary
fe-dev | develop | EP-014 / US-051. App.tsx: `selectAdapter()` wrappato in try/catch a module-load con fallback UI `StorageInitErrorFallback` (role=alert, data-testid=sb-storage-init-error); deps `useMemo` allineate a `[config]`; export `STORAGE_INIT_ERROR_MESSAGE`. App.test.tsx: nuovo file con test "selectAdapter throw → fallback UI". 429/431 test pass (2 pre-existing failure Settings non correlati); tsc clean.

## TSK-097 — 2026-06-15 — Fix handleFile async try/catch FileLoader
fe-dev | develop | EP-014 / US-051. FileLoader.tsx: wrap try/catch attorno a `readHeader + importRom` in `handleFile`; messaggio canonico "Errore inatteso durante l'importazione — riprovare"; `console.error` gated su `import.meta.env.DEV`. FileLoader.test.tsx: aggiunto test "errore runtime inatteso da importRom mostra messaggio canonico" (mock addRom con TypeError("IDB closed")). 10/10 test FileLoader pass; tsc clean.

## TSK-105 — 2026-06-15 — Aspect-ratio CSS invariante su .sb-screen (idle no-jump)
fe-dev | develop | EP-015 / US-055. Player.tsx: aggiunto `--sb-canvas-aspect: 3 / 2` + `aspect-ratio: var(--sb-canvas-aspect)` nel blocco CSS scoped `.sb-screen` (dopo `position: relative`). useVideoSettings.ts: rimosso `style.aspectRatio = "auto"` per `aspect=stretch` (la CSS fallback garantisce altezza visibile); aggiornato jsdoc. 44/44 test Player pass; tsc clean. AC visual-oracle downstream — TSK in-progress per gate oracle.

[2026-06-15] visual-oracle TSK-103 iter-1 → pass
[2026-06-15] visual-oracle TSK-105 iter-1 → pass
[2026-06-15] review TSK-097 iter-1 → conditional
[2026-06-15] review TSK-095 iter-1 → passed
  - Reviewer: code-reviewer@2.21.0 · Stack: typescript/react 18.x/vite (conf 0.97)
  - Finding: {high:0, medium:0, low:1}, dedup:0 · Report: code_quality/reports/TSK-095-iter-1.json
  - F-095-1-D1 (low, advisory): invariante stabilita' registerUriHandler non documentata in JSDoc del prop (TS-DESIGN-001). Non bloccante.
[2026-06-15] review TSK-105 iter-1 → conditional
  - Reviewer: code-reviewer@2.21.0 · Stack: typescript/react 18.x/css-in-js (conf 0.97)
  - Finding: {high:0, medium:0, low:3}, dedup:0 · Report: code_quality/reports/TSK-105-iter-1.json
  - F-105-01 (low): CSS-DESIGN-001 — --sb-canvas-aspect senza marcatura "token locale" (vs token DS --sd-*).
  - F-105-02 (low): CSS-DESIGN-001 — DEFAULT_SCREEN_ASPECT_RATIO (JS) e --sb-canvas-aspect (CSS) senza cross-reference.
  - F-105-03 (low): CSS-DESIGN-001 — commento UA :fullscreen impreciso (comportamento runtime corretto, visual oracle pass).

[2026-06-15] review TSK-103 iter-1 → conditional
  - Reviewer: code-reviewer@2.21.0 · Stack: typescript/react 18.x (conf 0.97)
  - Findings: {high:1, medium:1, low:1} · Report: code_quality/reports/TSK-103-iter-1.json
  - F-103-01 (high): REACT-IDIOM-001 — bare text node orfano Player.tsx:455 non rimosso dopo introduzione .sb-hud; duplicazione testo di stato in .sb-screen e .sb-hud; test adattati alla duplicazione (findAllByText).
  - F-103-02 (medium): TS-IDIOM-002 — non-null assertion `hud!` in Player.test.tsx senza commento di giustificazione (6 occorrenze).
  - F-103-03 (low): QA-TEST-001 — document.querySelector('.sb-hud') bypassa accessibility tree; raccomandato getByRole con aria-label.

2026-06-15 | code-reviewer | review TSK-096 iter-1 → conditional | packages/app/src/App.tsx + App.test.tsx | 5 findings (medium:2, low:3): F-02 early-return-before-hooks fragile (REACT-IDIOM-001), F-03 non-null cast non giustificato (TS-IDIOM-002), F-04 errore storage non loggato (TS-ROBUST-001), F-01 export comment ambiguo (TS-DESIGN-001), F-05 manca test smoke path nominale (QA-TEST-001). Report: code_quality/reports/TSK-096-iter-1.json

2026-06-15 | code-reviewer | review TSK-097 iter-2 → passed | packages/app/src/components/FileLoader/FileLoader.test.tsx | F-097-01 risolto: asserzione expect(errSpy).toHaveBeenCalledWith aggiunta a riga 205; branch DEV console.error ora esplicitamente verificato. 0 finding aperti. Report: code_quality/reports/TSK-097-iter-2.json

2026-06-15 | code-reviewer | review TSK-105 iter-2 → passed | packages/app/src/components/Player/Player.tsx | Tutti i finding low iter-1 chiusi (F-105-01: token locale --sb-canvas-aspect marcato; F-105-02: cross-reference DEFAULT_SCREEN_ASPECT_RATIO aggiunto; F-105-03: commento fullscreen UA corretto). 0 finding aperti. Report: code_quality/reports/TSK-105-iter-2.json

2026-06-15 | code-reviewer | review TSK-103 iter-2 → passed | packages/app/src/components/Player/Player.tsx + Player.test.tsx | Tutti i finding iter-1 risolti: F-103-01 (high, REACT-IDIOM-001): bare text node orfano rimosso da .sb-screen, test aggiornati a findByText singola occorrenza; F-103-02 (medium, TS-IDIOM-002): risolto per via transitiva, nessun `!` rimasto; F-103-03 (low, QA-TEST-001): aria-label + role=status aggiunti al .sb-hud, test usano screen.getByRole semantico. 0 finding aperti. Report: code_quality/reports/TSK-103-iter-2.json

2026-06-15 | code-reviewer | review TSK-096 iter-2 → passed | packages/app/src/App.tsx + App.test.tsx | 4 finding chiusi (F-02 REACT-IDIOM-001: AppContent/App thin shell refactoring completo; F-03 TS-IDIOM-002: cast eliminato via props typed; F-04 TS-ROBUST-001: console.error aggiunto; F-01 TS-DESIGN-001: commento riformulato). 1 finding low residuo informativo (F-05 QA-TEST-001: test smoke path nominale — delegato qa-dev, non blocca merge). Report: code_quality/reports/TSK-096-iter-2.json

2026-06-15 | code-reviewer | review TSK-106 iter-1 → conditional | packages/app/src/components/Player/Player.tsx + Player.test.tsx | 2 finding low: F-106-01 (CSS-DESIGN-001: --sd-space-sm senza fallback/contratto), F-106-02 (CSS-DESIGN-001: commento CSS TSK-106 eccessivamente lungo). Nessun finding high/medium. Layout CSS Grid, pattern placeholder a11y e 6 test deterministici sono corretti. Report: code_quality/reports/TSK-106-iter-1.json

2026-06-15 | code-reviewer | review TSK-104 iter-1 → conditional | packages/app/src/components/Player/Player.hud.test.tsx | Finding: {high:0, medium:1, low:1}. F-104-01 (medium, QA-TEST-001): assertion tautologica su icona overlay (toBeGreaterThan(0) anziche toHaveTextContent('⏸')). F-104-02 (low, QA-TEST-001): duplicazione test AC2 senza giustificazione. AC1/AC2/AC3 coperti. Report: code_quality/reports/TSK-104-iter-1.json

2026-06-15 | code-reviewer | review TSK-104 iter-2 → pass | packages/app/src/components/Player/Player.hud.test.tsx | F-104-01 (medium) risolto: riga 310 ora `expect(overlay).toHaveTextContent("⏸")`. Nessun nuovo finding. F-104-02 (low) acknowledged, non bloccante. 17/17 test verificati. Report: code_quality/reports/TSK-104-iter-2.json

2026-06-15 | code-reviewer | review TSK-106 iter-2 → pass | packages/app/src/components/Player/Player.tsx | F-106-01 risolto: gap ora `var(--sd-space-sm, 0.5rem)` (riga 427). F-106-02 risolto: commento CSS TSK-106 ridotto da 21 a 6 righe. Nessun nuovo finding. Report: code_quality/reports/TSK-106-iter-2.json

2026-06-15 | code-reviewer | review TSK-100 iter-1 → passed | packages/app/src/components/Player/Player.tsx + packages/app/src/App.tsx + packages/app/src/components/Player/Player.test.tsx | 2 finding low, 0 medium, 0 high: F-100-01 (low, TS-DESIGN-001): commento autoStartFromLibrary ridondante nelle ultime 4 righe (App.tsx:128-143); F-100-02 (low, QA-TEST-001): gap test toggling autoStart true→false per scenario TSK-102. Prop autoStart idiomatica, anti-loop ref-identity corretto, deps array complete, separazione App/Player pulita. Report: code_quality/reports/TSK-100-iter-1.json
