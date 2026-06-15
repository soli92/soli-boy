# Code Review — TSK-094 iter-1

**TSK:** TSK-094 — Atomicità putSaveState: try-unlink su fallimento manifest write
**Data:** 2026-06-15
**Iterazione:** 1 / 3 (max_iterations: 3)
**Reviewer version:** code-reviewer v2.12 (PATTERN §19)
**Verdict:** PASS

---

## Stack rilevato

TypeScript 5.x, Vitest (node environment), Electron IPC bridge abstraction (NativeFsBridge).
Regole applicabili: TS-ROBUST-001, TS-DESIGN-001, TS-IDIOM-002, QA-TEST-001.
Confidence: alta (stack guided, full stack agents).

Blast radius pre-check: `.graphify-state/` non disponibile — skip, comportamento Fase 1 standard.

---

## Verifica Acceptance Criteria

| AC | Esito | Dettaglio |
|---|---|---|
| 1. `putSaveState()` avvolge blob+manifest in try/catch atomico | PASS | blob write fuori dal try (corretto: no orfano su blob-fail); manifest read+write nel try |
| 2. Manifest write fallisce → `tryUnlink(blobPath)` chiamato (best-effort) | PASS | catch esterno → try interno → `tryUnlink`; vedere riga 648–663 |
| 3. Fallimento unlink loggato ma non propagato | PASS | `console.warn(unlinkErr)` senza rethrow, errore originale invariato |
| 4. Errore originale manifest write propagato al caller | PASS | `throw err` — identity-preserving (test usa `.toBe`, non `.toEqual`) |
| 5. Comportamento nominale identico a prima | PASS | test nominale + suite preesistenti invariate |
| 6. Test: "blob OK, manifest throw" → reject + tryUnlink invocato | PASS | 3 test TSK-094 presenti e coprono tutti i rami |

---

## Findings

### F1 — Asimmetria pattern cleanup tra metodi dello stesso adapter
- **Severità:** medium
- **Regola:** `[^rule: code_quality/rules/canonical/TS-DESIGN-001.md §Rationale]`
- **File:** `[^src5: packages/app/src/storage/native-fs-adapter.ts:492]` (`addRom`), `[^src5: packages/app/src/storage/native-fs-adapter.ts:692]` (`putSram`)
- **Descrizione:** `addRom` e `putSram` espongono la stessa vulnerabilità pre-fix risolta da TSK-094 per `putSaveState`: blob write senza cleanup sul manifest failure. La fix introduce ora un'asimmetria non annotata tra i metodi dello stesso adapter. Il codebase non documenta questo come known gap.
- **Raccomandazione:** aprire follow-up TSK per applicare lo stesso pattern try-cleanup a `addRom`, `putSram`, `setCover`; oppure aggiungere commento `// known-gap (TSK-094): stesso pattern da applicare — follow-up TSK` sui metodi non-coperti come segnale esplicito.

### F2 — Cast non-null implicito nel test (low, auto_fixable)
- **Severità:** low
- **Regola:** `[^rule: code_quality/rules/canonical/TS-IDIOM-002.md §Rationale]`
- **File:** `[^src5: packages/app/src/storage/native-fs-adapter.test.ts:439]`
- **Descrizione:** `const blobUnlinkedPath = unlinkSpy.mock.calls[0]?.[0]` è tipizzato come `string | undefined`. La riga 442 usa `bridge.files.has(blobUnlinkedPath as string)` senza un `expect(blobUnlinkedPath).toBeDefined()` esplicito. L'asserzione `toHaveBeenCalledTimes(1)` fornisce protezione indiretta sufficiente in pratica, ma non è un narrowing formale.
- **Raccomandazione:** aggiungere `expect(blobUnlinkedPath).toBeDefined()` tra la riga 440 e 442 per eliminare il cast e rendere il fail immediato e leggibile se la chiamata non avvenisse.

### F3 — Copertura mancante per ramo "manifest read fail" (low, advisory)
- **Severità:** low
- **Regola:** `[^rule: code_quality/rules/canonical/QA-TEST-001.md §Rationale]`
- **File:** `[^src5: packages/app/src/storage/native-fs-adapter.test.ts:411]`
- **Descrizione:** Il blocco `try` copre anche `readSaveStatesManifest()`. Se il manifest JSON fosse corrotto (parse error), il cleanup verrebbe attivato ugualmente. Non è un AC esplicito del TSK-094 ma è un ramo di logica non-banale scoperto.
- **Raccomandazione (advisory per qa-dev):** segnalare gap di copertura opzionale — test "manifest corrotto → cleanup + errore originale propagato" per `putSaveState`.

---

## Summary

Fix corretto, mirato e privo di regressioni. Il pattern write-then-manifest è implementato nella forma canonica: blob write fuori dal try (nessun orfano su blob-fail), manifest block protetto, cleanup best-effort nel catch senza oscuramento dell'errore originale, `throw err` identity-preserving. I tre test TSK-094 coprono lo scenario nominale, il fail manifest e la degradazione cleanup. Nessun finding bloccante. F1 (medium) è l'unico item meritevole di follow-up pianificato.

---

## Loop status

- Iterazione corrente: 1
- Iterazione precedente: nessuna
- No-progress detection: N/A
- Regression detection: nessuna regressione rilevata su file non toccati

## Prossimo step

Verdict PASS — nessuna azione obbligatoria sul TSK-094. Azione raccomandata: aprire TSK di follow-up per `addRom`/`putSram`/`setCover` (F1, medium).
