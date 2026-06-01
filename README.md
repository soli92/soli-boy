# soli-boy

Arcade and Game Boy application.

---

Questo repo è gestito come **Agentic Factory llm-wiki++ v2.15** — una knowledge base
wiki-style + pipeline multi-agente per planning ed esecuzione full-stack, governata dal
contratto in [`PATTERN.md`](PATTERN.md). Il codice dell'applicazione vive in
[`packages/app/`](packages/app/) (L5).

## Struttura factory

```
raw/                     L1 — input grezzi (read-only)
wiki/                    L2 — wiki llm-style append-only
management/              L3 — kanban + roadmap + questions
design_&_architecture/   L4 — decisioni, API spec, DB schema
packages/app/            L5 — codice dell'app (arcade / Game Boy)
memory/                  side-channel — memoria cross-conversazione
code_quality/            side-channel — KB regole + report CQRL
.graphify-state/         side-channel — knowledge graph (non versionato)
.claude/  .cursor/        adapter runtime
```

## Setup

1. **Adapter**: usa Claude Code (`.claude/`) o Cursor (`.cursor/`).
2. **Stack**: `stack_mode: guided` — al primo `/dev` lo `stack-detector` propone lo stack.
3. **GitHub**: `gh auth login` (per `/kanban-publish` e VCS handoff).
4. **CQRL**: popola `code_quality/rules/canonical/` per lo stack prima del primo `/review`.
5. **Compression context** (consigliato): `graphify --version` (≥ 0.8.22), poi
   `/graphify-sync app` per popolare il side-channel.

## Comandi principali

`/run` · `/sync-docs` · `/query` · `/lint` · `/heal` · `/topology` · `/dev` · `/review`
· `/kanban-publish` · `/premortem` · `/compression` · `/graphify-sync`

Vedi [`CLAUDE.md`](CLAUDE.md) per il quick start completo e
[`factory.config.yaml`](factory.config.yaml) per la configurazione.
