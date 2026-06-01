<!-- generated, do not edit -->
# Sprint board — soli-boy

View aggregata generata dal `tpm`. Scope: Core web MVP (EP-001 + EP-003).

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

| TSK | Titolo | EP | layer | prio | status | depends_on |
|-----|--------|----|-------|------|--------|-----------|
| TSK-030 | EmulatorEngine snapshot/restore + SRAM | EP-004 | be | P0 | todo | — |
| TSK-031 | StoragePort saveStates/sram + SaveService | EP-004 | be | P0 | todo | TSK-030 |
| TSK-032 | Player: pannello save state (slot) | EP-004 | fe | P1 | todo | TSK-031 |
| TSK-033 | Export/Import salvataggi (Settings) | EP-004 | fe | P2 | todo | TSK-031 |
| TSK-034 | e2e save/load state (GB reale) | EP-004 | qa | P1 | todo | TSK-030,032 |
| TSK-035 | Schermo intero (Fullscreen API) | EP-005 | fe | P1 | todo | — |
| TSK-036 | Scala + aspect ratio (persistiti) | EP-005 | fe | P2 | todo | — |
| TSK-037 | Filtri base (nearest/scanline) | EP-005 | fe | P2 | todo | — |
| TSK-038 | Ricerca + filtro piattaforma (Library) | EP-002 | fe | P1 | todo | — |
| TSK-039 | Copertina gioco (upload/display) | EP-002 | fe | P2 | todo | TSK-038 |
| TSK-040 | Integrare @soli92/solids reale | (cross) | fe | P2 | blocked | Q_001 |

⛔ TSK-040 blocked su Q_001 (pacchetto @soli92/solids non consumabile: npm 404, github senza dist).

DAG: EP-004 catena (030→031→{032,033}→034); EP-005 e EP-002 in parallelo (UI indipendenti).
ADR-006 (salvataggi). EP-005/EP-002 design in architecture-overview.

## Note

- **Core web MVP completo a livello TSK** (20/20 done). 49 test verdi, typecheck OK.
- Review: 19/20 passed (TSK-010 = qa closure, deliverable in TSK-004).
- e2e (TSK-011/019): integrazione a livello modulo; browser-e2e reale tracciato in
  `wiki/gaps.md` (e2e-browser-runtime), follow-up con Playwright + EmulatorJS.
- Backlog post-MVP: EP-002 (ricerca/filtro completi US-008/009 oltre la griglia),
  EP-004 save state/SRAM/export, EP-005 resa video, EP-006 desktop, EP-007/008 mobile.
