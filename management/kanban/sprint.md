<!-- generated, do not edit -->
# Sprint board — soli-boy

View aggregata generata dal `tpm`. Scope: Core web MVP (EP-001 + EP-003) +
emulazione reale (EP-003 ADR-004/005) + post-MVP backlog (EP-002/004/005) +
identità di brand (EP-010) + CI/CD (EP-011).

## Stato: Core web MVP — 20/20 TSK done · 19/20 review passed

| TSK | Titolo | layer | status | review |
|-----|--------|-------|--------|--------|
| TSK-001 | IndexedDB adapter + store `roms` | db | done | passed |
| TSK-002 | StoragePort + dominio persistenza ROM | be | done | passed |
| TSK-003 | FileLoader: picker + drag & drop | fe | done | passed |
| TSK-004 | PlatformRecognition | be | done | passed |
| TSK-005 | Gestione BIOS | be | done | passed |
| TSK-006 | Avviso legale no-copyright | fe | done | passed |
| TSK-007 | CoreWrapper: resolveCore + load/start | be | done | passed |
| TSK-008 | Player: viewport + mount | fe | done | passed |
| TSK-009 | CoreWrapper: audio (volume/mute) | be | done | passed |
| TSK-010 | Test unit: PlatformRecognition | qa | done | — |
| TSK-011 | Integrazione: carica→avvia→audio | qa | done | passed |
| TSK-012 | Library: griglia ROM persistite | fe | done | passed |
| TSK-013 | LibraryService: list + remove | be | done | passed |
| TSK-014 | Player controls: pausa/ripresa/arresto | fe | done | passed |
| TSK-015 | CoreWrapper: pause/resume/stop | be | done | passed |
| TSK-016 | InputMapping: tastiera + Gamepad API | be | done | passed |
| TSK-017 | Settings: rimappatura comandi + profili | fe | done | passed |
| TSK-018 | CoreWrapper: fast-forward + rewind | be | done | passed |
| TSK-019 | Integrazione: pausa/ripresa + input | qa | done | passed |
| TSK-020 | Dropzone FileLoader a11y | fe | done | passed |


## Sprint 3 — "Emulazione reale" (ADR-004, post-MVP)

| TSK | Titolo | layer | consumer | prio | est | status | depends_on |
|-----|--------|-------|----------|------|-----|--------|-----------|
| TSK-021 | EmulatorJsEngine: adapter reale | be | agent | P0 | L | todo | — |
| TSK-022 | Player mount DOM + selezione engine | fe | agent | P0 | M | todo | TSK-021 |
| TSK-023 | Hosting core + COOP/COEP | infra | human | P1 | M | todo | TSK-021 |
| TSK-024 | e2e ROM homebrew reale (chiude gap) | qa | agent | P1 | M | todo | TSK-021,022,023 |


## Sprint 4 — "Emulazione reale multi-engine" (ADR-005)

| TSK | Titolo | layer | consumer | prio | status | depends_on |
|-----|--------|-------|----------|------|--------|-----------|
| TSK-025 | WasmBoyEngine (GB/GBC) + engine registry | be | agent | P0 | todo | — |
| TSK-027 | e2e reale GB (WasmBoy + dmg-acid2) | qa | agent | P0 | todo | TSK-025 |
| TSK-028 | MgbaEngine (GBA) — spike + adapter | be | agent | P1 | todo | TSK-025 |
| TSK-029 | Deprecare/rimuovere EmulatorJsEngine | be | agent | P2 | todo | TSK-025,027 |

Arcade (FBNeo/MAME): **rinviato** a epica dedicata (EP-009) — nessun ESM standalone;
il registry instrada l'arcade a "non ancora supportato". Vedi gap arcade-emulation-engine.


## Sprint 5 — Backlog post-MVP (EP-004 / EP-005 / EP-002)

| TSK | Titolo | EP | layer | consumer | prio | status | depends_on |
|-----|--------|----|-------|----------|------|--------|-----------|
| TSK-030 | EmulatorEngine snapshot/restore + SRAM | EP-004 | be | agent | P0 | todo | — |
| TSK-031 | StoragePort saveStates/sram + SaveService | EP-004 | be | agent | P0 | todo | TSK-030 |
| TSK-032 | Player: pannello save state (slot) | EP-004 | fe | agent | P1 | todo | TSK-031 |
| TSK-033 | Export/Import salvataggi (Settings) | EP-004 | fe | agent | P2 | todo | TSK-031 |
| TSK-034 | e2e save/load state (GB reale) | EP-004 | qa | agent | P1 | todo | TSK-030,032 |
| TSK-035 | Schermo intero (Fullscreen API) | EP-005 | fe | agent | P1 | todo | — |
| TSK-036 | Scala + aspect ratio (persistiti) | EP-005 | fe | agent | P2 | todo | — |
| TSK-037 | Filtri base (nearest/scanline) | EP-005 | fe | agent | P2 | todo | — |
| TSK-038 | Ricerca + filtro piattaforma (Library) | EP-002 | fe | agent | P1 | todo | — |
| TSK-039 | Copertina gioco (upload/display) | EP-002 | fe | agent | P2 | todo | TSK-038 |
| TSK-040 | Integrare @soli92/solids reale | (cross) | fe | agent | P2 | blocked | Q_001 |
| TSK-041 | Bugfix canvas WasmBoy loadState | EP-004 | fe | agent | P1 | done | TSK-032,034 |

⛔ TSK-040 blocked su Q_001 (pacchetto @soli92/solids non consumabile: npm 404, github senza dist).

DAG: EP-004 catena (030→031→{032,033}→034); EP-005 e EP-002 in parallelo (UI indipendenti).
ADR-006 (salvataggi). EP-005/EP-002 design in architecture-overview.


## Sprint 6 — Brand identity + CI/CD (EP-010 / EP-011)

### Wave A — Prerequisiti (parallelo, nessuna dipendenza)

| TSK | Titolo | EP | layer | consumer | prio | est | status | US | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|----|-----------|
| TSK-042 | Copia brand asset in packages/app/public | EP-010 | fe | agent | P1 | S | todo | US-037 | — |
| TSK-049 | Workflow CI GitHub Actions: ci.yml | EP-011 | fe | agent | P0 | M | todo | US-040 | — |
| TSK-044 | ThemeSelector + persistenza data-theme | EP-010 | fe | agent | P1 | M | todo | US-036 | — |

### Wave B — Brand assets HTML + CD (dipendono da Wave A)

| TSK | Titolo | EP | layer | consumer | prio | est | status | US | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|----|-----------|
| TSK-043 | Favicon e link tag in index.html | EP-010 | fe | agent | P1 | S | todo | US-037 | TSK-042 |
| TSK-047 | Unit test ThemeSelector + useTheme | EP-010 | qa | agent | P1 | S | todo | US-036 | TSK-044 |
| TSK-050 | Branch protection main: gate CI | EP-011 | fe | human | P0 | S | todo | US-041 | TSK-049 |
| TSK-051 | Workflow CD Vercel: cd-vercel.yml | EP-011 | fe | agent | P1 | M | todo | US-042 | TSK-049 |
| TSK-052 | Cache Playwright + artefatti e2e | EP-011 | qa | agent | P1 | S | todo | US-043 | TSK-049 |

### Wave C — Manifest + logo + smoke test e2e brand (dipendono da Wave B)

| TSK | Titolo | EP | layer | consumer | prio | est | status | US | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|----|-----------|
| TSK-045 | Web app manifest (manifest.webmanifest) | EP-010 | fe | agent | P2 | S | todo | US-038 | TSK-042,043 |
| TSK-046 | Logo Soli-boy nell'header Library | EP-010 | fe | agent | P2 | S | todo | US-039 | TSK-042 |
| TSK-048 | E2e smoke test brand (favicon/manifest/logo) | EP-010 | qa | agent | P2 | S | todo | US-037/038/039 | TSK-043,045,046 |

DAG Sprint 6:
- Wave A (parallelo): TSK-042 ‖ TSK-049 ‖ TSK-044
- Wave B (dopo Wave A): TSK-043, TSK-047, TSK-050, TSK-051, TSK-052
  (TSK-043 → TSK-042; TSK-047 → TSK-044; TSK-050/051/052 → TSK-049)
- Wave C (dopo Wave B): TSK-045, TSK-046 → TSK-042; TSK-048 → TSK-043+045+046

Parallelismo max scheduler = 4 (factory.config.yaml §scheduler): Wave A spawna 3
agent in parallelo (entro il limite). Wave B spawna 5 task ma con dipendenze
differenziate — il scheduler li dispatcha appena la dipendenza è soddisfatta.

Nota TSK-050: `consumer: human` (branch protection = gate umano R.14/R.15).
Il task è incluso nel DAG per visibilità ma non viene eseguito da un agent.

## Lookahead — Sprint 7 (post-Sprint 6)

| TSK (da pianificare) | Ambito | Note |
|----------------------|--------|------|
| EP-006 distribuzione desktop | Electron wrapper | Dipende da MVP stabile |
| EP-007 esperienza mobile | Touch controls | Alta complessità, confidence 60% |
| EP-008 conformità store | iOS/Android | Dipende da EP-007 |
| EP-009 arcade (FBNeo) | Emulazione arcade | Gap aperto, rinviato |

## Note

- **Core web MVP completo a livello TSK** (20/20 done). 49 test verdi, typecheck OK.
- **TSK-041 done** (bugfix canvas WasmBoy loadState — 8/8 e2e verdi).
- Review: 19/20 passed (TSK-010 = qa closure, deliverable in TSK-004).
- TSK-040 bloccato su Q_001 (DS reale — pacchetto non consumabile via npm).
  Nota: EP-010 TSK-044 beneficia del DS installato (v1.14.1 già in package.json).
- Sprint 6 introduce EP-010 + EP-011: 11 task, di cui 9 agent e 1 human (TSK-050).
