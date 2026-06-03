---
id: log
type: log
title: Wiki Log
status: draft
created: 2026-06-01
updated: 2026-06-01
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
