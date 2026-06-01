---
id: architecture-overview
title: Architecture Overview — Core web MVP (EP-001 + EP-003)
status: draft
created: 2026-06-01
updated: 2026-06-01
scope: [EP-001, EP-003]
---

# Architecture Overview — Core web MVP

Disegno dell'architettura del nucleo condiviso (caricamento + esecuzione), su stack
`raw/tech_stack.md`. Decisioni in [[ADR-001]], [[ADR-002]], [[ADR-003]].

## Moduli (struttura del progetto)

| Modulo | Responsabilità | Livello |
|---|---|---|
| `src/components/` | UI: FileLoader, Library, Player, Settings (su solids) | Presentazione |
| `src/domain/` | Riconoscimento piattaforma, sessione di gioco, mapping comandi | Dominio |
| `src/core/` | `CoreWrapper` (lifecycle/audio/input/speed) + `EmulatorEngine` adapter: `StubEngine` (test/app) e `EmulatorJsEngine` (reale, [[ADR-004]]) ([[core-wrapper]]) | Emulazione |
| `src/storage/` | `StoragePort` + adapter IndexedDB/native ([[storage-port]], [[indexeddb-stores]]) | Persistenza |
| `src/theme/` | Token e tema del design system solids | Presentazione |

> **Selezione engine** (ADR-004): l'app inietta un `EmulatorEngine`. `StubEngine` è
> deterministico (unit + e2e, nessun WASM); `EmulatorJsEngine` è l'integrazione reale
> (loader EmulatorJS lazy, core da CDN su web / self-host su desktop+mobile, COOP/COEP
> per i core threaded — vedi [[emulatorjs-hosting]]). Input: nativo EJS per
> tastiera/gamepad, `InputMapping` solo per i controlli touch.

## Servizi di dominio (BE logico, TypeScript)

- **PlatformRecognition** — determina piattaforma e core dal file caricato (estensione + contenuto). Copre US-002. [^src: management/kanban/EP-001-gestione-file-di-gioco/US-002-riconoscimento-piattaforma/US-002.md §Acceptance Criteria]
- **GameSession** — orchestrazione del ciclo di vita di una partita (load → start → pause/resume → stop), coordina `CoreWrapper` e `StoragePort`. Copre US-010, US-011, US-016, US-017. [^src: management/kanban/EP-003-esecuzione-e-controlli/US-011-pausa-ripresa-arresto/US-011.md §Acceptance Criteria]
- **InputMapping** — profili comandi e rimappatura tastiera/gamepad/touch. Copre US-012, US-013. [^src: management/kanban/EP-003-esecuzione-e-controlli/US-013-rimappatura-comandi/US-013.md §Business Rules]
- **LibraryService** — gestione della collezione (aggiunta, rimozione, ricerca/filtro) sopra `StoragePort`. Copre US-004, US-005, US-007, US-008. [^src: management/kanban/EP-001-gestione-file-di-gioco/US-004-persistenza-libreria/US-004.md §Acceptance Criteria]

## Moduli UI (FE, React + solids)

- **FileLoader** — selettore file + drag & drop, caricamento ROM/BIOS, avviso legale. Copre US-001, US-003, US-006. [^src: management/kanban/EP-001-gestione-file-di-gioco/US-001-caricare-rom/US-001.md §Acceptance Criteria] Riferimento visivo: [[schermata-library]] (header + azione "Carica ROM").
- **Library** — griglia con titolo/piattaforma, ricerca/filtro, copertina. Copre US-007, US-008, US-009. [^src: management/kanban/EP-002-libreria-di-gioco/US-007-griglia-libreria/US-007.md §Acceptance Criteria] Riferimento visivo: [[schermata-library]].
- **Player** — viewport di gioco, controlli esecuzione/audio/velocità, schermo intero. Copre US-011, US-014, US-015, US-020. [^src: management/kanban/EP-003-esecuzione-e-controlli/US-015-controllo-audio/US-015.md §Acceptance Criteria] Riferimento visivo: [[schermata-player]].
- **Settings** — profili comandi, scala/aspect, filtri. Copre US-013, US-021, US-022. [^src: management/kanban/EP-003-esecuzione-e-controlli/US-013-rimappatura-comandi/US-013.md §Acceptance Criteria] Riferimento visivo: [[schermata-settings]].

Tutti i moduli UI usano esclusivamente componenti e token del design system solids (vincolo `raw/tech_stack.md`); il riferimento visivo strutturale è nei mockup SoliDS ([[2026-06-01-mockups-ui]]), con la nota reale-vs-mockup in [[temi-e-design-token-solids]].

## Flusso di riferimento (caricamento → esecuzione)

1. **FileLoader** riceve un file (US-001) → **PlatformRecognition** determina piattaforma/core (US-002).
2. **LibraryService** persiste la ROM via **StoragePort** e la mostra in **Library** (US-004, US-007).
3. Alla selezione, **GameSession** invoca **CoreWrapper.load/start** con il core corretto (US-010).
4. **InputMapping** instrada tastiera/gamepad verso il core (US-012); **Player** espone pausa/audio/velocità (US-011, US-014, US-015).
5. Save state e SRAM sono persistiti via **StoragePort** e ripristinabili (US-016, US-017).

## Componenti per layer di routing (factory.config)

- **be** (dominio TS): PlatformRecognition, GameSession, InputMapping, LibraryService.
- **fe** (React/solids): FileLoader, Library, Player, Settings.
- **db** (persistenza): schema IndexedDB ([[indexeddb-stores]]).
- **qa**: criteri di accettazione delle US come base dei test.
