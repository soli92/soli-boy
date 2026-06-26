---
name: dev-handoff
description: Entry per wiki/log.md a chiusura di un TSK consumato da dev-agent (operazione Develop, PATTERN §3).
---
# Procedura — handoff dev-agent → wiki/log.md

Append-only su `wiki/log.md` quando un dev-agent completa un TSK
(status `in-progress` → `done`).

## Formato entry

```markdown
## YYYY-MM-DD HH:MM — develop TSK-ZZZ
**Agente:** <be-dev|fe-dev|db-dev|qa-dev>
**TSK:** [[../management/kanban/EP-XXX-<slug>/US-YYY-<slug>/TSK-ZZZ]]
**Layer:** <be|fe|db|qa|infra>
**Code path:** <code_path da factory.config.yaml — relativo o assoluto>
**Files touched:** <count> (lista compatta solo se ≤ 5; altrimenti "vedi commit")
**Commit:** <hash short se code_path è git tracciato; oppure "n/a">
**DoD:** <pass | partial — descrivi> 
**Note:** <free-form, max 2-3 righe; segnala blocker non-bloccanti rilevati>
```

## Esempi

### Caso normale (DoD pass, code_path interno al repo)

```markdown
## 2026-05-20 14:32 — develop TSK-042
**Agente:** be-dev
**TSK:** [[../management/kanban/EP-003-auth/US-012-login/TSK-042]]
**Layer:** be
**Code path:** ./src/
**Files touched:** 3 (src/auth/login.py, src/auth/router.py, src/tests/test_login.py)
**Commit:** a1b2c3d
**DoD:** pass
**Note:** Implementato OIDC verbatim per coerenza con raw/tech_stack.md.
```

### Caso code_path esterno

```markdown
## 2026-05-20 16:10 — develop TSK-043
**Agente:** fe-dev
**TSK:** [[../management/kanban/EP-003-auth/US-012-login/TSK-043]]
**Layer:** fe
**Code path:** /Users/me/Repos/customer-portal/
**Files touched:** vedi commit
**Commit:** e4f5g6h (su repo esterno customer-portal)
**DoD:** pass
**Note:** —
```

### Caso DoD parziale (blocker)

```markdown
## 2026-05-20 18:00 — develop TSK-044 (PARTIAL)
**Agente:** db-dev
**TSK:** [[../management/kanban/EP-003-auth/US-012-login/TSK-044]]
**Layer:** db
**Code path:** ./src/
**Files touched:** 1 (migrations/004_add_session_table.sql)
**Commit:** —
**DoD:** partial — test integration non disponibile (db test fixture mancante)
**Note:** Status TSK resta `in-progress`. Apro gap "missing-db-test-fixture" in wiki/gaps.md.
```

## Regole

- **Append-only**: mai editare entry passate (PATTERN §7 r.5).
- **Una entry per TSK chiuso**. Se serve correggere, append nuova entry con marker
  `## YYYY-MM-DD HH:MM — develop TSK-ZZZ (correction)`.
- **Mai citare il codice prodotto direttamente in wiki/log.md** (rumore). Cita
  TSK; chi vuole il codice apre il commit / il file.
- **Coerenza con `dev-protocol`**: l'entry si scrive SOLO se `status: done` o
  `status: in-progress (partial)`. Mai per TSK in fase di gate.

## Cross-reference

- Cita: `wiki-log-entry` (formato generale log entries)
- Invocata da: `dev-protocol` (Fase 5)

---

## Suggerimento post-esecuzione (EP-033, v2.24)

> **Trigger**: il dev-agent esegue questa sezione al termine di ogni TSK, immediatamente
> prima di terminare l'handoff. Se il layer del TSK non ha regole definite nella tabella
> sotto → no-op silenzioso; la sezione non compare nell'output.

### Dati letti

1. **Frontmatter TSK** (gia' in contesto): campo `layer` e path/id della US di appartenenza.
2. **`factory.config.yaml`**: flag opt-in capability:
   - `a11y.enabled`
   - `ux_ui.enabled`
   - `fe_correctness.visual_oracle.enabled`
   - `code_quality.enabled`
3. **`wiki/log.md`**: entry recenti sulla stessa US — per deduplication (non suggerire
   una capability gia' registrata nella sessione corrente per la stessa US).

### Regole per layer

| Layer | Suggerimenti (se comando installato + non gia' eseguito per questa US) |
|---|---|
| fe | `/a11y` (se `a11y.enabled: true`), `/ux-ui-review` (se `ux_ui.enabled: true`), `/visual-oracle` (se `fe_correctness.visual_oracle.enabled: true`) |
| be | `/review` (focus robustezza) |
| db | `/review` (focus robustezza); nota sulla backup strategy se il TSK include migration DDL |
| qa | suggerimento `flakiness-detection-protocol` se il TSK include test asincroni rilevati nel contesto |
| docs | `/lint` per verifica integrazione wiki |

### Gate installazione

Prima di emettere ogni suggerimento, il dev-agent verifica che il file
`.claude/commands/<comando>.md` esista nel repo corrente. Se il file non esiste
→ suggerimento soppresso silenziosamente (nessun WARNING, nessun output aggiuntivo).

Esempio: se `a11y.enabled: true` ma `.claude/commands/a11y.md` non esiste,
il suggerimento `/a11y` e' soppresso.

### Deduplication

Il dev-agent legge le entry recenti di `wiki/log.md` relative alla US corrente
(ricerca per id US nel testo delle entry). Se una capability e' gia' registrata come
eseguita per quella US nella sessione corrente → suggerimento soppresso.

Questo evita di suggerire due volte la stessa cosa sulla stessa US in piu' TSK
consecutivi.

### Formato output (condizionale)

La sezione `## Suggerimento post-esecuzione` appare nell'output dell'handoff
**solo se** almeno un suggerimento supera tutti i gate (installazione + deduplication).

Se 0 suggerimenti rilevanti → la sezione non compare. Comportamento invariato vs v2.23.

Formato (max 3 suggerimenti; se >3 capability rilevanti, priorita' alle capability
gia' installate — always-on prima di opt-in):

```
## Suggerimento post-esecuzione

TSK <LAYER> completato. Potresti considerare:
- `/<comando>` — <motivazione breve, max 1 riga, specifica per il layer>.
- `/<comando>` — <motivazione breve>.
```

Esempio per layer `fe`:

```
## Suggerimento post-esecuzione

TSK FE completato. Potresti considerare:
- `/a11y` — verifica accessibilita' WCAG 2.2 AA sui componenti appena prodotti.
- `/ux-ui-review` — review UX/UI se sono state introdotte nuove interfacce utente.
```

### Tono

Sempre "Potresti considerare", "E' disponibile" — mai imperativo ("Devi", "E' richiesto").
L'handoff e' uno strumento di chiusura, non un gate bloccante.

### Backward compat

Factory senza le capability suggerite (flag spenti, comandi non installati) → tutti
i gate falliscono silenziosamente → nessuna sezione `## Suggerimento post-esecuzione`
nell'output. Comportamento identico a v2.23 (R.P3).

Cross-link: EP-033 | `semantic-drift-scan-protocol` | `orchestrator.md §Fase 6`.
