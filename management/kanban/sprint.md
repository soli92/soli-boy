<!-- generated, do not edit -->
# Sprint board — soli-boy

View aggregata generata dal `tpm`. Scope: Core web MVP (EP-001 + EP-003) +
emulazione reale (EP-003 ADR-004/005) + post-MVP backlog (EP-002/004/005) +
identità di brand (EP-010) + CI/CD (EP-011) + desktop (EP-006) + mobile (EP-007) +
conformità store (EP-008).

---

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

TSK-040 blocked su Q_001 (pacchetto @soli92/solids non consumabile: npm 404, github senza dist).

DAG: EP-004 catena (030→031→{032,033}→034); EP-005 e EP-002 in parallelo (UI indipendenti).
ADR-006 (salvataggi). EP-005/EP-002 design in architecture-overview.


## Sprint 6 — Brand identity + CI/CD (EP-010 / EP-011) — 11/11 TSK done

| TSK | Titolo | EP | layer | consumer | prio | est | status | US | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|----|-----------|
| TSK-042 | Copia brand asset in packages/app/public | EP-010 | fe | agent | P1 | S | done | US-037 | — |
| TSK-049 | Workflow CI GitHub Actions: ci.yml | EP-011 | fe | agent | P0 | M | done | US-040 | — |
| TSK-044 | ThemeSelector + persistenza data-theme | EP-010 | fe | agent | P1 | M | done | US-036 | — |
| TSK-043 | Favicon e link tag in index.html | EP-010 | fe | agent | P1 | S | done | US-037 | TSK-042 |
| TSK-047 | Unit test ThemeSelector + useTheme | EP-010 | qa | agent | P1 | S | done | US-036 | TSK-044 |
| TSK-050 | Branch protection main: gate CI | EP-011 | fe | human | P0 | S | done | US-041 | TSK-049 |
| TSK-051 | Workflow CD Vercel: cd-vercel.yml | EP-011 | fe | agent | P1 | M | done | US-042 | TSK-049 |
| TSK-052 | Cache Playwright + artefatti e2e | EP-011 | qa | agent | P1 | S | done | US-043 | TSK-049 |
| TSK-045 | Web app manifest (manifest.webmanifest) | EP-010 | fe | agent | P2 | S | done | US-038 | TSK-042,043 |
| TSK-046 | Logo Soli-boy nell'header Library | EP-010 | fe | agent | P2 | S | done | US-039 | TSK-042 |
| TSK-048 | E2e smoke test brand (favicon/manifest/logo) | EP-010 | qa | agent | P2 | S | done | US-037/038/039 | TSK-043,045,046 |

Nota TSK-050: `consumer: human` (branch protection = gate umano R.14/R.15).


## Sprint 7 — Distribuzione desktop (EP-006) — 3/6 done · 1 todo · 2 bloccati

> Wave A completata (TSK-053, TSK-054, TSK-055 done). TSK-058 in coda (dipende da tutti e tre).
> Wave B: TSK-056, TSK-057 bloccati su gap L4 non risolti dal lead-architect
> (`electron-packaging-toolchain`, `electron-autoupdate-mechanism`).

### Wave A — Dominio

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-053 | Electron main.ts + IPC filesystem bridge | US-023 | infra | human | P0 | L | done | — |
| TSK-054 | NativeFsAdapter (StoragePort su IPC Electron) | US-023 | be | agent | P0 | L | done | TSK-053 |
| TSK-055 | Selezione runtime adapter (IDB vs NativeFs) | US-023 | be | agent | P0 | S | done | TSK-054 |
| TSK-058 | e2e: carica ROM + salva (IPC mock, Electron) | US-023 | qa | agent | P1 | M | todo | TSK-054,055 |

### Wave B — Infra (bloccata su gap packaging — gate umano lead-architect)

| TSK | Titolo | US | layer | consumer | prio | est | status | blocked_by | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|------------|-----------|
| TSK-056 | Bundling core WASM offline (Electron) | US-024 | infra | human | P1 | M | todo | GAP-electron-packaging-toolchain | TSK-053 |
| TSK-057 | Auto-update Electron (rileva + applica) | US-025 | infra | human | P2 | M | todo | GAP-electron-packaging-toolchain, GAP-electron-autoupdate-mechanism | TSK-053,056 |

DAG Sprint 7:
- TSK-053 done → TSK-054 done → TSK-055 done → TSK-058 (todo)
- Wave B (human, dopo chiusura gap): TSK-056 → TSK-057


## Sprint 8 — Esperienza mobile (EP-007)

> **NOTE DESIGN:**
> - Capacitor (ADR-001) e plugin nativi sono specificati in L4: tutti i task sono taskizzabili.
> - TSK-059 (Capacitor init) è `consumer: human` per il requisito di Android Studio/Xcode/device.
> - TSK-060–TSK-067 (agent) dipendono da TSK-059 ma possono essere sviluppati con
>   emulazione browser (Playwright device emulation) e promossi su device reale.

### Wave A — Prerequisito (gate umano)

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-059 | Capacitor init: progetto Android + iOS + plugin | US-026 | infra | human | P0 | M | in-progress | — |

### Wave B — Core mobile (parallelo, dopo TSK-059)

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-060 | TouchOverlay: D-pad + pulsanti virtuali | US-026 | fe | agent | P0 | L | todo | TSK-059 |
| TSK-063 | File picker mobile (Capacitor Filesystem) | US-029 | fe | agent | P0 | M | todo | TSK-059 |
| TSK-065 | Sospensione/ripresa (Capacitor App plugin) | US-031 | be | agent | P0 | S | todo | TSK-059 |

### Wave C — Funzionalità avanzate (dopo Wave B)

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-061 | TouchOverlay config (posizione/size/opacità) | US-027 | fe | agent | P1 | M | todo | TSK-060 |
| TSK-062 | Bluetooth controller + auto-hide overlay | US-028 | be | agent | P1 | M | todo | TSK-060 |
| TSK-064 | Layout responsivo + safe areas (CSS env()) | US-030 | fe | agent | P0 | M | todo | TSK-060 |
| TSK-066 | Feedback aptico (Capacitor Haptics) | US-032 | fe | agent | P2 | S | todo | TSK-060 |

### Wave D — QA e2e mobile (dopo Wave C)

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-067 | e2e mobile smoke: TouchOverlay + sospensione | US-026 | qa | agent | P1 | M | todo | TSK-060,064,065 |

DAG Sprint 8:
- Wave A (human): TSK-059 (in-progress)
- Wave B (agent, parallelo dopo TSK-059): TSK-060 ‖ TSK-063 ‖ TSK-065
- Wave C (agent, dopo Wave B): TSK-061, TSK-062, TSK-064, TSK-066 → dopo TSK-060
- Wave D (agent, dopo Wave C): TSK-067 → dopo TSK-060,064,065

Parallelismo max scheduler = 4: Wave B spawna 3 agent in parallelo (entro il limite).
Wave C spawna 4 task — il scheduler li dispatcha per dipendenza soddisfatta.


## Sprint 9 — Conformità e pubblicazione store (EP-008) + Storage desktop avanzato (EP-006) + Visual Oracle / CI (EP-011) — 8/11 done · 2 todo · 1 in-progress

> **NOTE DESIGN:**
> - Privacy on-device (ADR-002, StoragePort invariant) è completamente specced → TSK-068,069 agent.
> - Avviso legale in-app → TSK-070 agent (pattern da US-006 esistente).
> - Store metadata e iOS benchmark → gate umano (account developer, device fisico).
> - TSK-073: Visual Oracle v2.17 — render harness per copertura dark (done).
> - TSK-074–TSK-077: estensioni IPC filesystem Electron + allineamento spec storage-port (tutti done).
> - TSK-078: fix jsdom ERR_REQUIRE_ESM (qa, P1, todo).

### Wave A — Privacy e conformità (parallelo)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-068 | Privacy audit: on-device su web/desktop/mobile | US-033 | EP-008 | qa | agent | P0 | M | todo | TSK-054,055 |
| TSK-069 | Privacy policy in-app (comunicazione utente) | US-033 | EP-008 | fe | agent | P1 | S | done | — |

### Wave B — Avviso legale e store asset (dopo Wave A)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-070 | Avviso legale in-app: no ROM protette | US-034 | EP-008 | fe | agent | P1 | S | done | TSK-069 |
| TSK-072 | Benchmark iOS: WASM su device reale + report | US-035 | EP-008 | qa | human | P0 | L | todo | TSK-059,060 |

### Wave C — Store submission (gate umano, dopo Wave B)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-071 | Store metadata package (asset + checklist) | US-034 | EP-008 | infra | human | P2 | M | todo | TSK-059,070 |

### Wave D — Storage desktop avanzato (EP-006, US-023)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-074 | Estendi bridge IPC: unlink/mkdir/readdir/stat + delete reale | US-023 | EP-006 | be | agent | P1 | M | done | TSK-053,054 |
| TSK-075 | listRoms lazy: evitare materializzazione eager dei blob | US-023 | EP-006 | be | agent | P2 | S | done | TSK-054 |
| TSK-076 | Allineare storage-port.md: exportSave/importSave marcati planned | US-023 | EP-006 | design | agent | P3 | XS | done | — |
| TSK-077 | Bridge IPC fs:getBaseDir: risoluzione path assoluto ~/.soli-boy | US-023 | EP-006 | be | agent | P2 | S | done | TSK-074,055 |

### Wave E — Visual Oracle harness + CI fix (EP-011, US-043)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-073 | Visual oracle render harness: pilotaggio tema per copertura dark | US-043 | EP-011 | qa | agent | P2 | S | done | — |
| TSK-078 | Fix env test jsdom: html-encoding-sniffer ERR_REQUIRE_ESM | US-043 | EP-011 | qa | agent | P1 | S | todo | — |

DAG Sprint 9:
- Wave A (parallelo): TSK-068 ‖ TSK-069 (done)
- Wave B: TSK-070 (done) → TSK-069; TSK-072 → TSK-059,060 (human)
- Wave C: TSK-071 → TSK-059,070 (human)
- Wave D (indipendente, EP-006): TSK-074 (done) → TSK-075 (done); TSK-076 (done); TSK-077 (done) → TSK-074
- Wave E (parallelo, EP-011): TSK-073 (done) ‖ TSK-078 (todo, P1)


## Lookahead — Sprint 10+ (post-Sprint 9)

| Area | Note |
|------|------|
| EP-009 — Arcade (FBNeo/MAME) | Gap aperto `arcade-emulation-engine`; percorso libretro da valutare |
| EP-006 — Build Electron distribuibile (Win/macOS/Linux) | Dopo chiusura gap `electron-packaging-toolchain` |
| EP-006 — Auto-update produzione | Dopo chiusura gap `electron-autoupdate-mechanism` |
| EP-007 — Validazione su device Android fisico | Human, dopo TSK-059 |
| EP-008 — Submission Google Play e App Store | Human, dopo TSK-071 e TSK-072 |
| EP-006/US-023 — e2e Electron (TSK-058) | Può partire ora che TSK-054 e TSK-055 sono done |


## Note generali

- **Core web MVP completo** (20/20 done). 49 test verdi, typecheck OK.
- **TSK-041 done** (bugfix canvas WasmBoy loadState — 8/8 e2e verdi).
- Sprint 6 — 11/11 task done (EP-010 + EP-011). Tutti completati.
- Sprint 7 — 6 task EP-006: TSK-053/054/055 done (Wave A quasi completa), TSK-058 todo (agent, sbloccato),
  2 human bloccati su `GAP-electron-packaging-toolchain` e `GAP-electron-autoupdate-mechanism`.
- Sprint 8 — 9 task EP-007: TSK-059 in-progress (human, gate device/Xcode), 7 agent todo, 1 qa agent todo.
- Sprint 9 — 11 task: 8 done (TSK-069/070/073/074/075/076/077 done + TSK-073 done),
  2 todo (TSK-068, TSK-078), 1 todo human (TSK-072), 1 todo human (TSK-071).
  TSK-078 nuovo (qa agent, US-043, P1 — fix jsdom ERR_REQUIRE_ESM).
- **Factory upgrade v2.17 (FE Visual Oracle)**: campo `visual_status` attivo su TSK-069.
- **Consumer distribution (Sprint 7-9):** agent=19, human=6.
- Gap da chiudere con lead-architect prima dello Sprint 7 Wave B:
  `electron-packaging-toolchain`, `electron-autoupdate-mechanism` (vedi `wiki/gaps.md`).
- TSK-058 (e2e Electron) ora sbloccato: TSK-054 e TSK-055 sono done.
