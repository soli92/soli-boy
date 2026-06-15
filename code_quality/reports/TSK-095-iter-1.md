# Code Review — TSK-095 iter-1

**Reviewer:** code-reviewer@2.21.0
**Data:** 2026-06-15
**Verdict:** PASS
**Stack:** TypeScript / React 18 / Vite (conf 0.97)

---

## Stack rilevato

| Campo | Valore |
|---|---|
| Linguaggio | TypeScript |
| Framework | React 18.x |
| Build tool | Vite |
| Test runner | Vitest + @testing-library/react |
| Confidence | 0.97 (full detection) |

---

## Verdict

**PASS** — 0 high, 0 medium, 1 low (advisory, non bloccante).

Il pattern "latest-ref" adottato per eliminare la stale closure è corretto,
idiomatico in React 18, e coperto da test di regressione esplicito. Nessun
finding bloccante.

---

## Findings

### F-095-1-D1 — Invariante stabilità `registerUriHandler` non documentata (low, advisory)

**Regola:** `[^rule: code_quality/rules/canonical/TS-DESIGN-001.md §Rationale]`
**File:** `[^src5: packages/app/src/components/FileLoader/FileLoader.tsx:101]`
**Pass:** design
**Blocking:** no

Il pattern "latest-ref" con `useEffect([registerUriHandler])` presuppone che
`registerUriHandler` abbia identità stabile tra i render (funzione memoizzata,
a livello di modulo, o come ref-setter nel parent). Se il parent la definisce
inline (nuova identità a ogni render), `useEffect` si ri-esegue ad ogni render,
ri-registrando il trampoline con il Capacitor listener. Poiché il componente non
controlla il lifecycle del listener Capacitor (non può de-registrare), si
potrebbe incorrere in listener duplicati.

La JSDoc del prop `registerUriHandler` in `FileLoaderProps` non documenta
questa precondizione.

**Suggerimento:** aggiungere alla JSDoc del prop:
```
* IMPORTANTE: il callback deve avere identità stabile tra i render
* (es. definito a livello di modulo, memoizzato con useCallback, o
* come ref-setter). Passare una funzione inline causa ri-registrazioni
* non necessarie sul listener Capacitor.
```

---

## Verifiche positive

- Pattern "latest-ref" (`useRef` + `handlerRef.current` aggiornato ogni render
  + trampoline stabile in `useEffect`) e' il pattern React canonico per listener
  esterni: idiomatico e corretto (REACT-IDIOM-001 soddisfatta).
- Rimosso `eslint-disable react-hooks/exhaustive-deps`: deps array
  `[registerUriHandler]` e' completo e corretto.
- `handleFile` wrapped in try/catch (TSK-097 co-landed): TS-ROBUST-001
  soddisfatta per il path di importazione ROM.
- `handlerRef.current` riflette sempre l'ultima closure (`storage`,
  `onImported`, `_filesystemApi` freschi): stale closure eliminata; AC1 e AC2
  del TSK soddisfatti.
- Test di regressione TSK-095 (FileLoader.test.tsx:228): rerender con
  `storageB`/`onImportedB` diversi, assert `registerCalls===1` (no
  re-registrazione), assert `storageA.addRom` NOT called + `storageB.addRom`
  called. QA-TEST-001 soddisfatta.
- Nessun `any` non giustificato ne' non-null assertion nel codice modificato
  (TS-IDIOM-002 soddisfatta).
- `import type` usato correttamente per `StoragePort` (TS-IDIOM-001 soddisfatta).
- Nessun test-only helper esportato dal modulo di produzione (TS-DESIGN-001 non
  violata dal cambiamento).
- `handlerRef` initial value `async () => {}` e' un no-op sicuro prima del
  mount: race window accettabile.

---

## Loop status

- Iterazione corrente: 1 / max 3
- No-progress: N/A (primo iter)
- Regression: nessuna

## Prossimo step

Verdict `pass`: TSK-095 e' pronto per il merge. L'unico finding (F-095-1-D1,
low, advisory) puo' essere indirizzato in-line nel commit corrente senza
riaprire lo sviluppo oppure deferrito al prossimo TSK FE su FileLoader.
