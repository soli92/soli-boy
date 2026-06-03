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

Moduli implementati (Wave 1):
- `src/storage/` — adapter IndexedDB + store `roms` (persistenza on-device).
- `src/domain/` — riconoscimento piattaforma → core di emulazione.
- `src/components/` — componenti UI su solids (es. avviso legale).

## Gestione del progetto (Agentic Factory llm-wiki++ v2.17)

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
· `/kanban-publish` · `/premortem` · `/compression` · `/graphify-sync`. Quick start in
[`CLAUDE.md`](CLAUDE.md), configurazione in [`factory.config.yaml`](factory.config.yaml).

> **v2.17 — FE Visual Oracle** (ON): i TSK frontend passano da una verifica visiva
> (render headless Playwright + screenshot multi-viewport/tema + critica) prima della code
> review. Ordering `develop → visual-oracle → review`. Vedi
> [`wiki/runbooks/visual-oracle-installation.md`](wiki/runbooks/visual-oracle-installation.md).

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

## Licenza

Da definire. Il progetto non veicola contenuti protetti da copyright.
