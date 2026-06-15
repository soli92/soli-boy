# Code Review — TSK-096 iter-2

**TSK:** TSK-096 — Fix useMemo deps stale videoPort/themePort + selectAdapter Error Boundary
**Iter:** 2 / 3
**Verdict:** `pass`
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
| Modalita | stack-aware (sopra confidence_min 0.6) | — |

---

## Verdict: PASS

Tutti i finding medium dell'iter-1 sono stati risolti. Il refactoring
`AppContent`/`App` thin shell e' idiomatico, audit-safe, e rimuove sia la
violazione `react-hooks/rules-of-hooks` sia la tensione con il type system. I
finding low operativi (F-01, F-04) sono risolti puntualmente. Resta aperto un
solo finding informativo (F-05, low) delegato a qa-dev — non blocca il merge.

---

## Finding residuo (1 — informativo)

### [F-05] low — QA-TEST-001 — Manca test smoke path nominale (AC-3) — scope qa-dev

**File:** `packages/app/src/App.test.tsx`
**Regola:** `[^rule: code_quality/rules/canonical/QA-TEST-001.md §Rationale]`
**Riferimento codice:** `[^src5: packages/app/src/App.test.tsx:1]`

Il file contiene ancora un solo test che copre il path di fallback (selectAdapter
lancia). Il path nominale — selectAdapter OK -> AppContent monta senza fallback —
non e' coperto da un test automatizzato specifico per questo TSK. Con il
refactoring iter-2 il contratto del componente e' cambiato (AppContent riceve
props, App e' thin shell), rendendo il test smoke nominale ancora piu' rilevante
come regression guard. AC-3 del TSK ('L'app si avvia normalmente quando
selectAdapter non lancia') resta dichiarato ma non verificato automaticamente.

**Azione (qa-dev):** Aggiungere un secondo describe/it in App.test.tsx con mock di
selectAdapter che restituisce un bundle valido, verificando che: (1) App monta
senza errori, (2) il fallback `data-testid="sb-storage-init-error"` e' assente,
(3) un elemento principale e' presente nel DOM. Non bloccante per il merge.

---

## Finding chiusi dall'iter-1 (4)

| ID | Severity | Risoluzione |
|---|---|---|
| F-02 | medium | RESOLVED — `AppContent({ storage, config })` separato da `App()` thin shell. Zero hook in `App()`: nessuna violazione `react-hooks/rules-of-hooks`. |
| F-03 | medium | RESOLVED via F-02 — props typed `AdapterBundle["storage"]` / `AdapterBundle["config"]` eliminano la necessita' di cast verbose. Il `!` residuo in `App()` linea 504 e' giustificato strutturalmente dall'if-guard a linea 501. |
| F-04 | low | RESOLVED — `console.error('[soli-boy] Storage init failed:', storageInitError)` aggiunto a `App.tsx:77`. |
| F-01 | low | RESOLVED — Commento riformulato: "Messaggio UI canonico del fallback storage; i test lo importano come conseguenza." Enfasi corretta sull'uso UI primario. |

---

## Riepilogo per severity

| Severity | iter-1 | iter-2 | Delta |
|---|---|---|---|
| critical | 0 | 0 | 0 |
| major | 0 | 0 | 0 |
| medium | 2 | 0 | -2 |
| low | 3 | 1 | -2 |

---

## Loop status

- Iterazione corrente: 2 / 3
- No-progress: false (4 finding chiusi)
- Regression detected: false (nessun finding nuovo in file non toccati dalla fix)
- Report precedente: `code_quality/reports/TSK-096-iter-1.json`

---

## Prossimo step

**Verdict `pass`** — il TSK e' chiuso per il code-review.

Il dev-agent non ha azioni richieste. Il finding residuo F-05 e' delegato a
qa-dev come ticket informativo (test smoke path nominale AC-3). Non blocca il
merge.
