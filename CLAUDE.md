# CLAUDE.md — soli-boy

Questo repo è una **Agentic Factory llm-wiki++ v2.19** scaffoldata da `factory-bootstrap`.
Segue il contratto universale definito in [`PATTERN.md`](PATTERN.md) (agent-agnostic,
multi-adapter, compression layer a due assi).

## Configurazione

Vedi [`factory.config.yaml`](factory.config.yaml):

| Parametro | Valore |
|---|---|
| Topologia | `full-stack-agents` (be/fe/db/qa) |
| Code path L5 | `./packages/app` (slug `app`, monorepo) |
| Stack mode | `guided` |
| VCS / kanban | GitHub (`soli92/soli-boy`, push-only mirror) |
| Parallel scheduler | ON |
| Code Quality Review (CQRL) | ON |
| FE Visual Oracle (v2.17) | ON — `fe_correctness.enabled: true`, Playwright in `packages/app` |
| Accessibility Testing (v2.18) | ON — `a11y.enabled: true`, agente `a11y-specialist`; richiede `axe-playwright` |
| UX/UI Review & Design (v2.18) | ON — `ux_ui.enabled: true`, agenti `ux-ui-reviewer` + `ui-designer` (tool callable via ADR-064) |
| FE Functional Oracle (EP-018) | OPT-IN — `fe_correctness.functional_oracle.enabled`; acceptance-spec in `code_quality/acceptance/`, esecutore `qa-dev` |
| Compression OUTPUT (Caveman) | ON — `conservative` |
| Compression CONTEXT (Graphify) | ON — `graphify-cloud`, target `app` |

## Adapter installati (PATTERN §12)

| Adapter | Folder | Maturity |
|---|---|---|
| claude | `.claude/` | full reference |
| cursor | `.cursor/` | full |

Lo state filesystem (`wiki/`, `management/`, `raw/`, `memory/`, `code_quality/`) è
**condiviso** fra gli adapter; ogni adapter scrive solo nel proprio folder (R.A1-R.A6).
Single-committer `wiki/` enforced globalmente (R.A3): mai invocare `wiki-keeper` da due
adapter contemporaneamente.

## Layer (PATTERN §1)

- **L1** `raw/` — input multi-sorgente (read-only, solo Sync agents).
- **L2** `wiki/` — wiki llm-style append-only (`log.md`). Single-committer (`wiki-keeper`).
- **L3** `management/` — kanban EP/US, roadmap, questions (PM).
- **L4** `design_&_architecture/` + `management/kanban/**/TSK-*.md` (Arch + TPM).
- **L5** `packages/app/` — codice (dev-agent be/fe/db/qa).
- **Side-channel**: `memory/`, `code_quality/`, `.graphify-state/` (non versionato).

## Quick start

- Stato + wave dispatch parallelo: `/run`
- Ingest PDF da `raw/`: `/sync-docs` → poi `wiki-keeper`
- Domanda al wiki: `/query <domanda>`
- Health check / heal: `/lint` · `/heal`
- Topologia / routing: `/topology`
- Consumare un TSK con dev-agent: `/dev <TSK-id>`
- Code review di un TSK done: `/review <TSK-id>` (loop bounded da `max_iterations: 3`)
- **Visual oracle su TSK FE**: `/visual-oracle <TSK-id> [--dry-run]` — render headless +
  screenshot multi-viewport/tema + critica visiva (ordering `develop → visual-oracle →
  review`; vedi [`wiki/runbooks/visual-oracle-installation.md`](wiki/runbooks/visual-oracle-installation.md))
- **Accessibility scan (v2.18)**: `/a11y <target>` — scan WCAG 2.2 AA (URL | file | dir build |
  TSK-id) via `run_a11y_scan`; regola di neutralità (`manual_checks` N≥1, non sostituisce audit
  EAA/ADA); vedi [`wiki/runbooks/accessibility-testing-runbook.md`](wiki/runbooks/accessibility-testing-runbook.md)
- **UX/UI review (v2.18)**: `/ux-ui-review <target>` — critica usabilità su rubrica anti-soggettività
  (Nielsen + dimensioni UI/flusso); ordering `develop → visual-oracle → ux-ui-review → code-review`;
  vedi [`wiki/runbooks/ux-ui-review-runbook.md`](wiki/runbooks/ux-ui-review-runbook.md)
- **UX/UI design (v2.18)**: `/ux-ui-design <brief>` — wireframe/spec/flussi/copy (no-auto-eval: passa
  sempre alla review); vedi [`wiki/runbooks/ux-ui-design-runbook.md`](wiki/runbooks/ux-ui-design-runbook.md)
- **Functional oracle (EP-018, opt-in)**: `/functional-oracle <TSK-id|app>` — *esercita* il flusso reale
  (serve app + carica fixture ROM + interazione Playwright + asserzioni domain-agnostic + verdict
  deterministico, critic LLM advisory). Acceptance-spec in
  [`code_quality/acceptance/soliboy.acceptance.yaml`](code_quality/acceptance/soliboy.acceptance.yaml);
  ordering `develop → visual-oracle → ux-ui-review/a11y → functional-oracle → code-review`.
- Pubblicare kanban su GitHub: `/kanban-publish [show|run|dry-run]`
- Premortem su epica/feature: `/premortem`
- **Compression output**: `/compression [show|set|policy|dry-run]`
- **Compression context (graph)**: `/graphify-sync app` → popola `.graphify-state/`
  (prerequisito: `graphify >= 0.8.22`, vedi [`wiki/runbooks/graphify-installation.md`](wiki/runbooks/graphify-installation.md))

## Vincoli inviolabili (estratto PATTERN §7)

- R.1 L1 read-only · R.2 zero invenzione · R.3 citazione obbligatoria · R.5 append-only
  log/gaps · R.8 scope di scrittura chiuso per ruolo · R.12 wiki single-committer ·
  R.14 VCS gate umano · R.15 cross-tool publish gate umano · R.16 CQRL `reject` = gate
  umano · R.18 **compression mai sugli artefatti persistenti, mai verso utente, mai su
  propagate-resolution**.
- Compression: R.C1 (`to_user`/`to_artifact`/`propagate_resolution` sempre off) ·
  R.G5 (`.graphify-state/` write-restricted, solo `graphify-sync`).
