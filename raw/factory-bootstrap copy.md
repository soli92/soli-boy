---
description: Seed self-contained per scaffoldare una Agentic Factory llm-wiki++ v2.18. Replicabile da qualunque AI agent con file I/O su qualunque macchina/cartella. Estende v2-17 (FE Visual Oracle Integration opt-in) aggiungendo la Fase 1.sexies opt-in per l'attivazione delle capability A11y (Accessibility Testing, EP-007) e UX/UI (Review & Design, EP-008). Due capability opt-in standalone, sinergiche ma indipendenti, no-op a flag spento, niente nuova invariante §7.
argument-hint: [nome-progetto] [path-destinazione]
allowed-tools: Read, Write, Edit, Bash, Glob, TodoWrite, WebSearch, WebFetch
pattern_version: "2.18"
extends: meta-prompts/v2-17/factory-bootstrap.md
---

# Factory Bootstrap v2.18 — Self-Contained Portable Seed (A11y + UX/UI Integration)

> **Replicabilità**: questo file è il **delta seed** v2.18. Per la procedura completa
> (8 fasi: Setup → Input → Adapter selection → Compression setup → Premortem → Visual
> Oracle → Multi-repo → Templates → Scaffolding → VCS → Validation → Report) **eredita
> verbatim `meta-prompts/v2-17/factory-bootstrap.md`** (vedi `extends:` nel frontmatter),
> che a sua volta eredita v2-16 → v2-15 → v2-13. v2.18 aggiunge **una sola sezione
> nuova**: la **Fase 1.sexies** opt-in che attiva le capability A11y + UX/UI.

## §0 — Cambiamenti v2.18 vs v2.17

v2.18 **estende v2-17** (catena: v2-17 → v2-16 → v2-15 → v2-13). Eredita l'intero seed v2-17:
- multi-adapter scaffolding (v2.13, R.A1-R.A6);
- Compression Layer a due assi opt-in — OCL/Caveman + CCL/Graphify (v2.14, R.C1-R.C6 + R.G1-R.G6);
- consolidation + gate empirici opt-in deferred (v2.15);
- Premortem Integration opt-in — skill `premortem-protocol` + `/premortem` (v2.16, R.P1-R.P3);
- FE Visual Oracle Integration opt-in — skill `visual-oracle-protocol` + `oracle-precheck` + `/visual-oracle` + config `fe_correctness` (v2.17).

### Due feature nuove: A11y + UX/UI Integration (opt-in totale, standalone)

- Nuova **Fase 1.sexies** (sotto): attivazione opt-in di **due capability standalone,
  sinergiche ma indipendenti**:
  - **A11y (Accessibility Testing, EP-007)** — pre-screening WCAG 2.2 AA stack-agnostico
    via tool deterministico `run_a11y_scan` (Playwright + axe-playwright, riuso infra
    EP-005, no MCP — ADR-008) + skill `accessibility-testing-protocol` + agente opzionale
    `a11y-specialist` + comando `/a11y`. Regola di neutralità invariante (mai conformità
    su soli automated findings; `manual_checks` N ≥ 1).
  - **UX/UI (Review & Design, EP-008)** — critica strutturata di usabilità via skill
    `ux-ui-review-protocol` (rubrica anti-soggettività: 10 euristiche Nielsen + 6
    dimensioni UI + 5 dimensioni di flusso) + produzione deliverable di design via skill
    `ux-ui-design-protocol`. Agenti opzionali `ux-ui-reviewer` + `ui-designer` (separazione
    enforced: no auto-eval) + comandi `/ux-ui-review` + `/ux-ui-design`. Skill condivise
    `screenshot-capture-protocol` + `design-tokens-extraction` + `design-system-conformance-check`.
- **Nessuna nuova invariante §7** (le 18 regole restano invariate; gli invarianti
  operativi — regola di neutralità a11y, no-auto-eval ux/ui — vivono in PATTERN §3 sotto
  le operazioni canoniche, non sono framework-wide).
- **7 ADR risolti**: ADR-014 (3 modalità `run_a11y_scan`), ADR-015 (fallback
  mobile/non-web), ADR-016 (schema EP-007 + Check 4o + config + neutralità), ADR-017
  (riuso infra screenshot via skill condivisa), ADR-018 (default fallback DS 5 famiglie
  source-tagged), ADR-019 (ordering develop → visual-oracle → ux-ui-review → code-review),
  ADR-020 (schema EP-008 + `ui_design_spec` + config + Check 4p).
- Le integrazioni nei file scaffoldati esistenti (`dev-protocol` Fase 4-ter,
  `code-review-protocol` precondition nota `ux_ui_status` + 4° pass opzionale
  `accessibility`, `parallel-scheduling` domini `a11y` + `ux-ui-review`, `lint-checks`
  Check 4o + Check 4p, `visual-oracle-protocol` delega `screenshot-capture-protocol`,
  `scrivi-task` sezioni FE, `fe-dev`/`qa-dev`/`orchestrator` sezioni) sono **tutte no-op
  a flag spento** — ereditate dallo scaffold base senza rischio.
- Default scelta utente: **N** per entrambe (zero friction — una factory che non opta-in
  si comporta identica a v2.17).

> **Nota sulla natura del delta**: come v2.17, v2.18 tocca skill esistenti oltre ad
> aggiungere file nuovi. La sicurezza è garantita dal design opt-in: ogni integrazione è
> gated da `a11y.*` / `ux_ui.*` (default `false`), quindi i file scaffoldati dallo scaffold
> base **contengono già** le sezioni v2.18 ma restano inerti. L'opt-in reale di v2.18 è
> l'**attivazione** (flag + prerequisito Playwright per gli scan/render headless), non la
> copia dei file. Le due capability sono **standalone**: una factory può attivare solo
> a11y, solo UX/UI, o entrambe. Massima sinergia con entrambe attive + FE Visual Oracle
> (v2.17) attivo (Modalità 1 a11y inline a Fase 4-bis; ux-ui-reviewer delega a
> `run_a11y_scan`). Vedi `design_&_architecture/proposta-a11y-uxui-integration-v218.md`.

## §1 — How to use this seed

Identico a v2-17 §1. In più, durante l'input (Fase 1) l'agente proporrà la
**Fase 1.sexies** (attivazione A11y + UX/UI opt-in) subito dopo la
Fase 1.quinquies (FE Visual Oracle).

## §3 — Bootstrap procedure (delta)

Tutte le fasi sono **identiche a v2-17 §3**, con l'inserimento della Fase 1.sexies
tra la Fase 1.quinquies (FE Visual Oracle) e la Fase 2 (Multi-repo + coupling).

### Fase 1.sexies — Attivazione A11y + UX/UI (v2.18 opt-in)

Due prompt indipendenti (entrambi default **N**). Le due capability sono standalone:
rispondere `y`/`N` all'una non vincola l'altra.

#### 1.sexies.a — Accessibility Testing (EP-007)

```
ACCESSIBILITY TESTING (PATTERN §3 operazione Accessibility Scan, v2.18 — opt-in totale)

Vuoi attivare la capability di Accessibility Testing (a11y) nella tua factory?

Cos'è: un pre-screening WCAG 2.2 AA stack-agnostico tramite il tool deterministico
run_a11y_scan (Playwright + axe-playwright, nessun giudizio LLM), consumato dalla
skill accessibility-testing-protocol. Riusa l'infra browser headless del FE Visual
Oracle (v2.17). Tre modalità d'uso:
  (a) inline a Fase 4-bis Visual Verification del dev-protocol (fe-dev) — Modalità 1;
  (b) batch post-Develop (qa-dev) — Modalità 2;
  (c) standalone via /a11y <target> (a11y-specialist o fallback) — Modalità 3.
Produce report JSON+md in code_quality/reports/ + Lint Check 4o (WARNING-only).
Regola di neutralità invariante: mai conformità su soli automated_findings; il
report include sempre manual_checks (N >= 1). NON sostituisce un audit indipendente
per EAA / ADA / normative locali.

Prerequisito (se attivi): Playwright + axe-playwright nel project host FE
  npm i -D @playwright/test axe-playwright && npx playwright install --with-deps chromium
  Vedi: wiki/runbooks/accessibility-testing-runbook.md

Scelta [y/N]: <default N>
```

**Se `y`** — sotto-domanda agente:

```
Vuoi anche scaffoldare l'agente opzionale a11y-specialist (Modalità 3 standalone)?
  (gated da a11y.agent; il comando /a11y funziona anche senza agente, con fallback
   orchestrator — vedi orchestrator.md «A11y dispatch fallback»)

Scelta [y/N]: <default N>  →  a11y.agent: true/false
```

#### 1.sexies.b — UX/UI Review & Design (EP-008)

```
UX/UI REVIEW & DESIGN (PATTERN §3 operazioni UX/UI Review + UX/UI Design, v2.18 — opt-in)

Vuoi attivare la capability UX/UI Review & Design nella tua factory?

Cos'è: due sotto-capability complementari.
  - UX/UI Review: critica strutturata di usabilità ancorata alla rubrica
    anti-soggettività (10 euristiche Nielsen + 6 dimensioni UI visiva + 5 dimensioni
    di flusso UX). Ogni finding cita un rubric_ref. Delega l'accessibilità a
    run_a11y_scan (EP-007) se attiva; altrimenti i finding a11y → open_questions.
  - UX/UI Design: produzione di deliverable di design (wireframe, component spec,
    user flow, copy). Invariante no-auto-eval: l'output del designer va SEMPRE alla
    UX/UI Review prima di essere considerato pronto. Loop bounded da ux_ui.max_iterations.
Ordering pipeline FE (tutti gli opt-in attivi):
    develop → visual-oracle → ux-ui-review → code-review
Produce report JSON+md in code_quality/reports/ + Lint Check 4p (WARNING-only).

Prerequisito (se attivi la Review): Playwright nel project host FE (riuso v2.17,
  per screenshot-capture-protocol). La Design sotto-capability è off-DAG e
  umano-driven (handoff a fe-dev via frontmatter ui_design_spec:, TPM-only).
  Vedi: wiki/runbooks/ux-ui-review-runbook.md + wiki/runbooks/ux-ui-design-runbook.md

Scelta [y/N]: <default N>
```

**Se `y`** — sotto-domande agenti (uno per ciascuno, separazione enforced):

```
Vuoi scaffoldare l'agente opzionale ux-ui-reviewer? [y/N] <default N>  → ux_ui.agents.reviewer
Vuoi scaffoldare l'agente opzionale ui-designer?    [y/N] <default N>  → ux_ui.agents.designer
  (i due agenti sono distinti per enforcement del vincolo no-auto-eval: il designer
   non valuta mai il proprio output; le skill /ux-ui-review e /ux-ui-design funzionano
   anche senza agenti dedicati — vedi orchestrator.md «UX/UI dispatch policy»)
```

#### Se `N` (default) a una o entrambe

- il bootstrap procede invariato. I file v2.18 della/e capability non attivata/e
  (skill `accessibility-testing-protocol`, `ux-ui-review-protocol`,
  `ux-ui-design-protocol`, `screenshot-capture-protocol`, `design-tokens-extraction`,
  `design-system-conformance-check`, tool `a11y-scan`, comandi `/a11y`,
  `/ux-ui-review`, `/ux-ui-design`, agenti `a11y-specialist`, `ux-ui-reviewer`,
  `ui-designer`) e le sezioni nei file esistenti sono **comunque scaffoldati** dallo
  scaffold base, ma **inerti** (i flag `a11y.*` e/o `ux_ui.*` restano `false`);
- **nessun edit a `factory.config.yaml`**: i blocchi `a11y:` e `ux_ui:` sono già
  presenti come template con tutti i flag `false` (vedi §Templates ereditata);
- la factory si comporta identica a v2.17.

#### Se `y` — guida all'attivazione (non copiare file: già presenti)

1. **Verifica i file scaffoldati** (devono esistere dallo scaffold base):

   | File (adapter `.claude/`) | Capability | Ruolo |
   |---|---|---|
   | `.claude/tools/a11y-scan.{ts,js}` (o snippet inline) | a11y | tool deterministico `run_a11y_scan` |
   | `.claude/skills/accessibility-testing-protocol.md` | a11y | skill 5 step + fallback mobile/non-web + auth |
   | `.claude/agents/a11y-specialist.md` (gated) | a11y | agente opzionale Modalità 3 |
   | `.claude/commands/a11y.md` | a11y | comando standalone `/a11y <target>` |
   | `.claude/skills/screenshot-capture-protocol.md` | shared | screenshot condivisa visual-oracle ↔ ux-ui |
   | `.claude/skills/design-tokens-extraction.md` | ux_ui | cascata DS path → CSS → figma → defaults |
   | `.claude/skills/design-system-conformance-check.md` | ux_ui | comparison deterministico (no LLM) |
   | `.claude/skills/ux-ui-review-protocol.md` | ux_ui | review rubrica 3 assi + delega a11y |
   | `.claude/skills/ux-ui-design-protocol.md` | ux_ui | design 6 step + handoff obbligatorio review |
   | `.claude/agents/ux-ui-reviewer.md` (gated) | ux_ui | agente opzionale review |
   | `.claude/agents/ui-designer.md` (gated) | ux_ui | agente opzionale design (no auto-eval) |
   | `.claude/commands/ux-ui-review.md` | ux_ui | comando `/ux-ui-review <target>` |
   | `.claude/commands/ux-ui-design.md` | ux_ui | comando `/ux-ui-design <brief>` |
   | `wiki/runbooks/accessibility-testing-runbook.md` | a11y | setup + CI integration |
   | `wiki/runbooks/ux-ui-review-runbook.md` | ux_ui | uso review |
   | `wiki/runbooks/ux-ui-design-runbook.md` | ux_ui | uso design |

2. **Attiva in `factory.config.yaml`** (default tutti `false` → scegli cosa accendere):

   **Blocco `a11y:` (EP-007, ADR-016)** — accendi solo se hai risposto `y` a 1.sexies.a:

   ```yaml
   a11y:
     enabled: true                   # master switch
     agent: false                    # gating a11y-specialist (Modalità 3)
     standard: "wcag22aa"
     severity_threshold: critical    # critical|major|minor|none
     required_on_fe_done: false      # → Lint Check 4o WARNING
     fail_ci_on: critical            # critical|critical,major|any|none
     include_interactive: false
     fallback_non_web: snippet-inline # ADR-015
   ```

   **Blocco `ux_ui:` (EP-008, ADR-020)** — accendi solo se hai risposto `y` a 1.sexies.b:

   ```yaml
   ux_ui:
     enabled: true
     max_iterations: 3               # bound loop designer ↔ reviewer
     rubric_strict: true             # finding senza rubric_ref → fail-loud
     design_system_path: ""          # cascata step 1 (ADR-018)
     default_viewports:
       - { name: mobile,  width: 375  }
       - { name: desktop, width: 1280 }
     agents:
       reviewer: false
       designer: false
     required_on_fe_done: false      # → Lint Check 4p WARNING
     delegate_a11y_to_ep007: true    # se true, ux-ui-reviewer invoca run_a11y_scan
   ```

   **Estensione `scheduler.domains`** (default `false`; valgono solo se la rispettiva
   capability è `enabled: true`):

   ```yaml
   scheduler:
     domains:
       # ... domini esistenti ...
       visual-oracle: false          # v2.17 esistente
       a11y: false                   # v2.18 NEW (ADR-016)
       ux-ui-review: false           # v2.18 NEW (ADR-020)
   ```

   **Estensione opzionale `code_quality.passes`** (4° pass CQRL, ADR-016 §H —
   indipendente dal dominio scheduler `a11y`: un derivatore può volere a11y solo nel CQRL):

   ```yaml
   code_quality:
     passes:
       idiomaticity: true
       design: true
       robustness: true
       accessibility: false          # v2.18 NEW — 4° pass opzionale (invoca run_a11y_scan)
   ```

3. **Installa Playwright (+ axe-playwright per a11y)** nel/i `code_path` FE (vedi
   runbook). Fail-loud se assente: le skill stoppano con messaggio azionabile,
   **niente degrado silenzioso**.

> **Nota ordering** (con entrambi gli opt-in v2.18 + Visual Oracle v2.17 attivi): la
> sequenza canonica per un TSK FE è `develop → visual-oracle → ux-ui-review → code-review`
> (ADR-019). Precondition Fase 0 di `code-review-protocol`:
> - `visual_status: pass` → **hard ABORT** se assente (ADR-013, v2.17);
> - `ux_ui_status in [pass, skip]` → **nota informativa, no ABORT** (ADR-019): la review
>   UX è additive value; lo skip esplicito (`ux_ui_status: skip` + `ux_ui_skip_reason`,
>   TPM-only) è scelta legittima.
> I domini scheduler `a11y` e `ux-ui-review` sono sub-step di L2 (develop), non livelli
> DAG separati; antichain conflict-free (side-channel + campi frontmatter distinti).
> Il single-writer logico vale per `a11y_status` (agente che esegue lo scan) e
> `ux_ui_status` (agente reviewer); `ui_design_spec`/`*_skip_reason` sono TPM-only.

Cross-link multi-adapter: per Cursor/Aider/OpenAI/Gemini il porting di skill + comandi +
tool `run_a11y_scan` + runner Playwright è un gap noto non-bloccante (vedi `wiki/gaps.md`);
v2.18 scaffolda i file nell'adapter `.claude/`.

## §5 — Self-test (delta)

Eredita i 35+3+4 check di v2-17 §5. Aggiungi check v2.18 (sempre, anche a flag spento — i
file sono scaffoldati comunque):

- [ ] `.claude/skills/accessibility-testing-protocol.md` esiste nella factory derivata.
- [ ] `.claude/tools/a11y-scan.*` (o snippet inline `run_a11y_scan`) esiste.
- [ ] `.claude/commands/a11y.md` esiste.
- [ ] `.claude/skills/ux-ui-review-protocol.md` esiste.
- [ ] `.claude/skills/ux-ui-design-protocol.md` esiste.
- [ ] `.claude/skills/screenshot-capture-protocol.md` esiste (condivisa visual-oracle ↔ ux-ui).
- [ ] `.claude/commands/ux-ui-review.md` e `.claude/commands/ux-ui-design.md` esistono.
- [ ] `factory.config.yaml` ha i blocchi `a11y:` e `ux_ui:` con tutti i flag `false` (default).
- [ ] `factory.config.yaml.scheduler.domains` ha `a11y: false` e `ux-ui-review: false`.
- [ ] `lint-checks` espone Check 4o (a11y) e Check 4p (ux/ui), WARNING-only.

Se l'utente ha scelto `y` a **1.sexies.a** (a11y), aggiungi:

- [ ] `factory.config.yaml.a11y.enabled: true` (+ `scheduler.domains.a11y: true` se usato in Develop).
- [ ] Se `a11y.agent: true` → `.claude/agents/a11y-specialist.md` referenziato nel routing.
- [ ] Playwright + axe-playwright disponibili nel project host FE, oppure prerequisito
      documentato fail-loud (mai silent fallback).

Se l'utente ha scelto `y` a **1.sexies.b** (ux_ui), aggiungi:

- [ ] `factory.config.yaml.ux_ui.enabled: true` (+ `scheduler.domains.ux-ui-review: true` se usato in Develop).
- [ ] Se `ux_ui.agents.reviewer: true` → `.claude/agents/ux-ui-reviewer.md` referenziato.
- [ ] Se `ux_ui.agents.designer: true` → `.claude/agents/ui-designer.md` referenziato.
- [ ] Vincolo no-auto-eval verificabile: ui-designer non valuta il proprio output
      (handoff obbligatorio a ux-ui-reviewer).

Backward compat (R: opt-in totale): a flag spento il self-test v2-17 deve restare
identico — le integrazioni v2.18 sono no-op.

## §6 — Note di portabilità

Identiche a v2-17 §6. Aggiunta: le capability A11y e UX/UI sono provider-agnostic a
livello di orchestrazione (critic/designer via capability nativa dell'LLM ospitante; i
file scaffoldati sono Markdown puri; `run_a11y_scan` è uno script deterministico). L'unica
dipendenza ambientale è **Playwright** (+ `axe-playwright` per gli scan a11y), richiesta
solo ad attivazione, fail-loud se assente — non un prerequisito del bootstrap. La
sotto-capability UX/UI Design è off-DAG e non richiede Playwright (render testuale di
fallback se headless assente).

## Vincoli inviolabili (delta v2.18)

Oltre ai vincoli ereditati da v2-17 (incl. single-writer `visual_status`, R.P1-R.P3,
R.C*, R.G*, R.A*):
- **Nessuna nuova invariante §7** — A11y + UX/UI non aggiungono regole inviolabili
  framework-wide (le 18 restano invariate). Gli invarianti operativi vivono in PATTERN §3:
  - **Regola di neutralità a11y** — mai dichiarare conformità sulla sola base di
    `automated_findings`; il report include sempre `manual_checks` con N ≥ 1 (default
    injection se calcolato vuoto). Pre-screening interno, non audit indipendente.
  - **No-auto-eval ux/ui** — l'output dell'`ui-designer` va sempre alla `UX/UI Review`
    prima di essere considerato pronto; designer e reviewer sono agenti distinti.
  - **Ogni finding cita un `rubric_ref`** (Nielsen 1-10 / dimensioni UI / dimensioni
    flusso / regola DS); `rubric_strict: true` → fail-loud, `false` → WARNING.
- **Single-writer logico** — `a11y_status` scritto solo dall'agente che esegue lo scan
  (a11y-specialist / qa-dev / fe-dev); `ux_ui_status` solo dall'agente reviewer;
  `ui_design_spec`, `a11y_skip_reason`, `ux_ui_skip_reason` sono **TPM-only**.
- **Opt-in totale + standalone** — factory con `a11y.*` e `ux_ui.*` tutti `false` =
  identica a v2.17; le due capability sono indipendenti (attiva solo una, l'altra, o
  entrambe); nessun trigger automatico; fail-loud sul prerequisito Playwright (mai silent
  fallback).
