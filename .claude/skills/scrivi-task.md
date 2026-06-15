---
name: scrivi-task
description: Template per un task TSK-ZZZ.md atomico, contractuale.
---
# Procedura per scrivere un task

Riferimenti: `citation-rules` (cascade: il task cita US/ADR/design).

## Path

`management/kanban/EP-XXX-<slug>/US-YYY-<slug>/TSK-ZZZ.md`

## Frontmatter (minimal, v2.11)

```yaml
---
id: TSK-ZZZ
sprint: NN
layer: be | fe | db | qa | infra
consumer: agent | human
priority: P0 | P1 | P2
estimate: XS | S | M | L
status: todo | in-progress | done
depends_on: []           # v2.11: lista TSK prerequisiti (es. [TSK-007, TSK-012]) — hard block
blocked_by: []           # v2.11: lista Q_NNN hard aperte che bloccano il TSK
code_path: []            # v2.11: lista path/glob L5 toccati (es. ["src/auth/**", "src/api/v1/login.py"])
---
```

Note:
- `story` ed `epic` deducibili dal path.
- `layer` sostituisce il vecchio `team` (deprecato in v2.7).
- `consumer` = default da `factory.config.yaml.routing.<layer>`. Override esplicito ammesso.
- Se la topologia non include un dev-agent per `<layer>` ma `consumer: agent`,
  il `wiki-lint` segnalerà incoerenza.

### Campi v2.11 — input per il parallel scheduler (PATTERN §18)

- **`depends_on: [TSK-XXX, ...]`** — TSK che DEVONO essere `status: done` prima
  che questo possa partire. Hard dependency. Lo scheduler usa questa lista per
  costruire il DAG (toposort + level grouping). **Sezione `## Dependencies` del
  body è ora derivata da questo campo, non canonica.** Se entrambi presenti,
  vince il frontmatter; `wiki-lint` segnala drift.
- **`blocked_by: [Q_NNN, ...]`** — `Q_NNN` con `Bloccante: hard` aperte che
  toccano il TSK. Equivalente al campo omonimo su US (vedi `scrivi-user-story`).
  Risolta la Q (gap chiuso da `propagate-resolution`), va rimossa.
- **`code_path: ["<glob>", ...]`** — path/glob in `<code_path>/**` che questo TSK
  prevede di toccare in scrittura. Lo scheduler li confronta fra TSK candidate
  allo stesso level: overlap di glob ≠ ∅ → non parallelizzabili (race su file).
  Lista vuota = "scope sconosciuto" → lo scheduler tratta il TSK come
  serializzante (conservativo). Esempi: `["src/auth/**"]`, `["db/migrations/0042_*.sql"]`,
  `["tests/e2e/login.spec.ts"]`. Usa glob, non path assoluti.

## Corpo

```markdown
# TSK-ZZZ — <Titolo conciso>

## Context
<US riferita, perché serve questo task>
[^src: management/kanban/EP-XXX-<slug>/US-YYY-<slug>/US-YYY.md §AC]

## Technical Specs
- **BE:** endpoint OpenAPI specifico → `POST /api/v1/foo` ([openapi_schema.yaml §paths./foo](../../../../design_&_architecture/api_specs/openapi_schema.yaml))
- **FE:** pagina/componente → `LoginPage` consuma `POST /api/v1/auth/login`
- **DB:** tabelle impattate
- **Auth:** ruoli abilitati

## Implementation Steps
1. <step 1>
2. <step 2>
3. <step 3>

## Definition of Done
- [ ] Test unitario passa
- [ ] Test integrazione passa
- [ ] Documentazione aggiornata
- [ ] Code review approvata

## Dependencies
<!-- v2.11: lista derivata dal frontmatter `depends_on:` + `blocked_by:`.
     Questa sezione è OPZIONALE e serve solo a esporre rationale umano-leggibile
     (es. "TSK-007 deve girare prima perché definisce lo schema DB").
     La verità per lo scheduler è il frontmatter. -->
- TSK-XXX — <rationale opzionale>
```

## Regole

- **Atomicità:** un task = una unità testabile. Mai "Crea modulo Login" → spezza
  in "Crea endpoint POST /auth/login" + "Crea LoginPage React".
- Cita endpoint OpenAPI o pagina FE specifica, non astratti.
- Estimate: XS=<2h, S=mezza giornata, M=1 giorno, L=2+ giorni.
- Citazioni: vedi `citation-rules` (cascade L4 → US/ADR).

## Layer FE — State Matrix nel DoD (opt-in `fe_correctness.state_matrix_inject`, v2.17)

**Trigger**: TSK con `layer: fe` **e** `factory.config.yaml.fe_correctness.state_matrix_inject:
true`. A flag `false` (default) lo skill **non inietta nulla** (identico a oggi, 0 ERROR di lint).

Quando attivo, oltre agli `## Acceptance Criteria` il TSK include il block (VERBATIM):

```
## DoD FE — stati obbligatori (selezionare quelli applicabili)
- [ ] loading state
- [ ] empty state
- [ ] error state
- [ ] success state (happy path)
- [ ] responsive: mobile (≤ 768px)
- [ ] responsive: desktop (≥ 1280px)
- [ ] dark mode / tema alternativo
- [ ] accessibilità da tastiera (tab order, focus visible)
- [ ] contenuti di lunghezza variabile (testo corto / lunghissimo / overflow)
- [ ] stato disabled / read-only (se form o interazione)
```

`## DoD FE — stati obbligatori` ≠ `## Acceptance Criteria`: gli AC descrivono comportamenti
end-to-end misurabili, gli stati FE descrivono dimensioni di completezza UI ortogonali (ogni
stato = una faccia della matrice combinatoria). Il TPM **deve** triage-are gli stati (rimuovere
i non pertinenti o marcarli `n/a`); lasciare le 10 righe intatte è un anti-pattern (materia di
Lint Check 4n, WARNING-only).

**Cross-link**: la State Matrix è input naturale del visual oracle — ogni stato selezionato →
uno screenshot da verificare con [`visual-oracle-protocol`](./visual-oracle-protocol.md).

## Layer FE — Granularity Rule (opt-in, v2.17)

> Un TSK con `layer: fe` deve avere `estimate ≤ max_estimate_hours` OPPURE coprire al massimo
> `max_states` stati selezionati. Se ENTRAMBE violate, scomporre.

L'OR è educativo: se anche **una sola** dimensione è alta, il TPM si ferma e valuta la
scomposizione. Soglie default `{max_estimate_hours: 8, max_states: 3}`, configurabili in
`factory.config.yaml.fe_correctness.granularity`. Il check meccanico è `lint-checks` Check 4n
(WARNING-only, gated da `granularity_lint`).

## Layer FE — UX/UI Design Spec (EP-008, ADR-020)

> Sezione opt-in (US-032, capability EP-008). Procedura per il **TPM** per allegare al frontmatter di
> un TSK FE il campo `ui_design_spec: <path>` quando esiste un deliverable di Design per il componente.
> Analoga alla `## Layer FE — Interaction Test Spec` di EP-005 (ADR-012): il deliverable è una specifica
> esterna che il TPM allega al TSK, non un output di runtime.

**Quando suggerirlo.** Se per il componente target del TSK FE esiste un deliverable di Design prodotto
da `/ux-ui-design` (agente `ui-designer`, US-029/030) — tipicamente in
`code_quality/reports/<TSK-id>-uxui-design.json` (+ `.md`), oppure in `code_quality/reports/_adhoc/uxui-design-<...>`
per invocazioni standalone — la skill suggerisce di valorizzare il frontmatter:

```yaml
ui_design_spec: code_quality/reports/<TSK-id>-uxui-design.json
```

**Single-writer: il TPM (ADR-020 §A/§F).** Il `ui-designer` **suggerisce** il path nel proprio output
(logging), ma NON modifica il frontmatter né il corpo del TSK: il TPM **committa** il campo in fase di
scrittura/aggiornamento del TSK. Pattern simmetrico a come il `code-reviewer` suggerisce ma il TPM
committa i campi strutturali. Evita race condition e mantiene il TPM come owner del TSK schema.

**Procedura.**
1. Verifica se esiste un deliverable Design per il componente (path `<TSK-id>-uxui-design.json` o adhoc).
2. Se sì, aggiungi `ui_design_spec: <path>` al frontmatter del TSK FE.
3. Se il deliverable è adhoc e copre più componenti/TSK, scelta del TPM: può citarlo in più TSK.
4. Opzionalmente aggiungi una sezione `## Design Reference` nel corpo del TSK con bullet al wireframe/spec.

**Cosa ne fa il fe-dev.** In Fase 4 (Develop) il fe-dev legge `ui_design_spec:` come specifica visiva di
prima classe (wireframe + `component_spec` + rationale del designer); le `assumptions[]`/`open_questions[]`
non risolte del deliverable possono diventare `open_questions` del TSK. Vedi
[`fe-dev`](../agents/fe-dev.md) §UX/UI Design spec input.

**Schema deliverable single-shot.** Il deliverable Design è **single-shot** per TSK (no iter-N, distinto
dal report Review iterativo `uxui-review-iter-<N>`): eventuali ridisegni sovrascrivono il file, il
versioning vive in git. Il path resta quindi stabile nel frontmatter.

**Backward compat.** Un TSK FE **senza** `ui_design_spec:` resta pienamente valido: **0 ERROR di lint**.
Il campo è additivo e opt-in; la sua assenza non è mai un errore (il fe-dev sviluppa dalle specifiche
esistenti — corpo TSK, State Matrix, eventuale `visual_reference:`).

## Layer FE — Functional Oracle (EP-018, ADR-065/067, v2.20)

> Sezione opt-in (EP-018, `fe_correctness.functional_oracle.enabled: true`). Campi frontmatter
> opzionali per tracciare il verdict del Functional Oracle sul TSK FE.

**Campi opzionali** (nessuna ERROR di lint se assenti):

```yaml
functional_status: pending | pass | conditional | reject  # verdict oracle (single-writer: qa-dev)
functional_acceptance_spec: code_quality/acceptance/<TSK-id>.acceptance.yaml  # path spec del TSK
```

**`functional_status`** — aggiornato esclusivamente dalla `functional-oracle-protocol` (single-writer
`qa-dev`). Analogo a `visual_status` (Visual Oracle) e `ux_ui_status` (UX/UI Review). Il TPM
**non modifica** questo campo manualmente — solo la skill può scriverlo dopo esecuzione reale.
Valori: `pending` (oracle non eseguito o in corso) | `pass` | `conditional` (pass con warning
advisory del critic) | `reject` (almeno una asserzione binaria ha fallito).

**`functional_acceptance_spec`** — path alla spec di acceptance YAML del TSK. Il file appartiene
al progetto (non al framework): lo scrive chi conosce il dominio dell'app. Schema:
`code_quality/acceptance/<TSK-id>.acceptance.yaml` (glob `acceptance_spec_glob` in config).

**Backward compat.** Assenza di entrambi i campi → no-op totale. Check 4z (`lint-checks`) è
WARNING-only sulla coerenza, mai ERROR.
