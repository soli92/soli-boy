# Code Review — TSK-092 iter-1

**TSK**: TSK-092 — Fix restoreSram best-effort in handlePlay (Player.tsx)
**Verdict**: PASS
**Iter**: 1 / 3
**Data**: 2026-06-15
**Reviewer version**: 2.12

---

## Stack rilevato

| Dimensione | Valore | Confidence |
|---|---|---|
| Linguaggio | TypeScript | EXTRACTED |
| Framework | React 18 | EXTRACTED |
| Test runner | Vitest + @testing-library/react | EXTRACTED |
| Fonte | `raw/tech_stack.md` (vincoli confermati) | — |

---

## Verdict: PASS

Tutti e 4 gli Acceptance Criteria sono soddisfatti. Il finding P3-06 (critical, conf. 0.90) dalla deep review `soliboy-code-review-deep.md` risulta correttamente risolto. Due finding di bassa severità (low) riguardano la robustezza delle asserzioni nel test — non bloccanti, indirizzabili come housekeeping.

---

## Verifica Acceptance Criteria

| AC | Status | Evidenza |
|---|---|---|
| AC1 — try/catch separato per restoreSram | PASS | `Player.tsx:242-251` — blocco try/catch interno annidato correttamente; il catch esterno (`handlePlay`) non viene raggiunto da un reject di `restoreSram`. |
| AC2 — log console.warn (non error) | PASS | `Player.tsx:246` — `console.warn("[Player] restoreSram best-effort failed; ...")`. Il test verifica la presenza del warn con match `/restoreSram/i`. |
| AC3 — nessun error state user-visible | PASS | `setError()` assente nel catch SRAM; raggiunto solo dal catch esterno (fallimento `wrapper.load()`). Test verifica `queryByRole('alert')` assente. |
| AC4 — state === running, no error, console.warn loggato | PASS | Test `Player.test.tsx:122-190` — presenza pulsante Pausa (prova state running), `engine.start` called once, alert assente, warn con 'restoreSram', parametri corretti a `restoreSram`. |

---

## Findings

### F-092-01 — severity: low
**Rule**: `[^rule: code_quality/rules/canonical/QA-TEST-001.md §Rationale]`
**File**: `[^src5: packages/app/src/components/Player/Player.test.tsx:176-179]`
**Pass**: robustness

Asserzione `console.warn` debolmente ancorata: il test verifica `warnSpy.mock.calls[0]?.[0]` (prima call, primo argomento). Se un warn venisse emesso prima del path SRAM (es. da un useEffect al mount), l'asserzione verificherebbe la call sbagliata pur passando. L'AC2 è funzionalmente coperto, ma la robustezza dell'asserzione dipende dall'assenza di altri warn emessi durante il test.

**Suggestion**: `expect(warnSpy.mock.calls.some(args => String(args[0]).match(/restoreSram/i))).toBe(true)` — indipendente dall'ordine. In alternativa, `warnSpy.mockClear()` prima del click per azzerare le call pregresse.

---

### F-092-02 — severity: low
**Rule**: `[^rule: code_quality/rules/canonical/QA-TEST-001.md §Rationale]`
**File**: `[^src5: packages/app/src/components/Player/Player.test.tsx:149]`
**Pass**: robustness

Spy cleanup affidato solo a `try/finally` locale. In Vitest la convenzione idiomatica è `afterEach(() => vi.restoreAllMocks())` a livello di `describe` block, che garantisce isolamento anche in caso di early return o di aggiunte future al file. Basso rischio nel file corrente (4 test, un solo spy), ma il pattern non scala.

**Suggestion**: Aggiungere `afterEach(() => vi.restoreAllMocks())` nel `describe("Player", ...)`. Non rimuovere il try/finally (doppia protezione).

---

## Analisi strutturale del fix

Il diff introdotto da TSK-092 in `handlePlay` (Player.tsx:235-251) è minimale e corretto:

1. Il `restoreSram` era precedentemente chiamato direttamente nel try esterno di `handlePlay` (commit `a914b25`), causando la propagazione del reject al catch che chiama `setError()`.
2. Il fix introduce un guard `if (saveService?.restoreSram && romId)` seguito da un try/catch autonomo che intercetta solo il fallimento SRAM.
3. La simmetria con `persistSram()` (già best-effort, riga 207-215) è mantenuta: entrambe le funzioni SRAM usano lo stesso pattern catch-silenzioso/warn.
4. La scelta `console.warn` vs `console.error` è semanticamente appropriata (SRAM = capability opzionale, non errore fatale).

Nessuna regressione rilevata sugli altri test esistenti del file: i test TSK-008, TSK-014, TSK-032 non interagiscono con `restoreSram`.

---

## Loop status

| Parametro | Valore |
|---|---|
| Iterazione corrente | 1 |
| Max iterations | 3 |
| No-progress risk | No |
| Regressioni rilevate | No |

---

## Prossimo step

Verdict PASS — aggiornare `review_status: passed` nel frontmatter `TSK-092.md`.
I finding F-092-01 e F-092-02 (severity low) possono essere indirizzati in un futuro TSK di housekeeping del test suite, non bloccano il merge.
