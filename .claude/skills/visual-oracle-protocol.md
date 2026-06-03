---
name: visual-oracle-protocol
description: Loop di verifica visiva per TSK FE — 5 fasi (Bootstrap → Render → Screenshot → Critica → Diff+Loop). Istanza del pattern evaluator-optimizer. Opt-in via fe_correctness.enabled.
---
# Protocollo Visual Oracle — loop di verifica visiva per TSK FE

Loop chiuso di verifica del rendering per TSK FE: renderizza il componente in un browser
headless (Playwright), cattura screenshot su una matrice viewport × tema, lascia che il
critic LLM multimodale confronti il rendering con la specifica del TSK e produca difetti
azionabili, poi itera bounded fino a convergenza. È una **variante opzionale di Develop FE**
(PATTERN §3 «Develop» — «Visual Verification»), attivata solo da
`factory.config.yaml.fe_correctness.enabled: true`. A flag spento la skill è **no-op**
(backward compat totale, opt-in — vedi `raw/factory-bootstrap.md` §1.quinquies).

**Single-writer** del campo frontmatter `visual_status:` del TSK (analogo a `review_status`
per CQRL): nessun altro ruolo lo scrive a runtime. Ordering nel pipeline:
**develop → visual-oracle → review**.

## Prerequisiti

- `factory.config.yaml.fe_correctness.enabled: true` (master gate — STOP no-op altrimenti).
- TSK target valido con `layer: fe`.
- Playwright disponibile nel project host (vedi Fase 1, fail-loud altrimenti). In soli-boy
  è già presente in `packages/app` (`@playwright/test`, `playwright.config.ts`).
- `code_path` del TSK risolvibile (`code_path:` legacy o `target:` → entry in `code_paths`).

## Costanti

```
MAX_ITERATIONS = fe_correctness.max_iterations   # bound loop conditional (default 3, analogo R.Q4 CQRL)
REPORTS_DIR    = "code_quality/reports"          # side-channel riusato (slug `visual`)
RUNNER_DIR     = ".factory-runners"              # script Bash generati, gitignored
```

---

## Fase 1 — Bootstrap

**Input**: `TSK-id`, `factory.config.yaml`.

1. Read `fe_correctness`. Se `enabled: false` → ABORT pulito, log a chat «Visual oracle
   disabilitato; abilitare con `fe_correctness.enabled: true`».
2. Read TSK target: frontmatter (`id`, `layer`, `code_path`/`target`, `visual_status`,
   `interaction_test_spec`, `visual_reference`) + body.
3. Verifica `TSK.layer == fe`. Se non FE → STOP no-op (trigger fallito).
4. Verifica Playwright via Bash: `npx playwright --version`. Se exit `!= 0` → **STOP
   fail-loud** con messaggio verbatim:

   > Visual oracle richiede Playwright. Eseguire: `npm i -D @playwright/test && npx playwright install --with-deps chromium`. Vedi runbook `wiki/runbooks/visual-oracle-installation.md`.

   Nessun degrado silenzioso a «solo critic senza screenshot».
5. Risolve `code_path` dal frontmatter TSK.
6. Calcola `current_iter`: `visual_status` assente/`pending` → `N = 1`; `conditional`
   (loop in corso) → `N = <ultimo iter> + 1`.
7. Crea `code_quality/reports/<TSK-id>-visual-iter-<N>/`.

**Completamento**: `npx playwright --version` exit 0 **AND** cartella artefatti creata.

## Fase 2 — Render Headless

1. Genera uno **script runner Bash** in `.factory-runners/<TSK-id>-visual-iter-<N>.sh`
   (cartella gitignored). Lo script invoca Playwright via Bash, **non** un MCP tool.
2. Avvia il dev-server (o serve il bundle esistente) e naviga alla pagina/componente target.
3. **Fail-loud** se il browser headless non è avviabile: STOP citando il comando di install
   della Fase 1. Nessun fallback silenzioso.

**Completamento**: pagina target renderizza senza errori di navigazione.

## Fase 3 — Screenshot Multi-Viewport/Tema

1. Costruisce la matrice cartesiana `viewports × themes`. Default:
   `[{mobile,375},{desktop,1280}] × [light,dark]` → 4 combinazioni.
2. Override da `fe_correctness.viewports`/`themes` se valorizzati (N × M).
3. Per ogni cella: `page.setViewportSize(...)` + `page.emulateMedia({colorScheme})` +
   `page.screenshot(...)`.
4. Naming: `<viewport>-<theme>.png` (es. `mobile-light.png`).

**Completamento**: esistono `|viewports| × |themes|` PNG nella cartella artefatti.

## Fase 3-bis — Structured Checks (opt-in)

**Gate**: `fe_correctness.checks: [<id>, ...]`. Lista vuota (default) → **fase skip**
(backward compat, i tre check riportano `status: skip`). Id canonici:
`visual-regression`, `axe-a11y`, `interaction-test`. Fail-loud verbatim se un check è
configurato ma il tool è assente: «Check `<id>` richiede `<tool>`; vedi runbook».

- **`visual-regression`**: diff pixel vs baseline in `…-visual-baseline/`; baseline assente
  al primo run → auto-crea (fail-loud documentato).
- **`axe-a11y`**: `axe-core` iniettato da Playwright nella pagina, scan a11y.
- **`interaction-test`**: esegue il file Playwright indicato da `interaction_test_spec:`
  (frontmatter TSK) sullo stesso runtime della Fase 2.

**Verdict aggregato**: qualsiasi check binario `fail` → `verdict: reject` automatico
(oracoli binari deterministici, niente critic); tutti `pass`/`skip` → procede a Fase 4.

## Fase 4 — Critica Visiva

1. Il critic è lo **stesso `fe-dev`** in passata di review multimodale (non un sub-agent,
   non `qa-dev`): sub-skill inline, il fe-dev passa da producer a critic.
2. Legge i PNG via **Read tool** (multimodalità nativa, nessun MCP custom).
3. Prompt critic (verbatim): *«Confronta il rendering con la specifica del TSK e produce una
   lista di difetti azionabili.»* Confronta ogni PNG con (a) body/Technical Specs del TSK,
   (b) `visual_reference:` se presente.
4. Produce `critic_findings` (lista difetti, vuota `[]` se nessuno).

**Completamento**: lista difetti prodotta (anche vuota).

## Fase 5 — Diff Azionabile + Loop bounded

Produce l'output strutturato (5 campi per defect: `description`, `viewport`, `theme`,
`severity` ∈ {major|minor|trivial}, `fix_hint`).

### Routing verdict → azione

| `verdict` | `visual_status` | `next_action` | Comportamento |
|---|---|---|---|
| `pass` | `pass` | `done` | TSK transita a `status: done`; pronto per review. |
| `conditional` | `conditional` | `loop` | Ri-dispatch al `fe-dev` con la lista difetti; **bounded** da `MAX_ITERATIONS`. |
| `reject` | `reject` | `escalate-human` | **Gate umano**; TSK resta `in-progress`; difetto strutturale, no auto-loop. |

**Bound**: se dopo `MAX_ITERATIONS` il verdict è ancora `conditional` → fail-loud + gate
umano: forza `verdict: reject`, `visual_status: reject`, `next_action: escalate-human`.
Coerente con loop exhausted di CQRL (PATTERN §7 r.16: `reject` = gate umano).

**Output**:
- Write `code_quality/reports/<TSK-id>-visual-iter-<N>.json` (schema sotto).
- Write `code_quality/reports/<TSK-id>-visual-iter-<N>.md` (digest umano: verdict + tabella
  difetti + screenshot + loop status).
- Edit frontmatter TSK: scrive **solo** `visual_status:` (single-writer).
- Append a `wiki/log.md` (marker `visual-oracle TSK-ZZZ iter-N → <verdict>`).

### Schema Report (JSON)

```json
{
  "tsk_id": "TSK-NNN",
  "iter": 1,
  "verdict": "pass|conditional|reject",
  "screenshots": [{ "viewport": "mobile", "theme": "light", "path": "...", "bytes": 0 }],
  "checks": {
    "visual_regression": { "status": "pass|fail|skip", "diff_pixels": 0, "baseline_path": "..." },
    "axe_a11y": { "status": "pass|fail|skip", "violations": [] },
    "interaction_test": { "status": "pass|fail|skip", "scenarios": [] }
  },
  "critic_findings": [
    { "description": "...", "viewport": "desktop", "theme": "light", "severity": "major|minor|trivial", "fix_hint": "..." }
  ],
  "next_action": "done|loop|escalate-human"
}
```

Campi obbligatori: `tsk_id`, `iter`, `verdict`, `next_action`. Lo slug `visual` distingue
dagli iter CQRL (`<TSK-id>-iter-<N>`); stesso side-channel `code_quality/reports/`.

## Pattern — evaluator-optimizer

Istanza esplicita di `evaluator-optimizer`, stessa famiglia di
[`code-review-protocol`](./code-review-protocol.md) (CQRL, PATTERN §19). Differenza:
qui producer ed evaluator sono lo **stesso** agente (`fe-dev`), perché il critic visivo
richiede la stessa conoscenza di dominio del producer. Ordering: develop → visual-oracle →
review (il rendering è più fondamentale del codice).

[^src: raw/factory-bootstrap.md §1.quinquies] [^src: PATTERN.md §3]
