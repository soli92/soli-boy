# Code Review — TSK-096 iter-1

**TSK:** TSK-096 — Fix useMemo deps stale videoPort/themePort + selectAdapter Error Boundary
**Iter:** 1 / 3
**Verdict:** `conditional`
**Generato:** 2026-06-15
**Reviewer:** code-reviewer v2.21 (PATTERN §19)

---

## Stack rilevato

| Campo | Valore | Confidenza |
|---|---|---|
| Linguaggio | TypeScript | EXTRACTED |
| Framework | React 18 | EXTRACTED |
| Build tool | Vite | EXTRACTED |
| Test runner | Vitest + @testing-library/react | EXTRACTED |
| Modalità | stack-aware (sopra confidence_min 0.6) | — |

---

## Verdict: CONDITIONAL

La fix TSK-096 e' funzionalmente corretta e soddisfa tutti e 5 gli Acceptance Criteria del TSK:
- P3-01 (white screen): protetto dal try/catch + fallback UI
- P1-01/P1-02 (useMemo deps): corrette con `[config]`
- Fallback UI: WAI-ARIA compliant (`role="alert"`, `data-testid`)
- Test regressione: presente in `App.test.tsx`

**2 finding medium** richiedono iterazione: entrambi riguardano la sostenibilita' del design del pattern early-return-before-hooks e il tipo di module-level mutable state. Nessun finding blocca il corretto funzionamento in produzione, ma il finding F-02 e' audit-breaking per react-hooks/rules-of-hooks e deve essere risolto prima del merge in main se la CI ha quel lint rule abilitato.

---

## Findings (5 totali)

### [F-02] medium — REACT-IDIOM-001 — Early return prima degli hook in App(): design fragile

**File:** `packages/app/src/App.tsx:115-126`
**Regola:** `[^rule: code_quality/rules/canonical/REACT-IDIOM-001.md §Rationale]`
**Riferimento codice:** `[^src5: packages/app/src/App.tsx:120]`

La funzione componente `App()` esegue un early return prima di qualsiasi hook. Il commento documenta la stabilita' del branch (variabile di modulo), ma:

1. `eslint-plugin-react-hooks/rules-of-hooks` segnala questa forma come violazione — qualsiasi CI con la rule abilitata falla
2. Un hook aggiunto in futuro prima del guard introduce silenziosamente una hook-order violation reale
3. Non e' idiomatico React 18

**Azione richiesta:** Introdurre wrapper component `AppRoot` che fa il branch; il corpo attuale di `App()` diventa `AppContent()` senza early return prima degli hook.

---

### [F-03] medium — TS-IDIOM-002 — Non-null assertion via `as NonNullable<...>` senza giustificazione espansa

**File:** `packages/app/src/App.tsx:125-126`
**Regola:** `[^rule: code_quality/rules/canonical/TS-IDIOM-002.md §Rationale]`
**Riferimento codice:** `[^src5: packages/app/src/App.tsx:125]`

Il cast `as NonNullable<typeof selectedStorage>` e' corretto ma il commento e' sintetico ('per costruzione'). TS-IDIOM-002 richiede giustificazione esplicita. Il problema di design sottostante (variabili di modulo `let` con tipo nullable) e' risolto dal refactoring F-02.

**Azione breve termine:** Espandere il commento del cast per essere esplicito sulla garanzia del try/catch.
**Azione medio termine:** Eliminato automaticamente dal refactoring F-02 (props typed).

---

### [F-04] low — TS-ROBUST-001 — Errore storage non loggato

**File:** `packages/app/src/App.tsx:71-77`
**Regola:** `[^rule: code_quality/rules/canonical/TS-ROBUST-001.md §Rationale]`
**Riferimento codice:** `[^src5: packages/app/src/App.tsx:75]`

Il `catch` non esegue logging: l'errore e' silenzioso per il layer ops/debug (browser console, Electron logs). In un'app desktop con bridge IPC, il log e' critico per il triage di errori di init storage/filesystem.

**Azione:** Aggiungere `console.error('[soli-boy] Storage init failed:', err)` nel catch block (una riga).

---

### [F-01] low — TS-DESIGN-001 — STORAGE_INIT_ERROR_MESSAGE: commento ambiguo sull'export

**File:** `packages/app/src/App.tsx:80-81`
**Regola:** `[^rule: code_quality/rules/canonical/TS-DESIGN-001.md §Rationale]`
**Riferimento codice:** `[^src5: packages/app/src/App.tsx:80]`

La costante e' usata nel JSX di produzione (linea 106) — l'export e' legittimo. Tuttavia il commento `'(esportata per i test di regressione TSK-096)'` inquadra l'export come test-motivated anziche' come conseguenza naturale del riuso del messaggio canonico. Ambiguita' minore sull'API pubblica.

**Azione:** Riformulare il commento: il messaggio e' il testo UI canonico; i test lo importano per evitare magic strings.

---

### [F-05] low — QA-TEST-001 — Manca test smoke path nominale (AC-3)

**File:** `packages/app/src/App.test.tsx`
**Regola:** `[^rule: code_quality/rules/canonical/QA-TEST-001.md §Rationale]`
**Nota:** finding informativo per qa-dev — non spetta al dev-agent.

Il file contiene solo il test del path fallback. L'AC-3 ('L'app si avvia normalmente quando selectAdapter non lancia') non e' coperto da test automatizzato dedicato in questo TSK.

**Azione (qa-dev):** Aggiungere test smoke: mock selectAdapter che ritorna bundle valido → App monta → fallback assente.

---

## Riepilogo per severity

| Severity | Count | IDs |
|---|---|---|
| critical | 0 | — |
| major | 0 | — |
| medium | 2 | F-02, F-03 |
| low | 3 | F-01, F-04, F-05 |

---

## Loop status

- Iterazione corrente: 1 / 3
- No-progress: false (prima iterazione)
- Regression detected: false
- Report precedente: nessuno

---

## Prossimo step

**Verdict `conditional`** — il dev-agent deve:

1. **[F-02] PRIORITA' 1**: Refactoring wrapper component `AppRoot` / `AppContent` — elimina early return prima degli hook e rende il codice audit-safe per react-hooks/rules-of-hooks.
2. **[F-03] PRIORITA' 2**: Espandere commento cast (breve termine) o eliminato dal refactoring F-02 (medio termine).
3. **[F-04] PRIORITA' 3**: Aggiungere `console.error` nel catch (una riga, diff minimo).
4. **[F-01] PRIORITA' 4**: Riformulare commento export STORAGE_INIT_ERROR_MESSAGE.
5. **[F-05]**: Delegare a qa-dev per test smoke path nominale.

Dopo le correzioni → ri-eseguire `/review TSK-096` (iter-2).
