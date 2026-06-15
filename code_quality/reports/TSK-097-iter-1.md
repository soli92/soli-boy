# Code Review — TSK-097 iter-1

**TSK:** TSK-097 — Fix handleFile async try/catch in FileLoader.tsx (P3-03/P3-04)
**Verdict:** conditional
**Iter:** 1 / 3
**Generato:** 2026-06-15
**Reviewer:** code-reviewer v2.14
**Stack rilevato:** TypeScript / React 18 / Vite / Vitest (confidence 0.97, guided)

---

## Verdict: CONDITIONAL

Un solo finding di bassa severita. L'implementazione del try/catch e' corretta, conforme agli AC e idiomatica. La copertura del branch `console.error` e' implicita ma non esplicitamente asserita nel test.

---

## Stack rilevato

| Dimensione | Valore | Confidence |
|---|---|---|
| Linguaggio | TypeScript | 0.97 |
| Framework | React 18 | 0.97 |
| Build tool | Vite | 0.97 |
| Test runner | Vitest + @testing-library/react | 0.97 |
| Detection mode | guided (factory.config.yaml) | — |

---

## Findings

### F-097-01 — QA-TEST-001 [LOW]

**Pass:** robustness
**File:** `packages/app/src/components/FileLoader/FileLoader.test.tsx` righe 193-206
**Rule:** `[^rule: code_quality/rules/canonical/QA-TEST-001.md §Rationale]`

**Titolo:** Il test TSK-097 neutralizza `console.error` ma non asserisce che sia chiamato.

**Descrizione:** Il test installa `errSpy` su `console.error` con `mockImplementation(() => {})` per silenziare l'output nella console di test, ma non esegue alcuna `expect(errSpy).toHaveBeenCalled()`. Il branch `if (import.meta.env.DEV) console.error("FileLoader.handleFile:", err)` introdotto da TSK-097 rimane privo di verifica comportamentale. In ambienti Vitest `import.meta.env.DEV` e' `true` per default, quindi il branch esegue di fatto, ma l'asserzione mancante rende la copertura implicita: una futura rimozione o modifica del log non verrebbe intercettata dal test.

**Suggerimento:** Aggiungere prima di `errSpy.mockRestore()`:
```ts
expect(errSpy).toHaveBeenCalledWith(
  "FileLoader.handleFile:",
  expect.any(TypeError)
);
```
Questo rende esplicita la verifica del logging in DEV e previene regressioni silenziose.

**Riferimenti:**
- `[^rule: code_quality/rules/canonical/QA-TEST-001.md §Rationale]`
- `[^src5: packages/app/src/components/FileLoader/FileLoader.test.tsx:193]`

---

## Passate

| Pass | Esito | Note |
|---|---|---|
| Idiomaticita | OK | Componente funzionale, props tipizzate, nessun side-effect nel render body. Cast nel test (`as ReturnType<typeof vi.fn>`) giustificato. Nessun `any` implicito. |
| Design | OK | try/catch intenzionalmente generico (scope AC-2: "qualsiasi Error non gia gestita"). Messaggio canonico coerente. Guard `import.meta.env.DEV` idiomatico Vite. Separazione concern mantenuta. |
| Robustezza | 1 finding low | try/catch copre correttamente entrambi i punti di fallimento I/O (readHeader + importRom). Branch DEV non asserito nel test. |

---

## Loop status

- Iter corrente: 1/3
- Finding precedenti: nessuno (prima iterazione)
- No-progress risk: no
- Regression risk: no

---

## Prossimo step

Verdict `conditional`: il dev-agent puo applicare il fix opzionale (aggiungere l'asserzione su `errSpy` nel test TSK-097) oppure l'owner puo decidere di accettare la copertura implicita e promuovere a `passed` manualmente. Nessun blocco funzionale.

**Finding count:** high: 0 / medium: 0 / low: 1
