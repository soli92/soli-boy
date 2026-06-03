---
id: architecture-overview
title: Architecture Overview — Core web MVP (EP-001 + EP-003) + desktop (EP-006)
status: draft
created: 2026-06-01
updated: 2026-06-03
scope: [EP-001, EP-003, EP-006]
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

> **Selezione engine — multi-motore registry** ([[ADR-005]], rivede ADR-004): un
> `selectEngine(core)` mappa il core risolto all'adapter `EmulatorEngine` per piattaforma:
> `WasmBoyEngine` (GB/GBC, npm ESM), `MgbaEngine` (GBA, mGBA wasm — da validare),
> `StubEngine` (test/e2e deterministici). **Arcade (FBNeo/MAME) non coperto** da lib ESM
> standalone → libretro umbrella o rinvio (decisione aperta, ADR-005). `EmulatorJsEngine`
> deprecato (gap emulatorjs-real-integration: core non caricabile in self-host).
> Input: per-lib (WasmBoy: responsive-gamepad/Gamepad API), `InputMapping` per touch.

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

## Feature post-MVP (design)

### EP-004 — Salvataggi
Vedi [[ADR-006]]: `EmulatorEngine` esteso (snapshot/restore + SRAM), `StoragePort` esteso
(saveStates/sram), `SaveService` (dominio), UI Player (slot) + Settings (export/import).

### EP-005 — Resa video (UI-centrica, no ADR)
- **Schermo intero** (US-020): Fullscreen API sul contenitore del Player.
- **Scala / aspect ratio** (US-021): CSS sul `<canvas>` (object-fit/aspect-ratio, fattori 1x–5x); preferenza persistita in `config` store.
- **Filtri** (US-022): `image-rendering: pixelated` (nearest) vs smoothing; overlay scanline via CSS; preferenza in `config`.
- Engine-agnostico: agisce sul canvas reso dall'adapter; nessuna modifica a `EmulatorEngine`.

### EP-002 — Libreria avanzata (UI-centrica, no ADR)
- **Ricerca/filtro** (US-008): la `StoragePort.listRoms(filter)` già supporta `platform`/`query`
  ([[storage-port]]); aggiungere la UI in `Library` (campo ricerca + filtro piattaforma).
- **Copertina** (US-009): `coverBlob` già nello schema `roms` ([[indexeddb-stores]]); UI per
  associare/mostrare la cover (segnaposto se assente). Fonte cover: caricata dall'utente (no fetch esterni).

### EP-006 — Distribuzione desktop
Vedi [[ADR-007]] (packaging) e [[ADR-008]] (auto-update).

- **Contenitore**: Electron — vincolo `raw/tech_stack.md` ("Shell desktop: Electron"), già fissato in [[ADR-001]]. La SPA esistente (`packages/app/`) è riusata 1:1 come renderer; nessuna modifica al bundler Vite.
- **Layout monorepo**: nuovo workspace `packages/desktop/` con `electron/main.ts` (window + IPC server), `electron/preload.ts` (bridge sicuro `contextIsolation: true`), `electron-builder.yml` (config packaging), `electron/updater.ts` (modulo `electron-updater`).
- **Toolchain di packaging** ([[ADR-007]]): **electron-builder** → NSIS (Win), DMG+zip (macOS x64+arm64), AppImage+deb (Linux x64). App id `com.soli92.soliboy`. Publish provider `github` (Releases del repo `soli92/soli-boy`).
- **Filesystem nativo (US-023)**: `NativeFsAdapter` (già previsto da [[ADR-002]]) implementato come client IPC verso il main process, che usa `electron`'s `dialog` + `fs/promises` per aprire/salvare ROM, save state, SRAM, config sul filesystem nativo. Il dominio resta agnostico (la `StoragePort` non cambia).
- **Core offline (US-024)**: i core WASM (`wasmboy`, `@thenick775/mgba-wasm`) sono dipendenze npm già bundleate nel `dist/` Vite via import ESM ([[ADR-005]]) → inclusi automaticamente nell'installer Electron senza configurazione speciale. Nessuna richiesta di rete necessaria per emulare.
- **Cross-Origin Isolation in Electron**: i core WASM threaded richiedono COOP/COEP anche in Electron (oltre che sul web, dove sono già configurati su Vercel via `packages/app/vercel.json`). Approccio scelto: **custom protocol `app://`** registrato nel main process con header COOP `same-origin` + COEP `require-corp`; alternativa equivalente `session.webRequest.onHeadersReceived`. Decisione di dettaglio a livello TSK-053.
- **Auto-update (US-025)** ([[ADR-008]]): **electron-updater** + GitHub Releases come canale di distribuzione. Eventi `update-available` / `download-progress` / `update-downloaded` / `error` inoltrati via IPC al renderer e mostrati in-app con componenti solids (toast/banner + bottone "Riavvia e installa"). Check automatico all'avvio + periodico + manuale via menu. Verifica SHA-512 dei pacchetti built-in. Limite documentato: pacchetti Linux **deb** non auto-updatable (richiedono `apt`) → AppImage è il formato Linux primary, deb è secondary con notifica manual-update.
- **Trigger di release**: tag `v*` rilascia contemporaneamente web (Vercel, gap chiuso `vercel-deploy-trigger-policy`) e desktop (job CI matrix Win/macOS/Linux che pubblica su GitHub Releases). Un'unica operazione owner.
- **Code signing** (prerequisito human, R.14, NON bloccante per il primo release unsigned): macOS = account Apple Developer + Developer ID + notarization; Windows = certificato Code Signing OV/EV; Linux = opzionale GPG su AppImage/deb. I flag di signing si attivano automaticamente in electron-builder quando i segreti CI sono presenti, senza modifiche architetturali.
- **Invariante privacy**: i dati utente (ROM/save/SRAM/config) vivono sotto `app.getPath('userData')`, separati dal bundle applicativo → l'auto-update tocca solo il binario, MAI i dati utente (US-033, [[ADR-002]]).
