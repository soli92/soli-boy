<!-- generated, do not edit -->
# Sprint board — soli-boy

View aggregata generata dal `tpm`. Generata: 2026-07-03. Scope: Core web MVP (EP-001 + EP-003) +
emulazione reale (EP-003 ADR-004/005) + post-MVP backlog (EP-002/004/005) +
identità di brand (EP-010) + CI/CD (EP-011) + desktop (EP-006) + mobile (EP-007) +
conformità store (EP-008) + **remediation a11y & UX/UI (EP-012, Sprint 10)** +
**fix color-contrast WCAG AA (EP-012/US-049, Sprint 10)** +
**Design Intelligence UX (EP-013, Sprint 11)** +
**robustezza codice (EP-014, Sprint 12)** + **UX Player flusso principale (EP-015, Sprint 12)** +
**UX Library/Settings/componenti (EP-016, Sprint 13)** + **a11y manual checks remediation (EP-017, Sprint 13)** +
**controlli shoulder L/R (EP-018, Sprint 14)** +
**orologio interno RTC (EP-019, Sprint 15)** +
**bridge RTC reale GBC+GBA (EP-019 follow-up, Sprint 16)** +
**graphic refactoring Solids migration (EP-020, Sprint 17–18)** +
**visual fidelity prototipo (EP-021, Sprint 19)** +
**release desktop unsigned (EP-006, Sprint 19)** +
**mobile-first responsive & fidelity overhaul (EP-022, Sprint 20)**.

**Stato globale (2026-07-03): 161/163 TSK done · 1 in-progress (TSK-059, human) · 1 todo (TSK-072, human) · 12 todo Sprint 20 (EP-022, TSK-165..176)**

---

## Sprint 20 — Mobile-first Responsive & Visual Fidelity Overhaul (EP-022) — 0/12 todo

> **Obiettivo:** Portare la produzione in parità visiva col prototipo EP-020 su tutti e quattro
> i viewport (mobile portrait, mobile landscape, tablet, desktop), sanare il bug bloccante P0
> mobile portrait (navbar overlay che nasconde il tab Play) e riprogettare il logo nel contesto
> del design system Solids dual-theme.
>
> **DAG:**
> - Wave A (parallelo): TSK-165 (audit) ‖ TSK-166+167 (portrait fix P0) ‖ TSK-168 (logo design human)
> - Wave B (parallelo, dopo Wave A): TSK-169 (logo impl) ‖ TSK-170+171 (landscape) ‖ TSK-172+173 (tablet) ‖ TSK-174+175 (desktop)
> - Wave C (dopo Wave B): TSK-176 (regression e2e multi-viewport)
>
> **Note:** TSK-168 è `consumer: human` (gate grafico). Tutti gli altri sono `consumer: agent`.
> Pipeline FE per ogni TSK fe: `develop → visual-oracle → a11y → ux-ui-review → code-review`.

### Wave A — Audit + interventi critici (parallelo)

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-165 | Audit visivo 4 viewport × 4 tab × 2 temi — report EP-022-fidelity-audit.md | US-104 | qa | agent | P1 | M | todo | — |
| TSK-166 | Fix P0 portrait — nascondi ThemeSwitcher header mobile + aggiungi in Settings | US-105 | fe | agent | P0 | M | todo | — |
| TSK-167 | e2e Playwright portrait — visibilità + cliccabilità 4 tab + ThemeSwitcher in Settings | US-105 | qa | agent | P0 | S | todo | TSK-166 |
| TSK-168 | Design SVG dual-theme — 4 varianti logo (horizontal, mono, icon, favicon) [HUMAN] | US-106 | fe | human | P1 | L | todo | — |

### Wave B — Fix per viewport + logo implementation (parallelo max 4, dopo Wave A)

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-169 | Implementazione SVG logo in packages/app/public/logo + aggiorna import App.tsx | US-106 | fe | agent | P1 | M | todo | TSK-168 |
| TSK-170 | Fix layout mobile landscape — Tab bar, TouchOverlay safe-area, Player proporzionato | US-107 | fe | agent | P1 | M | todo | TSK-165, TSK-167 |
| TSK-171 | Visual oracle landscape × 2 temi → EP-022-mobile-landscape/ | US-107 | qa | agent | P1 | S | todo | TSK-170 |
| TSK-172 | Fix layout tablet — Library 3 col, Settings 2 col, Player portrait | US-108 | fe | agent | P1 | M | todo | TSK-165, TSK-167 |
| TSK-173 | Visual oracle tablet × 2 temi → EP-022-tablet/ | US-108 | qa | agent | P1 | S | todo | TSK-172 |
| TSK-174 | Fix delta desktop residui — Library 5 col, Player sidebar, Settings 3 col | US-109 | fe | agent | P2 | M | todo | TSK-165, TSK-167 |
| TSK-175 | Visual oracle desktop + verifica marker EP-021 → EP-022-desktop/ | US-109 | qa | agent | P2 | S | todo | TSK-174 |

### Wave C — Regression guard finale (dopo Wave B)

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-176 | Suite Playwright ep022-multi-viewport.e2e.ts — 4 viewport × 4 tab + doc operativa | US-110 | qa | agent | P1 | L | todo | TSK-167, TSK-171, TSK-173, TSK-175 |

DAG Sprint 20:
- Wave A (parallelo): TSK-165 ‖ TSK-166→TSK-167 ‖ TSK-168 (human gate)
- Wave B (parallelo max 4): TSK-169→TSK-168; TSK-170→TSK-167,165; TSK-171→TSK-170; TSK-172→TSK-167,165; TSK-173→TSK-172; TSK-174→TSK-167,165; TSK-175→TSK-174
- Wave C: TSK-176→TSK-167,171,173,175

Consumer distribution Sprint 20: agent=11, human=1 (TSK-168).

---

## Lookahead — Sprint 21+ (post-Sprint 20)

| Area | Note |
|------|------|
| EP-022 — Verifica device reale (iOS/Android) | Post-fix landscape/tablet: validazione su device fisico (gate umano) |
| EP-022 — Logo review ux-ui | TSK-168 gate umano sblocca TSK-169; review `ux-ui-reviewer` post implementazione |
| EP-006 — Code signing Win/macOS | Gate umano: segreti `CSC_*` / Apple notarization (ADR-007) |
| EP-007 — Capacitor device validation | TSK-059 human in-progress (Android Studio + Xcode gate) |
| EP-008 — iOS WASM benchmark | TSK-072 human todo (dipende da TSK-059 + device fisico) |
| EP-019 — e2e full ROM proprietarie (Pokémon GBC/GBA) | Gate umano: aggiungere ROM a `public/test-roms/`; sblocca `test.fixme` TSK-135 |

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


## Sprint 3 — "Emulazione reale" (ADR-004, post-MVP) — 4/4 done

| TSK | Titolo | layer | consumer | prio | est | status | depends_on |
|-----|--------|-------|----------|------|-----|--------|-----------|
| TSK-021 | EmulatorJsEngine: adapter reale | be | agent | P0 | L | done | — |
| TSK-022 | Player mount DOM + selezione engine | fe | agent | P0 | M | done | TSK-021 |
| TSK-023 | Hosting core + COOP/COEP | infra | human | P1 | M | done | TSK-021 |
| TSK-024 | e2e ROM homebrew reale (chiude gap) | qa | agent | P1 | M | done | TSK-021,022,023 |


## Sprint 4 — "Emulazione reale multi-engine" (ADR-005) — 4/4 done

| TSK | Titolo | layer | consumer | prio | status | depends_on |
|-----|--------|-------|----------|------|--------|-----------|
| TSK-025 | WasmBoyEngine (GB/GBC) + engine registry | be | agent | P0 | done | — |
| TSK-027 | e2e reale GB (WasmBoy + dmg-acid2) | qa | agent | P0 | done | TSK-025 |
| TSK-028 | MgbaEngine (GBA) — spike + adapter | be | agent | P1 | done | TSK-025 |
| TSK-029 | Deprecare/rimuovere EmulatorJsEngine | be | agent | P2 | done | TSK-025,027 |

Arcade (FBNeo/MAME): **rinviato** a epica dedicata (EP-009) — nessun ESM standalone;
il registry instrada l'arcade a "non ancora supportato". Vedi gap arcade-emulation-engine.


## Sprint 5 — Backlog post-MVP (EP-004 / EP-005 / EP-002) — 12/12 done

| TSK | Titolo | EP | layer | consumer | prio | status | depends_on |
|-----|--------|----|-------|----------|------|--------|-----------|
| TSK-030 | EmulatorEngine snapshot/restore + SRAM | EP-004 | be | agent | P0 | done | — |
| TSK-031 | StoragePort saveStates/sram + SaveService | EP-004 | be | agent | P0 | done | TSK-030 |
| TSK-032 | Player: pannello save state (slot) | EP-004 | fe | agent | P1 | done | TSK-031 |
| TSK-033 | Export/Import salvataggi (Settings) | EP-004 | fe | agent | P2 | done | TSK-031 |
| TSK-034 | e2e save/load state (GB reale) | EP-004 | qa | agent | P1 | done | TSK-030,032 |
| TSK-035 | Schermo intero (Fullscreen API) | EP-005 | fe | agent | P1 | done | — |
| TSK-036 | Scala + aspect ratio (persistiti) | EP-005 | fe | agent | P2 | done | — |
| TSK-037 | Filtri base (nearest/scanline) | EP-005 | fe | agent | P2 | done | — |
| TSK-038 | Ricerca + filtro piattaforma (Library) | EP-002 | fe | agent | P1 | done | — |
| TSK-039 | Copertina gioco (upload/display) | EP-002 | fe | agent | P2 | done | TSK-038 |
| TSK-040 | Integrare @soli92/solids reale | (cross) | fe | agent | P2 | done | Q_001 (risolta) |
| TSK-041 | Bugfix canvas WasmBoy loadState | EP-004 | fe | agent | P1 | done | TSK-032,034 |

TSK-040: Q_001 risolta 2026-06-01 — `@soli92/solids` consumabile da npm (1.14.1).

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


## Sprint 7 — Distribuzione desktop (EP-006) — 6/6 done

> Wave A completata (TSK-053, TSK-054, TSK-055, TSK-058 done).
> Wave B completata (TSK-056 bundling WASM offline, TSK-057 auto-update Electron done).

### Wave A — Dominio

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-053 | Electron main.ts + IPC filesystem bridge | US-023 | infra | human | P0 | L | done | — |
| TSK-054 | NativeFsAdapter (StoragePort su IPC Electron) | US-023 | be | agent | P0 | L | done | TSK-053 |
| TSK-055 | Selezione runtime adapter (IDB vs NativeFs) | US-023 | be | agent | P0 | S | done | TSK-054 |
| TSK-058 | e2e: carica ROM + salva (IPC mock, Electron) | US-023 | qa | agent | P1 | M | done | TSK-054,055 |

### Wave B — Infra (completata)

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-056 | Bundling core WASM offline (Electron) | US-024 | infra | human | P1 | M | done | TSK-053 |
| TSK-057 | Auto-update Electron (rileva + applica) | US-025 | infra | human | P2 | M | done | TSK-053,056 |

DAG Sprint 7:
- TSK-053 done → TSK-054 done → TSK-055 done → TSK-058 (done)
- Wave B (human): TSK-056 → TSK-057 (done)


## Sprint 8 — Esperienza mobile (EP-007) — 8/9 done · 1 in-progress

> **NOTE DESIGN:**
> - Capacitor (ADR-001) e plugin nativi sono specificati in L4: tutti i task sono taskizzabili.
> - TSK-059 (Capacitor init) è `consumer: human` per il requisito di Android Studio/Xcode/device — **unico residuo in-progress**.
> - TSK-060–TSK-067 (agent) **done** — sviluppati con emulazione browser (Playwright device emulation);
>   validazione su device reale resta gate umano post-TSK-059.

### Wave A — Prerequisito (gate umano)

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-059 | Capacitor init: progetto Android + iOS + plugin | US-026 | infra | human | P0 | M | in-progress | — |

### Wave B — Core mobile (parallelo, dopo TSK-059)

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-060 | TouchOverlay: D-pad + pulsanti virtuali | US-026 | fe | agent | P0 | L | done | TSK-059 |
| TSK-063 | File picker mobile (Capacitor Filesystem) | US-029 | fe | agent | P0 | M | done | TSK-059 |
| TSK-065 | Sospensione/ripresa (Capacitor App plugin) | US-031 | be | agent | P0 | S | done | TSK-059 |

### Wave C — Funzionalità avanzate (dopo Wave B)

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-061 | TouchOverlay config (posizione/size/opacità) | US-027 | fe | agent | P1 | M | done | TSK-060 |
| TSK-062 | Bluetooth controller + auto-hide overlay | US-028 | be | agent | P1 | M | done | TSK-060 |
| TSK-064 | Layout responsivo + safe areas (CSS env()) | US-030 | fe | agent | P0 | M | done | TSK-060 |
| TSK-066 | Feedback aptico (Capacitor Haptics) | US-032 | fe | agent | P2 | S | done | TSK-060 |

### Wave D — QA e2e mobile (dopo Wave C)

| TSK | Titolo | US | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|-------|----------|------|-----|--------|-----------|
| TSK-067 | e2e mobile smoke: TouchOverlay + sospensione | US-026 | qa | agent | P1 | M | done | TSK-060,064,065 |

DAG Sprint 8:
- Wave A (human): TSK-059 (in-progress) — gate device/Xcode
- Wave B (agent): TSK-060 ‖ TSK-063 ‖ TSK-065 (**done**)
- Wave C (agent): TSK-061, TSK-062, TSK-064, TSK-066 (**done**)
- Wave D (agent): TSK-067 (**done**)

Parallelismo max scheduler = 4: Wave B spawna 3 agent in parallelo (entro il limite).
Wave C spawna 4 task — il scheduler li dispatcha per dipendenza soddisfatta.


## Sprint 9 — Conformità e pubblicazione store (EP-008) + Storage desktop avanzato (EP-006) + Visual Oracle / CI (EP-011) — 10/11 done · 1 todo

> **NOTE DESIGN:**
> - Privacy on-device (ADR-002, StoragePort invariant) è completamente specced → TSK-068,069 agent.
> - Avviso legale in-app → TSK-070 agent (pattern da US-006 esistente).
> - Store metadata e iOS benchmark → gate umano (account developer, device fisico).
> - TSK-073: Visual Oracle v2.17 — render harness per copertura dark (done).
> - TSK-074–TSK-077: estensioni IPC filesystem Electron + allineamento spec storage-port (tutti done).
> - TSK-078: fix jsdom ERR_REQUIRE_ESM (qa, P1, done).

### Wave A — Privacy e conformità (parallelo)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-068 | Privacy audit: on-device su web/desktop/mobile | US-033 | EP-008 | qa | agent | P0 | M | done | TSK-054,055 |
| TSK-069 | Privacy policy in-app (comunicazione utente) | US-033 | EP-008 | fe | agent | P1 | S | done | — |

### Wave B — Avviso legale e store asset (dopo Wave A)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-070 | Avviso legale in-app: no ROM protette | US-034 | EP-008 | fe | agent | P1 | S | done | TSK-069 |
| TSK-072 | Benchmark iOS: WASM su device reale + report | US-035 | EP-008 | qa | human | P0 | L | todo | TSK-059,060 |

### Wave C — Store submission (gate umano, dopo Wave B)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-071 | Store metadata package (asset + checklist) | US-034 | EP-008 | infra | human | P2 | M | done | TSK-059,070 |

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
| TSK-078 | Fix env test jsdom: html-encoding-sniffer ERR_REQUIRE_ESM | US-043 | EP-011 | qa | agent | P1 | S | done | — |

DAG Sprint 9:
- Wave A (parallelo): TSK-068 ‖ TSK-069 (done)
- Wave B: TSK-070 (done) → TSK-069; TSK-072 → TSK-059,060 (human, **unico todo**)
- Wave C: TSK-071 (done) → TSK-059,070
- Wave D (indipendente, EP-006): TSK-074 (done) → TSK-075 (done); TSK-076 (done); TSK-077 (done) → TSK-074
- Wave E (parallelo, EP-011): TSK-073 (done) ‖ TSK-078 (done)


## Sprint 10 — Remediation a11y & UX/UI (EP-012) — 6/6 done · CLOSED

> **Obiettivo:** smaltire il debito v2.18. 21 TSK FE `done` pregressi senza
> `a11y_status`/`ux_ui_status` → scansioni retroattive per chiudere WARNING 4o/4p.
> I 5 TSK di scan sono **indipendenti** e parallelizzabili (scheduler max_parallel: 4).
> Ordering per ogni TSK scan: `visual-oracle (già eseguito) → /a11y → /ux-ui-review → update frontmatter TSK sorgente`.
> Finding `critical` → fix FE o Q hard; `major` → conditional gestito o fix dedicato.
> TSK-084 è il fix a11y emerso dai scan: chiude il gap `ds-color-contrast-cross-cutting-90s-party-dark`.
> Regola di neutralità invariante: `manual_checks N≥1` obbligatori.

### Wave 1 — Scan paralleli (tutti indipendenti)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | TSK sorgente coperti | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|----------------------|-----------|
| TSK-079 | Scan a11y + UX/UI: FileLoader, avviso legale, Library griglia | US-044 | EP-012 | fe | agent | P1 | M | done | TSK-003/020/006/012 | — |
| TSK-080 | Scan a11y + UX/UI: griglia DS, ricerca/filtro, copertina | US-045 | EP-012 | fe | agent | P1 | S | done | TSK-040/038/039 | — |
| TSK-081 | Scan a11y + UX/UI: Player, controls, Settings, save-state, video | US-046 | EP-012 | fe | agent | P1 | L | done | TSK-008/022/014/017/032/041/033/035/036/037 | — |
| TSK-082 | Scan a11y + UX/UI: PrivacyNotice, avviso legale in-app | US-047 | EP-012 | fe | agent | P1 | S | done | TSK-069/070 | — |
| TSK-083 | Scan a11y + UX/UI: ThemeSelector, logo header Library | US-048 | EP-012 | fe | agent | P2 | S | done | TSK-044/046 | — |

### Wave 2 — Fix a11y cross-cutting (post-scan, finding major chiusi)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | gap chiuso | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|------------|-----------|
| TSK-084 | Fix token color-contrast 90s-party/dark + verifica cyberpunk (WCAG 2.2 AA) | US-049 | EP-012 | fe | agent | P1 | M | done | ds-color-contrast-cross-cutting-90s-party-dark | — |

DAG Sprint 10:
- Wave 1: TSK-079/080/081/082/083 tutti **done** (scan retroattivo EP-012 completato: 16 a11y pass, 5 major, 21 ux pass).
- Wave 2: TSK-084 (**done**) — fix a11y cross-cutting completato.
- TSK-084 ha CHIUSO il gap `ds-color-contrast-cross-cutting-90s-party-dark`; `a11y_status: pass` su TSK-003/014/038/040/044 (override locale app-extra.css, scan iter-2 0 finding, build verde, 279/279 test).

**Nota a11y_status skip motivato applicato (non richiede scan):**
I seguenti 6 TSK FE `done` hanno ricevuto skip motivato direttamente nel frontmatter (infra/asset non-DOM):

| TSK | Titolo | a11y_skip_reason (sintesi) | ux_ui_skip_reason (sintesi) |
|-----|--------|----------------------------|-----------------------------|
| TSK-042 | Copia brand asset in public/ | copia binari PNG/SVG, no DOM | nessun componente UI |
| TSK-043 | Favicon + link tag index.html | meta-tag HTML, no DOM interattivo | nessun componente UI |
| TSK-045 | Web app manifest | JSON + meta tag, no DOM | file configurazione PWA |
| TSK-049 | CI GitHub Actions ci.yml | YAML infra, no DOM | pipeline CI, no interazione utente |
| TSK-050 | Branch protection main | gh API config, no DOM | configurazione VCS, no UI |
| TSK-051 | CD Vercel cd-vercel.yml | YAML infra, no DOM | pipeline CD, no interazione utente |

Sprint 10 **completo**.


## Sprint 11 — Design Intelligence UX (EP-013) — 7/7 done · CLOSED

> **Obiettivo:** applicare il pattern EP-019 (Design Intelligence Layer v2.21) a soli-boy: art-director
> statement formale, fix UX emulator-first (canvas collassato, TouchOverlay portrait, footer cleanup),
> audit token design system, critic pass globale, e re-verifica Functional Oracle EP-018.
> EP-022 Token Ledger attivato in questo sprint come side-effect.
>
> **Stato:** Sprint 11 **completo**. 7/7 TSK done (TSK-085..091). Consumer distribution: agent=7, human=0.

### Wave 1 — Art-director statement (radice)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-085 | Design audit EP-019: art-director statement UX emulator-first | US-091 | EP-013 | docs | agent | P0 | S | done | — |

### Wave 2 — Fix UX + audit (parallelo, dopo TSK-085)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-086 | Emulator size default: aumenta visibilità default emulatore (scale auto, maxWidth 480px) | US-091 | EP-013 | fe | agent | P0 | S | done | TSK-085 |
| TSK-087 | TouchOverlay positioning: verifica e documenta il fix portrait-flow | US-091 | EP-013 | fe | agent | P1 | S | done | TSK-085 |
| TSK-088 | Info/About section: rimuovi LegalNotice duplicata dal footer | US-091 | EP-013 | fe | agent | P1 | S | done | TSK-085 |
| TSK-089 | Design token audit: verifica usage SoliDS in soli-boy | US-091 | EP-013 | docs | agent | P2 | S | done | TSK-085 |
| TSK-091 | EP-018 Functional Oracle re-verification: saldo debito v2.20 | US-091 | EP-013 | qa | agent | P0 | S | done | — |

### Wave 3 — Critic pass globale (dopo Wave 2)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-090 | Critic pass globale UX EP-019: sintesi finding e lessons learned | US-091 | EP-013 | docs | agent | P2 | S | done | TSK-085,086,087,088,089 |

DAG Sprint 11:
- Wave 1: TSK-085 (radice)
- Wave 2: TSK-086 ‖ TSK-087 ‖ TSK-088 ‖ TSK-089 → TSK-085; TSK-091 (indipendente)
- Wave 3: TSK-090 → TSK-085..089

Sprint 11 **completo**. EP-022 Token Ledger attivato (hook Stop + display inline).


## Sprint 12 — Robustezza codice (EP-014, P0) + UX Player flusso principale (EP-015, P0) — 15/15 done · CLOSED

> **Obiettivo:** chiudere i finding P0 del deep code review (EP-014) e del deep UX review
> sul flusso Player (EP-015). EP-014 è prerequisito di stabilità per qualunque US successiva.
> EP-015 introduce avvio automatico, HUD localizzato e stabilità visiva del canvas.
>
> **Coordinazione:** TSK-103 (HUD italiano) deve essere completato prima di TSK-116
> (aria-live, che dipende dalle stringhe localizzate). TSK-100 (auto-avvio) dipende da
> TSK-104 (HUD) per coerenza visiva all'avvio.

### Wave 1 — Fix critici P0 (parallelo)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-092 | Fix restoreSram best-effort in handlePlay | US-050 | EP-014 | fe | agent | P0 | S | done | — |
| TSK-093 | Guard ROM Blob vuoto in WasmBoyEngine.load | US-050 | EP-014 | be | agent | P0 | XS | done | — |
| TSK-094 | Atomicità putSaveState: try-unlink su manifest fail | US-050 | EP-014 | be | agent | P0 | S | done | — |

### Wave 2 — Fix stale closure + HUD Player (parallelo)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-095 | Fix stale closure handleCapacitorUri FileLoader.tsx | US-051 | EP-014 | fe | agent | P1 | S | done | — |
| TSK-096 | Fix useMemo deps stale + selectAdapter Error Boundary | US-051 | EP-014 | fe | agent | P1 | M | done | — |
| TSK-097 | Fix handleFile async try/catch FileLoader.tsx | US-051 | EP-014 | fe | agent | P1 | XS | done | — |
| TSK-103 | HUD Player user-facing: romTitle + stati italiani + overlay pausa | US-054 | EP-015 | fe | agent | P1 | M | done | — |
| TSK-105 | Aspect-ratio CSS invariante su .sb-screen (idle no-jump) | US-055 | EP-015 | fe | agent | P1 | S | done | — |

### Wave 3 — QA + dipendenti da Wave 2 (dopo Wave 2)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-104 | Visual oracle + test funzionale HUD Player | US-054 | EP-015 | qa | agent | P1 | S | done | TSK-103 |
| TSK-106 | Layout slot fissi controlli Player | US-055 | EP-015 | fe | agent | P1 | M | done | TSK-105 |
| TSK-100 | Avvio automatico ROM da Library | US-053 | EP-015 | fe | agent | P0 | M | done | TSK-104 |

### Wave 4 — Gate conferma + toggle + refactor (dopo Wave 3)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-101 | Gate conferma cambio gioco: dialog modale | US-053 | EP-015 | fe | agent | P0 | M | done | TSK-100 |
| TSK-102 | Toggle Settings "Avvio automatico dalla libreria" | US-053 | EP-015 | fe | agent | P0 | S | done | TSK-100 |
| TSK-098 | Estrai hook useTabPause + useSaveData | US-052 | EP-014 | fe | agent | P2 | M | done | — |
| TSK-099 | Fix unsafe Error cast + test hook isolamento | US-052 | EP-014 | qa | agent | P2 | S | done | TSK-098 |

DAG Sprint 12:
- Wave 1 (parallelo, P0): TSK-092 ‖ TSK-093 ‖ TSK-094
- Wave 2 (parallelo, P1): TSK-095 ‖ TSK-096 ‖ TSK-097 ‖ TSK-103 ‖ TSK-105
- Wave 3 (dopo Wave 2): TSK-104 → TSK-103; TSK-106 → TSK-105; TSK-100 → TSK-104
- Wave 4 (dopo Wave 3): TSK-101 → TSK-100; TSK-102 → TSK-100; TSK-098 indipendente; TSK-099 → TSK-098

Sprint 12 **completo**.


## Sprint 13 — UX Library/Settings/componenti (EP-016, P1) + A11y manual checks (EP-017, P1) — 13/13 done · CLOSED

> **Obiettivo:** polish UX su Library, Settings e Player SaveState (EP-016) + remediation
> dei 5 manual check a11y (EP-017). EP-016/US-059 (TouchOverlay aria-hidden removal) è
> prerequisito di EP-017/US-061 (AT validation).
>
> **Coordinazione:** TSK-116 (aria-live Player) dipende da TSK-103 (HUD Sprint 12).
> TSK-114 (rimozione aria-hidden TouchOverlay) deve precedere TSK-119 (manual check AT).
> TSK-110 (Settings titolo ROM) è da coordinare con TSK-098 (hook useSaveData Sprint 12)
> per la firma dell'hook.

### Wave 1 — Fix indipendenti (parallelo)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-107 | Library GameTile: indicatore visivo ROM corrente | US-056 | EP-016 | fe | agent | P1 | S | done | — |
| TSK-108 | Library GameTile: azione Rimuovi con dialog conferma | US-056 | EP-016 | fe | agent | P1 | M | done | — |
| TSK-109 | De-duplica FileLoader: rimuovi da tab Play idle | US-056 | EP-016 | fe | agent | P1 | S | done | — |
| TSK-110 | Settings: titolo ROM in sezione Dati + accordion Resa video default open | US-057 | EP-016 | fe | agent | P1 | S | done | — |
| TSK-111 | SaveStatePanel: dialog conferma elimina save state | US-058 | EP-016 | fe | agent | P1 | M | done | — |
| TSK-113 | Footer cleanup: rimuovi LegalNotice da App.tsx footer | US-059 | EP-016 | fe | agent | P2 | XS | done | — |
| TSK-115 | Heading semantici: p.sb-lbl → h2/h3 in PrivacyNotice, StoreComplianceNotice, Settings | US-060 | EP-017 | fe | agent | P1 | S | done | — |

### Wave 2 — Dipendenti da Wave 1 (dopo Wave 1)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-112 | QA: test funzionale dialog elimina SaveStatePanel | US-058 | EP-016 | qa | agent | P1 | S | done | TSK-111 |
| TSK-114 | TouchOverlayConfigPanel: rimuovi aria-hidden + focus management + D-pad padding | US-059 | EP-016 | fe | agent | P2 | M | done | — |
| TSK-116 | aria-live stato Player + testo adiacente canvas | US-060 | EP-017 | fe | agent | P1 | S | done | TSK-103 |

### Wave 3 — QA manual checks (dopo Wave 2)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-117 | QA manual check report: heading nav + aria-live (EP-017-US-060) | US-060 | EP-017 | qa | agent | P1 | S | done | TSK-115, TSK-116 |
| TSK-118 | Fix type=button su "Salva profilo" in Settings.tsx (R-05) | US-061 | EP-017 | fe | agent | P2 | XS | done | TSK-114 |
| TSK-119 | Manual check R-04: AT validation TouchOverlayConfigPanel | US-061 | EP-017 | qa | agent | P2 | M | done | TSK-114, TSK-118 |

DAG Sprint 13:
- Wave 1 (parallelo): TSK-107 ‖ TSK-108 ‖ TSK-109 ‖ TSK-110 ‖ TSK-111 ‖ TSK-113 ‖ TSK-115 (**done**)
- Wave 2: TSK-112 → TSK-111 (**done**); TSK-114 (**done**); TSK-116 → TSK-103 (**done**)
- Wave 3: TSK-117, TSK-118, TSK-119 (**done**)

Sprint 13 **completo**.


## Sprint 14 — Controlli shoulder L/R (EP-018, P0) — 5/5 done · CLOSED

> **Obiettivo:** completare il supporto ai pulsanti shoulder L e R su tastiera, gamepad e touch, per tutti i core emulati (gambatte, mgba, fbneo, mame). WasmBoy GB mantiene no-op documentato (hardware senza shoulder). Sprint corto (5 TSK atomici), tutti P0, DAG a due livelli.
>
> **Stato:** Sprint 14 **completo** (2026-06-28).

### Wave 1 — Dominio InputMapping (prerequisito)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-120 | InputMapping: default keyboard L/R + gamepad indices 4/5 | US-062 | EP-018 | be | agent | P0 | S | done | — |

### Wave 2 — UI + Engine pipeline (parallelo, dopo TSK-120)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-121 | Settings: aggiungere "l" e "r" alla lista pulsanti rimappabili | US-064 | EP-018 | fe | agent | P0 | S | done | TSK-120 |
| TSK-122 | TouchOverlay button-map: L/R su tutti i core (gambatte, mgba, fbneo, mame) | US-063 | EP-018 | fe | agent | P0 | M | done | TSK-120 |
| TSK-123 | Engine pipeline: forward L/R verificato/documentato | US-062 | EP-018 | be | agent | P0 | S | done | TSK-120 |

### Wave 3 — QA end-to-end (dopo Wave 2)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-124 | Test integrazione/e2e: L/R tastiera, gamepad mock, touch GBA, overlay GB | US-063 | EP-018 | qa | agent | P0 | M | done | TSK-120, TSK-121, TSK-122, TSK-123 |

DAG Sprint 14:
- Wave 1: TSK-120 (**done**)
- Wave 2: TSK-121 (**done**) ‖ TSK-122 (**done**) ‖ TSK-123 (**done**)
- Wave 3: TSK-124 (**done**)

Sprint 14 **completo**.


## Sprint 15 — Orologio interno emulatore RTC (EP-019, P0) — 8/8 done · CLOSED

> **Stato:** Sprint 15 **completo** (chiusura wave dominio/UI/storage). 8/8 TSK done. Bridge engine reali deferred a Sprint 16 (sblocco dopo chiusura ADR-009 RTC).
>
> **Obiettivo:** introdurre supporto completo al Real Time Clock (RTC) dell'emulatore:
> impostazione data/ora dal Settings, persistenza locale per gioco, inclusione nei save
> state (compat all'indietro), e allineamento all'orologio del dispositivo.
>
> **Coordinazione:** TSK-125 (RtcService dominio) e TSK-127 (storage) sono la radice parallela.
> Wave 2 (TSK-126/128/129/130) parte dopo TSK-125. TSK-131 (UI sync) dopo TSK-126+TSK-130.
> TSK-132 (QA) dipende da tutti.

### Wave 1 — Dominio + Storage (parallelo, radice)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-125 | RtcService: interfaccia dominio RTC (getRtcState / setRtcState / hasRtc) | US-065 | EP-019 | be | agent | P0 | M | done | — |
| TSK-127 | Storage: store `rtcState` + operazioni StoragePort (putRtcState / getRtcState / deleteRtcState) | US-066 | EP-019 | db | agent | P0 | S | done | TSK-125 |

### Wave 2 — UI + Wiring dominio + SaveService (parallelo, dopo Wave 1)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-126 | Settings: sezione data/ora RTC (form, validazione, visibilità condizionale) | US-065 | EP-019 | fe | agent | P0 | M | done | TSK-125 |
| TSK-128 | GameSession: wiring RtcService ↔ engine ↔ StoragePort (persist on stop / restore on start) | US-066 | EP-019 | be | agent | P0 | M | done | TSK-125, TSK-127 |
| TSK-129 | SaveService: includi snapshot RTC in putSaveState / ripristina in restoreSaveState (compat all'indietro) | US-067 | EP-019 | be | agent | P0 | M | done | TSK-125, TSK-127 |
| TSK-130 | RtcService: metodo syncToDevice() — allineamento all'orologio del dispositivo | US-068 | EP-019 | be | agent | P1 | S | done | TSK-125 |

### Wave 3 — UI sync + QA chiusura (dopo Wave 2)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-131 | Settings RtcSection: pulsante "Usa ora del dispositivo" (syncToDevice) | US-068 | EP-019 | fe | agent | P1 | S | done | TSK-126, TSK-130 |
| TSK-132 | Test integrazione/e2e: flusso RTC completo (set, persist, save-state, sync-to-device) | US-065/066/067/068 | EP-019 | qa | agent | P0 | M | done | TSK-125, TSK-126, TSK-127, TSK-128, TSK-129, TSK-130, TSK-131 |

DAG Sprint 15:
- Wave 1: TSK-125 (radice) ‖ TSK-127 → TSK-125
- Wave 2: TSK-126 → TSK-125; TSK-128 → TSK-125,127; TSK-129 → TSK-125,127; TSK-130 → TSK-125
- Wave 3: TSK-131 → TSK-126,130; TSK-132 → tutti (chiusura wave)

Sprint 15 **completo**.


## Sprint 16 — Bridge RTC reale (EP-019, follow-up) — 3/3 done · CLOSED

> **Stato:** Sprint 16 **completo** (2026-06-30). Bridge concreti `WasmBoyRtcBridge` (GBC, MBC3) e `MgbaRtcBridge` (GBA, S-3511A BCD) implementati a chiusura ADR-009 §4; gli stub `rtcBridge = null` negli engine sono stati sostituiti. e2e bridge detection sblocca `test.describe.skip` in `ep019-rtc.e2e.ts`.
>
> **Test suite:** 662/662 unit + 30/30 e2e verdi.
>
> **Human gate residuo (NON bloccante):** e2e full con ROM Pokémon proprietarie GBC/GBA — marcati `test.fixme` con messaggio esplicito in `ep019-rtc.e2e.ts`, sblocco previa aggiunta manuale delle fixture in `public/test-roms/`.

### Wave 1 — Bridge engine (parallelo) — done

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-133 | WasmBoyRtcBridge: MBC3 registers ↔ RtcState (GBC reale) | US-065 | EP-019 | be | agent | P0 | L | done | TSK-125, TSK-128 |
| TSK-134 | MgbaRtcBridge: S-3511A BCD ↔ RtcState (GBA reale) | US-065 | EP-019 | be | agent | P0 | L | done | TSK-125, TSK-128 |

### Wave 2 — e2e sblocco (dopo Wave 1) — done

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-135 | e2e bridge reale: sblocca test.describe.skip ep019-rtc (GBC + GBA) | US-065 | EP-019 | qa | agent | P1 | M | done | TSK-133, TSK-134 |

DAG Sprint 16:
- Wave 1: TSK-133 (**done**) ‖ TSK-134 (**done**)
- Wave 2: TSK-135 (**done**) → TSK-133, TSK-134

Sprint 16 **completo**. EP-019 chiuso (`status: done`) per scope corrente — bridge reali consegnati, e2e detection sbloccato.


## Sprint 17 — Graphic Refactoring infra + Design Intelligence (EP-020, P0) — 7/7 done · CLOSED

> **Stato:** Sprint 17 **completo** (2026-07-02). Phase 0 infra (Tailwind + Solids registry + shadcn CLI) e Phase 1 Design Intelligence (art-director DSL + prototipo React + UX/UI review) consegnate. Test suite post-infra: 662/662 unit verdi (TSK-139 smoke).
>
> **Obiettivo:** preparare `packages/app` per la migrazione UI a componenti `@soli92/solids` e produrre il prototipo interattivo dual-theme (cyberpunk + 90s-party) come riferimento vincolante per le wave di migrazione.

### Phase 0 — Infra Tailwind + Solids (serial)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-136 | npm install Tailwind + config files | US-092 | EP-020 | infra | agent | P0 | S | done | — |
| TSK-137 | components.json + path alias + utils.ts | US-092 | EP-020 | fe | agent | P0 | S | done | TSK-136 |
| TSK-138 | shadcn CLI install + main.tsx CSS imports | US-092 | EP-020 | infra | agent | P0 | S | done | TSK-137 |
| TSK-139 | Infra smoke test: zero regressioni post-install | US-092 | EP-020 | qa | agent | P0 | S | done | TSK-138 |

### Phase 1 — Design Intelligence (parallela a Phase 0 dopo TSK-136)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-140 | Art-Director DSL — EP-020 Design Brief | US-093 | EP-020 | design | agent | P1 | M | done | TSK-136 |
| TSK-141 | `/prototype EP-020` — Interactive React prototype | US-093 | EP-020 | fe | agent | P1 | L | done | TSK-140 |
| TSK-142 | UX/UI review del prototipo + gap analysis | US-093 | EP-020 | qa | agent | P1 | M | done | TSK-141 |

DAG Sprint 17:
- Phase 0: TSK-136 → TSK-137 → TSK-138 → TSK-139
- Phase 1: TSK-140 → TSK-141 → TSK-142 (radice TSK-136)

Sprint 17 **completo**.


## Sprint 18 — Graphic Refactoring migration + regression (EP-020, P0) — 15/15 done · CLOSED

> **Stato:** Sprint 18 **completo** (2026-07-02). Migrazione UI per superficie (App shell, Play, Library, Settings, Info, cross-cutting) + CSS cleanup + regression suite finale. Pipeline per TSK FE: develop → visual-oracle → a11y → ux-ui-review → code-review. Test suite finale: **671/671 unit** + 30/30 e2e verdi. **EP-020 chiuso** (`status: done`).
>
> **Obiettivo:** sostituire classi `sb-*`/`sd-*` con componenti React `@soli92/solids` (Radix/Tailwind), mantenendo invarianti game-specific (canvas host, TouchOverlay positioning, override WCAG AA).

### Wave A — App shell (dopo Sprint 17)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-143 | App shell + Tabs navigation migration | US-094 | EP-020 | fe | agent | P0 | M | done | TSK-139, TSK-142 |

### Wave B — Tab surfaces (parallela max 4, dopo TSK-143)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-144 | Player container + HUD + controls → solids Button | US-095 | EP-020 | fe | agent | P1 | M | done | TSK-143 |
| TSK-145 | FileLoader + idle CTA → solids Button | US-095 | EP-020 | fe | agent | P1 | S | done | TSK-143 |
| TSK-146 | GameTile grid → Card + Badge + Button | US-096 | EP-020 | fe | agent | P1 | M | done | TSK-143 |
| TSK-147 | Search input + platform chips → Input + ToggleGroup | US-096 | EP-020 | fe | agent | P1 | S | done | TSK-143 |
| TSK-148 | RemoveRomConfirmDialog → AlertDialog | US-096 | EP-020 | fe | agent | P1 | S | done | TSK-143 |
| TSK-149 | Settings sections → solids Accordion | US-097 | EP-020 | fe | agent | P1 | M | done | TSK-143 |
| TSK-152 | Info tab notices + UpdateBanner → Card + Alert | US-098 | EP-020 | fe | agent | P2 | S | done | TSK-143 |

### Wave B (serial Settings) — dopo TSK-149

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-150 | Form controls → Switch, Select, Slider, Kbd, Input | US-097 | EP-020 | fe | agent | P1 | M | done | TSK-149 |
| TSK-151 | ThemeSelector → RadioGroup | US-097 | EP-020 | fe | agent | P1 | S | done | TSK-150 |

### Wave C — Cross-cutting (dopo Wave B)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-153 | ConfirmGameChangeDialog → AlertDialog | US-099 | EP-020 | fe | agent | P1 | S | done | TSK-143, TSK-148 |
| TSK-154 | UpdateBanner → Alert + Button | US-099 | EP-020 | fe | agent | P2 | S | done | TSK-143 |
| TSK-155 | TouchOverlay visual styling → Tailwind | US-099 | EP-020 | fe | agent | P2 | M | done | TSK-144 |

### Wave D — CSS cleanup + regression (dopo Wave C)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-156 | CSS cleanup: rimozione classi orfane | US-100 | EP-020 | fe | agent | P2 | M | done | TSK-144..155 |
| TSK-157 | Full regression suite finale EP-020 | US-100 | EP-020 | qa | agent | P1 | M | done | TSK-156 |

DAG Sprint 18:
- Wave A: TSK-143 (**done**) → TSK-139, TSK-142
- Wave B: TSK-144 ‖ TSK-145 ‖ TSK-146 ‖ TSK-147 ‖ TSK-148 ‖ TSK-149 ‖ TSK-152 (**done**)
- Wave B serial: TSK-150 → TSK-149; TSK-151 → TSK-150
- Wave C: TSK-153 ‖ TSK-154 ‖ TSK-155 (**done**)
- Wave D: TSK-156 → tutte le superfici; TSK-157 → TSK-156

Sprint 18 **completo**. EP-020 chiuso — 22/22 TSK (TSK-136..157) `done`.


## Sprint 19 — Visual fidelity prototipo (EP-021) + Release desktop (EP-006) — 7/7 done · CLOSED

> **Stato:** Sprint 19 **completo** (2026-07-02). EP-021 chiuso (TSK-158..161). EP-006 US-104 chiusa (TSK-162..164: CI AppImage + smoke + GitHub Release workflow).
>
> **Obiettivo:** (1) Formalizzare e chiudere parità visiva produzione↔prototipo EP-020; (2) prima build Electron distribuibile unsigned con CI/CD su tag `v*`.

### Wave A — EP-021 Visual fidelity (retroattivo, done)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-158 | Shell parity: header, ThemeSwitcher, Play idle CTA | US-101 | EP-021 | fe | agent | P0 | M | done | TSK-143 |
| TSK-159 | InfoTab + LegalNotice card variant | US-102 | EP-021 | fe | agent | P1 | S | done | TSK-152 |
| TSK-160 | Player save sidebar layout desktop | US-103 | EP-021 | fe | agent | P1 | S | done | TSK-144 |
| TSK-161 | Visual oracle e2e prototipo vs produzione | US-103 | EP-021 | qa | agent | P0 | M | done | TSK-158,159,160 |

Sprint 19 Wave A **completo**. EP-021 chiuso (`status: done`).

### Wave B — EP-006 Release pipeline unsigned (serial, done)

| TSK | Titolo | US | EP | layer | consumer | prio | est | status | depends_on |
|-----|--------|----|----|-------|----------|------|-----|--------|-----------|
| TSK-162 | CI: electron-builder Linux AppImage | US-104 | EP-006 | infra | agent | P0 | M | done | TSK-055,056 |
| TSK-163 | CD: GitHub Release workflow tag `v*` | US-104 | EP-006 | infra | agent | P1 | M | done | TSK-162 |
| TSK-164 | QA smoke desktop + doc release unsigned | US-104 | EP-006 | qa | agent | P1 | S | done | TSK-162 |

DAG Sprint 19 Wave B:
- TSK-162 (radice) → TSK-163 ‖ TSK-164

Sprint 19 **completo**. EP-006 chiuso (`status: done`). Prima release desktop: push tag `v*` → workflow `release-desktop.yml`.


<!-- Lookahead Sprint 20+ spostato in cima (Sprint 20 sezione) -->


## Note generali

- **Stato globale (2026-07-03):** 161/163 TSK done · 1 in-progress (TSK-059, human gate device) · 1 todo (TSK-072, human gate iOS device) · **12 todo Sprint 20 (EP-022, TSK-165..176)**.
- **Core web MVP completo** (20/20 done). 49 test verdi, typecheck OK.
- **TSK-041 done** (bugfix canvas WasmBoy loadState — 8/8 e2e verdi).
- Sprint 6 — 11/11 task done (EP-010 + EP-011). Tutti completati.
- Sprint 7 — 6/6 task done (EP-006 desktop). Wave A + Wave B completate (TSK-053..058).
- Sprint 8 — 9 task EP-007: **8/9 done**; TSK-059 in-progress (human, gate device/Xcode).
  TSK-060..067 done (TouchOverlay, mobile UX, e2e smoke).
- Sprint 9 — 11 task: **10/11 done**. Residuo: TSK-072 (human, benchmark iOS WASM su device).
  TSK-068/071/078 done.
- **Sprint 10 — Remediation a11y & UX/UI (EP-012):** 6/6 done (5 scan TSK-079..083 + fix TSK-084).
  Fix a11y cross-cutting: TSK-084 (P1, **done**) — token contrasto 90s-party/dark/cyberpunk corretti; gap chiuso
  `ds-color-contrast-cross-cutting-90s-party-dark`. 6 TSK skip motivato applicato (infra/asset non-DOM).
- **Sprint 11 — Design Intelligence (EP-013):** 7/7 done (TSK-085..091).
  Art-director statement EP-019 UX emulator-first; fix canvas collassato (TSK-086), TouchOverlay portrait (TSK-087), footer cleanup (TSK-088); design token audit (TSK-089); critic pass globale (TSK-090); Functional Oracle EP-018 re-check PASS (TSK-091). EP-022 Token Ledger attivato. Consumer distribution Sprint 11: agent=7, human=0.
- **Sprint 12 — Robustezza codice (EP-014) + UX Player (EP-015):** 15/15 TSK done (TSK-092..106).
  EP-014 P0: TSK-092..097 done. EP-014 P2: TSK-098..099 done (refactor hook + test isolamento).
  EP-015 P0/P1: TSK-100..106 done (auto-avvio, HUD, gate cambio gioco, toggle, stabilità visiva).
  480/480 test pass. Complessità cognitiva App.tsx + Settings.tsx sotto soglia 15.
- **Sprint 13 — UX Library/Settings (EP-016) + A11y (EP-017):** **13/13 done**. EP-016 + EP-017 chiusi.
- **Sprint 14 — Controlli shoulder L/R (EP-018):** 5/5 done — Sprint completo (TSK-120..124).
- **Sprint 15 — Orologio interno RTC (EP-019):** 8/8 done (TSK-125..132). Dominio `RtcService`, UI `Settings → RtcSection`, store `rtcState`, wiring `GameSession ↔ engine ↔ StoragePort`, inclusione RTC nei save state (compat all'indietro), `syncToDevice`, test integrazione/e2e — tutti done. Consumer distribution Sprint 15: agent=8, human=0.
- **Sprint 16 — Bridge RTC reale (EP-019 follow-up):** 3/3 done (TSK-133..135) — Sprint completo (2026-06-30). `WasmBoyRtcBridge` (GBC, MBC3) + `MgbaRtcBridge` (GBA, S-3511A BCD) consegnati (ADR-009 §4); e2e bridge detection sblocca `test.describe.skip` in `ep019-rtc.e2e.ts`. Test suite: 662/662 unit + 30/30 e2e verdi. **EP-019 chiuso** (`status: done`). Residuo (human gate, NON bloccante): fixture ROM Pokémon proprietarie — `test.fixme` con messaggio esplicito, sblocco previa aggiunta manuale in `public/test-roms/`. Consumer distribution Sprint 16: agent=3, human=0.
- **Sprint 17 — Graphic Refactoring infra + Design Intelligence (EP-020):** **7/7 done** (TSK-136..142). Tailwind + Solids registry + shadcn CLI installati; design brief `wiki/design/ep020-design-brief.md`; prototipo `output/prototypes/ep020/`; UX/UI review prototipo (TSK-142 conditional → finding mappati in Wave B). Consumer distribution Sprint 17: agent=7, human=0.
- **Sprint 18 — Graphic Refactoring migration + regression (EP-020):** **15/15 done** (TSK-143..157). Migrazione 4 tab + cross-cutting + CSS cleanup; pipeline FE completa (visual-oracle + a11y + ux-ui-review + code-review). Test suite finale: **671/671 unit** + 30/30 e2e verdi. **EP-020 chiuso** (`status: done`, 22/22 TSK totali). Consumer distribution Sprint 18: agent=15, human=0.
- **Sprint 19 — Visual fidelity (EP-021) + Release desktop (EP-006):** **7/7 done** (TSK-158..164). EP-021 (TSK-158..161) + US-104 (TSK-162..164: CI AppImage, release-desktop.yml, smoke xvfb). **EP-006 chiuso** (`status: done`).
- **Kanban hygiene 2026-07-02:** EP-001..006, EP-010..017, EP-021 chiusi (`done`); EP-007/008 `in-progress` (gate human); 161/163 TSK done (post Sprint 19).
- **Sprint 20 — Mobile-first Responsive & Visual Fidelity (EP-022):** 12 TSK generati (TSK-165..176). Bug P0 US-105 (navbar portrait overlay): fix = nascondi ThemeSwitcher dall'header su ≤640px (decision PO) + aggiungi in Settings. Consumer distribution: agent=11, human=1 (TSK-168 logo design).
- **Factory upgrade v2.18 (A11y + UX/UI):** Lint Check 4o/4p attivi.
  Debito pregressi: 6 skip motivati (B: infra/asset) + 21 scansionati (A: EP-012 done).
  Residuo lint a11y/UX: **0** (Check 4o e 4p puliti dopo TSK-084: 21 pass + 6 skip + 5 fix→pass).
- **Visual oracle v2.17**: campo `visual_status` attivo su TSK-069.
- **Consumer distribution (Sprint 7-13):** agent=38, human=6.
- Gap da chiudere con lead-architect (storico Sprint 7 Wave B): gap packaging chiusi — TSK-056/057 done.
- TSK-058 (e2e Electron) **done**.
