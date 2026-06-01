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
