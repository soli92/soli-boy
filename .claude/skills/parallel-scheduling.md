---
name: parallel-scheduling
description: Algoritmo DAG-based per riconoscere e dispatchare operazioni parallele in modo sicuro (PATTERN §18, v2.11). Invocato dall'orchestrator.
---
# Parallel scheduling protocol (v2.11)

Riferimenti: PATTERN §18 (modello DAG, regole R.S1–R.S8), `state-scan` (input
candidates), `wiki-log-entry` (log dei wave), §5 (campi frontmatter
`depends_on` / `blocked_by` / `code_path`).

Eseguito dall'**Orchestrator** in 5 fasi: Discovery → Build DAG → Toposort &
Partition → Gate → Dispatch.

## Fase 0 — Discovery dei candidati

Input: stato corrente del repo (`/run` → `state-scan`).

- `Glob management/kanban/**/TSK-*.md` filtrato per:
  - `status: todo`
  - `consumer: agent`
  - `consumer: <layer>` agent presente in `.claude/agents/` (es. `be-dev.md` per `layer: be`)
  - `factory.config.yaml.scheduler.domains.develop: true`
- `Glob management/kanban/**/US-*.md` per il **resolve** di `depends_on TSK` cross-storia (vedi §1).
- Read `factory.config.yaml.scheduler` (default valori in PATTERN §18.5 se assente).
- Read `wiki/gaps.md` per `blocked_by Q_NNN` ancora aperte.

Output: lista candidati `V` con per ciascuno: `id`, `layer`, `priority`, `estimate`, `depends_on`, `blocked_by`, `code_path`.

## Fase 1 — Build DAG

Costruisci `G = (V, E_dep ∪ E_conf)`:

### `E_dep` (causal, oriented)

Per ogni `u ∈ V`:
- Per ogni `v_id ∈ u.depends_on`:
  - Read `management/kanban/**/<v_id>.md`
  - Se `v.status != done` → aggiungi arco `v → u`
  - Se `v.status == done` → la dipendenza è soddisfatta, **non** aggiungere arco
- Per ogni `q_id ∈ u.blocked_by`:
  - Cerca `q_id` in `management/questions.md` o `wiki/gaps.md`
  - Se aperta → aggiungi un **virtual root** `Q_NNN` con arco `Q_NNN → u` (mai resolvibile da uno scheduler → il TSK resta in coda, non eseguito)

### `E_conf` (file conflict, unoriented)

Solo per i TSK con `factory.config.yaml.scheduler.code_path_conflict ≠ off`:

```
for u, v in pairs(V):
  if u.code_path == [] or v.code_path == []:
    if empty_code_path_policy == 'serial':
      E_conf.add({u, v})    # entrambi serializzanti
    # else 'parallel': no arco
  elif glob_intersect(u.code_path, v.code_path):
    E_conf.add({u, v})
```

`glob_intersect(A, B)` = `True` se esiste un path che matcha sia un glob di `A`
sia un glob di `B`. Implementazione minimale: expand glob a regex, check
overlap su prefisso comune (es. `src/auth/**` vs `src/auth/handlers/**` →
overlap; `src/auth/**` vs `src/users/**` → no overlap).

### Validazione

- **Cycle detection** su `E_dep`: DFS con stack di visita. Se ciclo → `ABORT` con messaggio:
  ```
  ERRORE: ciclo in depends_on:
    TSK-A → TSK-B → TSK-C → TSK-A
  Risolvere a mano (rimuovere una dipendenza). /run non procede.
  ```
- **Orphan `depends_on`**: `v_id` referenziato ma file non trovato → warning, l'arco è ignorato (no blocco, ma loggato come anomalia per `wiki-lint`).

## Fase 2 — Toposort + level grouping

Algoritmo di Kahn modificato per assegnare i **level** (antichain):

```
in_degree := {v: |{e ∈ E_dep | e = (_, v)}| for v in V}
level := {}
ready := {v in V | in_degree[v] == 0}
current_level := 0

while ready not empty:
  level[v] := current_level for v in ready
  next_ready := {}
  for v in ready:
    for (v, u) in E_dep:
      in_degree[u] -= 1
      if in_degree[u] == 0:
        next_ready.add(u)
  ready := next_ready
  current_level += 1

if any v in V not in level:    # nodi orfani → c'era un ciclo
  ABORT "ciclo rilevato (post-validate)"
```

Output: `levels[i] = [v_1, v_2, ...]` (antichain al level `i`).

## Fase 3 — Partition per conflict detection

Per ogni level `L_i`, applica **graph coloring greedy** su `E_conf` ristretto a `L_i`:

```
def partition(level_nodes, E_conf):
  nodes_sorted := sort(level_nodes, key=lambda v: (-v.priority_score, v.estimate_score))
  # priority_score: P0=3, P1=2, P2=1
  # estimate_score: XS=1, S=2, M=3, L=4
  groups := []
  for v in nodes_sorted:
    placed := False
    for g in groups:
      if not any({v, u} in E_conf for u in g):
        if len(g) < max_parallel:    # R.S3
          g.append(v)
          placed = True
          break
    if not placed:
      groups.append([v])
  return groups
```

Output per level: lista di `groups`, dove ogni `group` è parallelizzabile.

## Fase 4 — Gate

Per ogni `group`:

- Se `len(group) >= scheduler.parallel_gate_threshold` (default 3):
  - Stampa il **wave plan** in chat (formato §18.6).
  - Attendi conferma esplicita `y/N`. Su `N` → ABORT (no parziali).
- Se `len(group) < threshold`:
  - Stampa il wave plan come info (no gate).

**Wave plan template**:

```
WAVE PLAN (sprint NN, sched v2.11)
====================================
Level 0 — parallel (3 of max 4):
  ▸ Group A:
    • TSK-007 [be, S, P0] code_path=src/auth/**
    • TSK-012 [db, M, P1] code_path=db/migrations/0042_*.sql
    • TSK-019 [fe, S, P0] code_path=web/src/login/**
Level 1 — serial (2 nodes, depends_on Level 0):
  ▸ TSK-008 [be, S, P0] depends_on=[TSK-007]
  ▸ TSK-013 [qa, M, P1] depends_on=[TSK-007,TSK-012,TSK-019]

VCS hand-off accodato seriale dopo ogni wave.
Procedo? [y/N]
```

## Fase 5 — Dispatch

Per ogni `level i`:
  Per ogni `group g in level[i]`:
    1. **Context compression resolve (v2.14 Fase 2, opzionale)**: se `factory.config.yaml.compression.context.enabled: true` E esiste `.graphify-state/code_paths/<target>/GRAPH_REPORT.md` per il TSK target, applica **confidence-gated dispatch** (R.G2, §20.10.1):
       - Determina il ruolo dell'agent destinatario: `executor` (dev-agent `be/fe/db/qa`), `explorer` (lead-architect, wiki-query), o `reviewer` (code-reviewer).
       - Filtra il `GRAPH_REPORT.md` per i tag confidence consentiti dalla config `compression.context.confidence_gating.<role>` (default: executor → `EXTRACTED` only; explorer → `EXTRACTED + INFERRED`; reviewer → tutto).
       - Pass il `GRAPH_REPORT.md` filtrato al posto dei file sorgente raw come context dell'`Agent(...)` tool call.
       - Se `.graphify-state/code_paths/<target>/` assente o stale > `drift_alert_days` → fallback automatico a scansione filesystem standard + log warning `compression-context-fallback target=<name> reason=<stale|missing>`.
    2. **Compression intercept (v2.14 Fase 1, opzionale)**: se `factory.config.yaml.compression.output.enabled: true`, prima del multi-tool-call invoca `caveman-protocol §Fase 2-3` per ogni payload `Agent(...)` con `channel: orchestrator_to_subagent`, `chain_depth: <depth corrente nella wave>`. Il payload compresso sostituisce quello originale nella tool call. Se `enabled: false` → no-op (skip Fase 2-3 di caveman-protocol).
    3. **Multi-tool-call** nello stesso turno: N invocazioni `Agent` parallele,
       una per ogni TSK in `g` (adapter Claude Code: subagent_type = `<layer>-dev`).
    4. Attendi che TUTTI i sub-agent del group terminino (foreground).
    5. Per ognuno:
       - Output OK → `dev-handoff` ha già aggiornato `status: done` + appendato `wiki/log.md`.
       - Output FAIL → append `wiki/log.md` entry `develop-failed TSK-ZZZ rationale=...`. Il TSK resta `status: todo`. **Non rollba** gli altri (R.S7).
    6. **Compression drift check (v2.14 Fase 1)**: se compression output attivo, invoca `caveman-protocol §Fase 4` per ogni response del sub-agent. Marker di ambiguità → fallback automatico a normal mode + log `compression-drift` (R.C5). Se `drift_count >= 3` nella sessione → switch globale a normal mode + chat warning.
    7. **VCS hand-off serializzato** (R.S8): per ogni TSK terminato con successo, invoca `vcs-handoff` **uno alla volta** in coda al group.

Quando `level i` è completo (tutti i group dispatched + VCS chiusi), passa a `level i+1`.

## Fase 6 — Log

Append a `wiki/log.md` (template `wave`):

```
## YYYY-MM-DD HH:MM — wave sprint-NN
**Levels:** 2 (0=3 parallel, 1=2 serial)
**Dispatched:** 5 TSK (4 ok, 1 failed)
**Failed:** TSK-013 (reason: vcs-handoff abortito da utente)
**Wall-clock saved:** ~estimated 60% vs serial baseline
**Compression (v2.14, se attivo):** profile=conservative, tokens_in=15.2k→7.4k, tokens_out=8.3k→3.9k, drift=0
```

Se `compression.output.enabled: true`, il `wave_report.md` companion in
`memory/episodic/` include una sezione `## Compression stats` con la matrice
`canale × (tokens_in_raw, tokens_in_compressed, tokens_out_raw, tokens_out_compressed,
ratio, drift_count)`. Vedi `caveman-protocol §Fase 5`.

E un record episodico in `memory/episodic/YYYY-MM-DD-HH-MM-wave-NN.md` con la
struttura completa del DAG (per audit + retroactive analysis).

**Token Ledger (v2.21, EP-022)** — se `analytics.token_ledger.auto_call_on_wave_close: true`:

```bash
python3 "$CLAUDE_PROJECT_DIR/.claude/tools/analytics/show-session-tokens.py" --full 2>/dev/null || true
```

Appendere l'output nel riepilogo wave in chat. Vedi [[token-ledger]].

## Regole inviolabili (R.S1–R.S8, PATTERN §18.4)

- **R.S1**: Single-committer su `wiki/log.md` e `wiki/gaps.md` — l'orchestrator
  serializza le append, mai due agent scrivono nello stesso turno.
- **R.S2**: Conflict-free su `code_path` — `partition()` lo garantisce.
- **R.S3**: Cap `max_parallel` (default 4).
- **R.S4**: Gate umano sopra `parallel_gate_threshold` (default 3).
- **R.S5**: Ciclo in `depends_on` → ABORT, no auto-fix.
- **R.S6**: Re-scheduling idempotente — DAG ricostruito da zero ogni run.
- **R.S7**: Fallimento di un sub-agent non rollba gli altri.
- **R.S8**: VCS sempre serializzato — coda di `vcs-handoff` a fine wave.

## Dominio `visual-oracle` (v2.17)

La verifica visiva ([`visual-oracle-protocol`](./visual-oracle-protocol.md)) sui TSK FE è
candidata alla wave quando `scheduler.domains.visual-oracle: true` (default `true` se
`fe_correctness.enabled: true`, altrimenti no-op).

**Inquadramento: sub-step di L2 (develop), NON un nuovo livello DAG.** Il visual oracle gira
logicamente dopo la Fase 4 di `dev-protocol` (build/typecheck verde) e prima della Fase 5
(handoff a `done`), cioè dentro L2 e prima di L3 (review). Parallelizzazione:

- **Cross-TSK → parallel**: TSK FE distinti possono essere verificati in wave (stessa logica
  di develop, cap `max_parallel`).
- **Same-TSK → serial**: gli iter dello stesso TSK (iter N+1 dopo `conditional`) sono
  serializzati — il report `<TSK-id>-visual-iter-<N>` è single-writer per TSK (analogo a
  `review` e a `visual_status`).
- **Effetto sul DAG**: non aumenta il numero di livelli; estende la durata effettiva di L2 per
  i TSK FE. Lo scheduler continua a vedere L1 → L2 (develop, ora con visual-oracle come
  sub-step) → L3 (review) → L4 (publish/sync), invariati.

## Dominio `a11y` (v2.18, EP-007)

Lo scan di accessibilità ([`accessibility-testing-protocol`](./accessibility-testing-protocol.md),
tool [`a11y-scan.sh`](../tools/a11y-scan.sh)) sui TSK FE è candidato alla wave quando
`scheduler.domains.a11y: true` (default `false`, opt-in R.P3; richiede
`factory.config.yaml.a11y.enabled: true`, altrimenti no-op). **Inquadramento: sub-step di L2
(develop) in Modalità 2 (batch post-Develop, qa-dev), oppure operazione canonica autonoma in
Modalità 3 (`/a11y`, a11y-specialist) — NON un nuovo livello DAG.** Parallelizzazione:

- **Cross-TSK → parallel**: lo scan a11y su TSK FE distinti è parallelizzabile (ogni TSK scrive
  il proprio report `code_quality/reports/<TSK-id>-a11y-iter-<N>` e il campo `a11y_status`, no
  shared state).
- **Same-TSK → serial**: gli iter dello stesso TSK sono serializzati — `a11y_status` è
  single-writer per TSK (ADR-014 §Rationale 6: scrive solo l'agente che esegue lo scan;
  fe-dev Modalità 1 ha priorità, qa-dev non sovrascrive).
- **Composizione con `visual-oracle`**: in Modalità 1 (a11y inline in visual-oracle Fase 3-bis,
  gated da `fe_correctness.checks: [axe-a11y]`) lo scan gira dentro la Visual Verification. In
  Modalità 2 a11y e `ux-ui-review` girano in parallel sullo stesso TSK FE done senza contesa
  (campi frontmatter distinti: `a11y_status` vs `ux_ui_status`).
- **Effetto sul DAG**: non aumenta i livelli; gira su qualsiasi topology (anche `plan-only`).
  Regola di neutralità invariante: il report include sempre `manual_checks` (N ≥ 1), mai
  conformità su soli `automated_findings`.

## Dominio `ux-ui-review` (v2.18, EP-008)

La review UX/UI ([`ux-ui-review-protocol`](./ux-ui-review-protocol.md), o agente `ux-ui-reviewer`
se `ux_ui.agents.reviewer: true`) sui TSK FE è candidata alla wave quando
`scheduler.domains.ux-ui-review: true` (default `false`, opt-in R.P3; richiede
`factory.config.yaml.ux_ui.enabled: true`, altrimenti no-op). **Inquadramento: sub-step di L2
(develop), NON un nuovo livello DAG** — identico a `visual-oracle` (ADR-019 §Punto 3). Gira
logicamente dopo la Fase 4-bis Visual Verification e prima della Fase 5. Parallelizzazione:

- **Cross-TSK → parallel**: review su TSK FE distinti parallelizzabile (cartella isolata
  `code_quality/reports/<TSK-id>-uxui-review-iter-<N>/`, no shared state).
- **Same-TSK → serial**: gli iter dello stesso TSK (loop bounded da `ux_ui.max_iterations`)
  sono serializzati — `ux_ui_status` e il report sono single-writer per TSK (analogo a `review`,
  `visual_status`, `a11y_status`).
- **Composizione con `visual-oracle`**: la `ux-ui-review` attende `visual_status` non-pending.
  Se `visual_status: reject` → SKIPPED (no point a revisionare un rendering rotto). Se
  `conditional` → può girare in parallel al loop visual oracle (ottimizzazione ADR-019
  §Rationale 7). Ordering: `develop → visual-oracle → ux-ui-review → code-review`.
- **Sotto-capability Design (`ux-ui-design`)**: **off-DAG** (no dominio scheduler dedicato,
  ADR-020 §C). Invocata umano-driven via `/ux-ui-design <brief>`; il deliverable diventa input
  «pre-TSK» di un TSK FE futuro tramite il campo frontmatter `ui_design_spec: <path>`
  (single-writer TPM).
- **Effetto sul DAG**: non aumenta i livelli; estende la durata effettiva di L2 per i TSK FE
  quando `ux_ui.enabled: true`.

## Dominio `functional-oracle` (v2.20, EP-018)

Il Functional Oracle ([`functional-oracle-protocol`](./functional-oracle-protocol.md), esecutore
`qa-dev` in modalità functional-oracle, fallback `fe-dev` ADR-067 §A) sui TSK FE è candidato
alla wave quando `scheduler.domains.functional-oracle: true` (abilitato automaticamente quando
`factory.config.yaml.fe_correctness.functional_oracle.enabled: true`, ADR-066). **Inquadramento:
sub-step di L2 (develop), NON un nuovo livello DAG** — analogo a `visual-oracle` e `ux-ui-review`.
Gira dopo la Fase 4-ter UX/UI Review e prima della Fase 5. Parallelizzazione:

- **Cross-app → parallel**: oracle su app distinte (code_path diversi) parallelizzabile — nessuno
  shared state tra factory diverse.
- **Same-app → serial**: gli iter dello stesso app/TSK (loop bounded da
  `fe_correctness.functional_oracle.max_iterations`) sono serializzati — `functional_status` e
  il report sono single-writer per TSK (ADR-066).
- **Composizione con `ux-ui-review`**: il functional oracle attende `ux_ui_status` non-pending
  (e `visual_status` non-pending). Ordering completo con tutti gli opt-in attivi:
  `develop → visual-oracle → ux-ui-review → functional-oracle → code-review`.
- **Verdict fail-closed**: il critic LLM è advisory sul trace — **mai** nel path pass/fail
  (ADR-065). Solo le asserzioni binarie determinano il verdict.
- **Effetto sul DAG**: non aumenta i livelli; estende la durata effettiva di L2 per i TSK FE
  quando `fe_correctness.functional_oracle.enabled: true`.

## Quando NON eseguire (short-circuit)

- `factory.config.yaml.scheduler.enabled: false` → l'orchestrator esegue il
  comportamento pre-v2.11 (suggerisce **un solo** next-step, niente DAG).
- `|V| == 1` → un solo candidato, nessun DAG da costruire, dispatch diretto.
- `topology: knowledge-only` o `plan-only` → no L5 → niente da parallelizzare
  a livello develop (ma ingest e lint paralleli restano possibili).

## Esempio di esecuzione (dry-run su sprint con 5 TSK)

Input candidates:
```
TSK-001 [be, S, P0] depends_on=[]            code_path=[src/db/**]
TSK-002 [fe, S, P0] depends_on=[]            code_path=[web/src/login/**]
TSK-003 [be, M, P0] depends_on=[TSK-001]     code_path=[src/auth/**]
TSK-004 [be, S, P1] depends_on=[TSK-001]     code_path=[src/auth/handlers/**]
TSK-005 [qa, M, P0] depends_on=[TSK-003,TSK-004,TSK-002] code_path=[tests/e2e/**]
```

E_dep:
```
TSK-001 → TSK-003
TSK-001 → TSK-004
TSK-003 → TSK-005
TSK-004 → TSK-005
TSK-002 → TSK-005
```

E_conf:
```
{TSK-003, TSK-004} (overlap src/auth/** ∩ src/auth/handlers/**)
```

Levels:
- Level 0: TSK-001, TSK-002 → no conflict → 1 group di 2 → parallel
- Level 1: TSK-003, TSK-004 → conflict → 2 group di 1 ciascuno → serial fra loro
- Level 2: TSK-005 → 1 group di 1 → solo

Plan: 4 wave (Level 0 parallel; Level 1.a; Level 1.b; Level 2).
Wall-clock saved: 1 wave eliminato dal parallelismo del Level 0.
