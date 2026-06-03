---
name: oracle-precheck
description: Skill interna — gate deterministico pre-dispatch per TSK FE. Verifica 4 condizioni (a)-(d) OR-aggregate (no LLM runtime) e ritorna {passed, satisfied_by, message}. Invocata dall'orchestrator solo con fe_correctness.dispatch_gate: true.
---
# Skill — Oracle Pre-Check

Gate **deterministico** (grep / pattern matching, **no LLM runtime**) che attesta la presenza
di **almeno un** oracolo per un TSK `layer: fe` prima del dispatch. Skill interna invocata
dall'orchestrator (sezione «Oracle Pre-Check FE»). Verifica tutte e 4 le condizioni (a)-(d).

## Trigger

Invocata dall'orchestrator **se e solo se** entrambe vere:

1. `factory.config.yaml.fe_correctness.dispatch_gate: true`, **AND**
2. il TSK target ha `layer: fe`.

Input: il `TSK-id`. La skill legge frontmatter + body + `factory.config.yaml` + presenza
file su filesystem. Se una delle due condizioni di trigger è falsa → la skill non viene
invocata (vedi Backward compat).

## 4 condizioni (a)-(d) — OR aggregato, short-circuit ordinato

Basta soddisfarne **una** perché `passed: true`. Valutazione (a)→(b)→(c)→(d), short-circuit
al primo match (determina `satisfied_by`).

- **(a)** `fe_correctness.enabled: true` **AND** `.claude/skills/visual-oracle-protocol.md`
  presente sul filesystem. → `satisfied_by: "cond:a"`.
- **(b)** Body del TSK contiene header H2 esatto `## DoD FE — stati obbligatori` con **almeno
  una** riga checkbox checked (`^\s*-\s+\[x\]\s+`, case-insensitive). → `"cond:b"`.
- **(c)** Frontmatter `interaction_test_spec:` valorizzato (non assente/vuoto/null).
  → `"cond:c"`.
- **(d)** Criterio visivo misurabile via **4 segnali OR**, short-circuit 1→4:
  1. wikilink `wiki/concepts/design-token*` | `wiki/entities/*` | `wiki/sources/*figma*`
     → `signal:1=wikilink-design-token`;
  2. path `raw/images/*-figma-*-frame-*.md` nel body → `signal:2=figma-frame-path`;
  3. header H2 `## Visual Acceptance` o `## Design Reference` → `signal:3=visual-acceptance-section`;
  4. frontmatter `interaction_test_spec:` o `visual_reference:` valorizzato
     → `signal:4=frontmatter-visual-field`.
  → `satisfied_by: "cond:d, signal:N=desc"`.

## Schema output

Ritorna sempre un singolo JSON:

```json
{ "passed": true|false, "satisfied_by": "cond:a"|"cond:b"|"cond:c"|"cond:d, signal:N=desc"|null, "message": "<stringa>" }
```

Lato orchestrator: `passed: true` → dispatch fe-dev; `passed: false` → **fail-loud**, mostra
`message`, non dispatchare.

## Messaggio di blocco (verbatim quando `passed: false`)

```
Nessuna delle 4 condizioni (a)-(d) soddisfatta per <TSK-id> (layer: fe). Aggiungi un oracolo in uno dei 4 modi:
  (a) Abilita fe_correctness.enabled: true in factory.config.yaml (richiede .claude/skills/visual-oracle-protocol.md presente).
  (b) Aggiungi al TSK la sezione "## DoD FE — stati obbligatori" con almeno una riga checkata "- [x]".
  (c) Valorizza il frontmatter interaction_test_spec: <path al test Playwright>.
  (d) Aggiungi un criterio visivo misurabile: wikilink a wiki/concepts/design-token* | wiki/entities/<componente> | wiki/sources/*figma*, oppure un path raw/images/*-figma-*-frame-*.md, oppure una sezione "## Visual Acceptance" / "## Design Reference", oppure il frontmatter visual_reference: valorizzato.
```

## Logging

Ogni invocazione → **una riga append-only** in `memory/episodic/oracle-gate.md` (lazy-create
con intestazione se assente). Formato:

```
YYYY-MM-DD | TSK-id | passed|blocked (cond:X, signal:N=desc) | message
```

Abilita telemetria/calibrazione (segnale mai usato → deprecation; segnale dominante →
promozione a condizione).

## Backward compat

Con `fe_correctness.dispatch_gate: false` (**default**) la skill **non viene mai invocata**
→ comportamento identico a v2.16. Idem se il blocco `fe_correctness` è assente. Nessun campo
frontmatter nuovo reso obbligatorio. Skill puramente additiva.

## Non in scope

- **Eseguire** il visual oracle (render/screenshot/critic) → `visual-oracle-protocol`.
- **Dispatchare** il fe-dev → decide l'orchestrator.
- **Modificare** TSK o config → read-only; unico side-effect = append a `oracle-gate.md`.
- **LLM judgment** → euristica interamente deterministica, ripetibile, auditabile.

[^src: raw/factory-bootstrap.md §1.quinquies] [^src: PATTERN.md §3]
