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
