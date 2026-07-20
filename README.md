# Soli-boy

**Emulatore multipiattaforma** per arcade e console handheld (Game Boy / Game Boy Color,
Game Boy Advance, arcade FBNeo/MAME), distribuito come **web app**, **desktop** (Electron)
e **mobile** (Android/iOS via Capacitor). L'utente carica le proprie ROM ed esegue i
giochi nel browser o in app nativa; salvataggi e dati restano sul dispositivo.

> **Vincolo legale**: Soli-boy non distribuisce né include ROM o BIOS protetti da
> copyright. L'esecuzione avviene esclusivamente su file forniti dall'utente.

Stato: **Core web MVP completo + emulazione reale GB/GBA** (28 task, 49 unit + 6 e2e). Emulazione: WasmBoy (GB/GBC) e mGBA (GBA), verificate in e2e con ROM libere; arcade rinviato. Feature post-MVP (salvataggi, libreria avanzata, desktop, mobile) a backlog. Vedi [Stato del progetto](#stato-del-progetto).

## Stack

TypeScript · React · design system **solids** (`@soli92/solids`) · Vite ·
**EmulatorJS** (core Libretro in WASM: Gambatte, mGBA, FBNeo/MAME) · **IndexedDB** (idb) ·
Gamepad API · **Electron** (desktop) · **Capacitor** (mobile).

Dettaglio e razionale: [`raw/tech_stack.md`](raw/tech_stack.md),
[`wiki/syntheses/stack-tecnologico-soli-boy.md`](wiki/syntheses/stack-tecnologico-soli-boy.md),
ADR in [`design_&_architecture/decisions/`](design_&_architecture/decisions/).

## Applicazione (`packages/app/`)

Il codice vive in [`packages/app/`](packages/app/) (Vite + React + TypeScript, test con Vitest).

```bash
cd packages/app
npm install
npm run dev        # dev server
npm test           # unit/integration test (vitest)
npm run typecheck  # tsc --noEmit
npm run build      # build di produzione
```

Struttura UI: l'app è organizzata in **navigazione a 4 tab** (`Play` / `Libreria` /
`Impostazioni` / `Info & Privacy`) — la home è **emulator-first** (il viewport di gioco è il
contenuto primario, proporzioni 3:2). I controlli touch (`TouchOverlay`) si adattano:
sotto lo schermo in portrait, 3 colonne in landscape, overlay ai bordi in fullscreen.

Moduli principali:
- `src/storage/` — adapter IndexedDB / filesystem nativo + persistenza on-device (ROM, save-state).
- `src/core/` — wrapper engine (WasmBoy GB/GBC, mGBA GBA) + lifecycle.
- `src/domain/` — riconoscimento piattaforma → core di emulazione.
- `src/components/` — UI su solids: `Player` (viewport), `Library`, `FileLoader`, `Settings`
  (accordion), `TouchOverlay`, `PrivacyNotice`, `ThemeSelector`.

## Gestione del progetto (Agentic Factory llm-wiki++ v2.19)

Oltre a essere l'app, questo repo è gestito come **Agentic Factory**: una knowledge base
wiki-style + pipeline multi-agente (ingest → planning → design → task → sviluppo) governata
dal contratto in [`PATTERN.md`](PATTERN.md). Adapter runtime: `.claude/` e `.cursor/`.

```
raw/                     L1 — input grezzi (specifiche, mockup) — read-only
wiki/                    L2 — knowledge base wiki-style (append-only)
management/              L3 — kanban (epiche/US) + roadmap + questions
design_&_architecture/   L4 — ADR + design (API/DB)
packages/app/            L5 — codice dell'applicazione
memory/ code_quality/    side-channel (memoria, regole/report qualità)
```

Comandi factory: `/run` · `/sync-docs` · `/query` · `/dev` · `/review` · `/visual-oracle`
· `/a11y` · `/ux-ui-review` · `/ux-ui-design` · `/functional-oracle` · `/kanban-publish`
· `/premortem` · `/compression` · `/graphify-sync`. Quick start in
[`CLAUDE.md`](CLAUDE.md), configurazione in [`factory.config.yaml`](factory.config.yaml).

> **Pipeline di correttezza FE** (ON): i TSK frontend attraversano una catena di gate opt-in
> `develop → visual-oracle → ux-ui-review/a11y → functional-oracle → code-review`.
> - **Visual Oracle** (v2.17): render headless + screenshot multi-viewport/tema + critica visiva.
> - **A11y + UX/UI Review/Design** (v2.18): scan WCAG 2.2 AA + critica su rubrica anti-soggettività.
> - **Functional Oracle** (EP-018, v2.20): *esercita* il flusso reale (carica una ROM di test →
>   avvia → asserzioni sul comportamento), non solo l'aspetto — verdict deterministico. Schema
>   acceptance-spec in [`code_quality/acceptance/soliboy.acceptance.yaml`](code_quality/acceptance/soliboy.acceptance.yaml).

## Stato del progetto

| Layer | Stato |
|---|---|
| Knowledge base (L2) | 3 sorgenti ingerite → 35 pagine wiki |
| Planning (L3) | 8 epiche · 35 user story · roadmap (R1 web / R2 desktop / R3 mobile) |
| Design (L4) | 3 ADR + design Core web MVP (EP-001 + EP-003) |
| Task (L4) | 20 TSK · **tutti done** · 19/20 review-passed |
| Sviluppo (L5) | **Core web MVP + emulazione reale**: 28 TSK done · WasmBoy (GB/GBC) + mGBA (GBA) verificati e2e · 49 unit + 6 e2e |
| Mirror GitHub | 8 milestone (EP-001…008) su `soli92/soli-boy` |

Roadmap dettagliata: [`management/roadmap.md`](management/roadmap.md) ·
board: [`management/kanban/sprint.md`](management/kanban/sprint.md).

## Capability Factory

Configurazione dei layer opt-in della factory v2.33 su questo progetto.
Dettaglio completo: [`factory.config.yaml`](factory.config.yaml) · layer non usati: [`LAYERS-NOT-USED.md`](LAYERS-NOT-USED.md).

### Attive

| Layer | Flag config | Nota |
|-------|-------------|------|
| Code Quality Review (CQRL) | `code_quality.enabled: true` | 3 pass (idiomaticity / design / robustness); loop max 3 iterazioni |
| FE Visual Oracle | `fe_correctness.enabled: true` | Render headless multi-viewport/tema + critica LLM su ogni TSK FE |
| FE Functional Oracle | `fe_correctness.functional_oracle.enabled: true` | Esercita il flusso reale (carica ROM → avvia → asserzioni); verdict deterministico |
| Accessibility Testing (A11y) | `a11y.enabled: true` | WCAG 2.2 AA via axe-playwright; agente a11y-specialist attivo |
| UX/UI Review & Design | `ux_ui.enabled: true` | Rubrica anti-soggettivita' + agenti ux-ui-reviewer + ui-designer |
| Design Intelligence Layer | `design_intelligence.enabled: true` | Art-director DSL + Critic/Judge 6 principi + Intention Economy |
| Prototype Generation Layer | `prototyping.enabled: true` | Cascata figma→penpot→react→html; fallback html garantito |
| Compression Output (Caveman) | `compression.output.enabled: true` | Policy conservative; riduce overhead messaggi agent-to-agent |
| Compression Context (Graphify) | `compression.context.enabled: true` | Knowledge graph di `packages/app` come context replacement |
| Task Analytics + Dogfooding | `analytics.measurement.enabled: true` | Misura costo reale agenti; harvest token su SessionEnd |
| Token Ledger | `analytics.token_ledger.enabled: true` | Display token reali inline dopo ogni operazione |
| Kanban Publish (GitHub) | `kanban_publish.provider: github` | Mirror push-only su `soli92/soli-boy` GH Issues/Milestones |

### Disattivate

| Layer | Flag config | Nota |
|-------|-------------|------|
| VCS Branch Awareness | `branch_awareness.enabled: false` | Monorepo single-HEAD: layer degenere, nessun submodule da allineare |
| Semantic Drift Detection L3 | `wiki_lint.semantic_check.enabled: false` | L1 staleness always-on sufficiente per il volume wiki corrente |
| Tavola Rotonda Mode | `tavola_rotonda.enabled: false` | Dominio single-dev: deliberazione multi-agente non necessaria |
| Hybrid Wiki Search | `wiki_search.enabled: false` | 57 pagine wiki: ricerca testuale sufficiente |
| Temporal Estimate Protocol | `temporal.estimate_protocol.enabled: false` | Sprint brevi: stima adattiva elapsed non necessaria |
| Capability Formativa (Tutoring) | `capability_formativa.enabled: false` | Nessun use case tutoring adattivo |
| Content Share Consumer Layer | `content_share.enabled: false` | Dispatch verso soli-frames non attivato |
| Voice Channel / Voice Hardening | non scaffolded | Progetto non-voice (emulatore web): nessun I/O audio agente |

## Licenza

Da definire. Il progetto non veicola contenuti protetti da copyright.
