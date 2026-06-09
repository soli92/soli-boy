# Code Review — windowA-touchoverlay (iter-1)

**Reviewer:** code-reviewer v2.18 · **Generated:** 2026-06-09
**Commits:** `f9d1dbe..HEAD` (8d3496b, b2a4289, 7b7f156, ad6cef8 — TSK-060/061/064/066/062/065/067)

## Stack rilevato

TypeScript + React 19 + Vite + Capacitor (confidence 0.95, stack_mode `guided`).
`tsc --noEmit` pulito · 56/56 unit test (TouchOverlay + gamepad) verdi.

## Verdict: **CONDITIONAL**

Codice di buona qualità: ben commentato, idiomatico, con guard SSR/jsdom e
backward-compat sistematici. Dei 4 finding pre-segnalati, 3 sono gestiti bene; resta
1 race reale (major) + rifiniture. **Nessun blocker.**

| Severity | # |
|---|---|
| blocker | 0 |
| major | 1 |
| minor | 3 |
| nit | 0 |

## Esito dei 4 finding pre-segnalati

| Finding pre-flag | Esito |
|---|---|
| haptics import dinamico (primo touch perso su nativo) | **Trade-off documentato** (F-3, minor) — corretto ma migliorabile con prefetch |
| `onHapticsChange` async tipizzata come sync `(b)=>void` | **NON risolto** (F-2, minor) — floating promise, rejection persa |
| GameButton esteso l/r + Partial<Record> guard wasmboy | **Risolto bene** — Partial<Record> + guard runtime, scelta type-safe corretta |
| race rAF polling gamepad su disconnect rapido | **Mitigato ma residuo** (F-1, major) — poll() risuscita il loop dopo stopPolling() |

## Finding principali

### F-1 (major, robustness) — Race residua rAF gamepad
`domain/useGamepadDetection.ts:76-96,99-105`
`poll()` termina sempre con `rafRef.current = requestAnimationFrame(poll)` senza
verificare se il polling è ancora attivo. Su disconnect rapido, un `poll()` già
dequeued dal browser rischedula un nuovo frame *dopo* `stopPolling()`, resuscitando
il loop → rAF leak (gira a vuoto, `connected=false`). Disconnect/reconnect rapidi
possono accumulare loop concorrenti.
**Fix:** flag autoritativo `pollingActiveRef` separato dall'handle rAF; `poll()`
esce subito se `!pollingActiveRef.current`.

### F-2 (minor, idiomaticity) — `onHapticsChange` async-as-sync
`Settings/Settings.tsx:133` + `App.tsx:201-206`
Tipo `(enabled: boolean) => void` ma il call-site passa `async (value) => { ...
await saveHapticsEnabled(value) }`. `saveHapticsEnabled` fa `await
storage.setConfig(...)` **senza** try/catch interno → se IndexedDB rigetta, la
rejection è una floating promise persa (nessun log, toggle non persistito ma stato
React resta `true`).
**Fix:** tipo `=> void | Promise<void>` + `.catch` al call-site, oppure try/catch
dentro `saveHapticsEnabled` (come già fatto nel load al mount).

### F-3 (minor, design) — haptics primo-touch
`TouchOverlay/useHaptics.ts:55-70`
Import lazy on-demand → primo tap nativo non vibra. Documentato come intenzionale
(corretto e onesto). Migliorabile con `useEffect` di prefetch quando
`enabled && isCapacitorNative()`.

## Loop status

iter 1/3 · no-progress: no · regression: no · iterazioni rimanenti: 2

## Prossimo step

Dispatch dev-agent (fe-dev) con `task_package`: **F-1** (chiusura race rAF, major) →
**F-2** (tipo async + catch). F-3/F-4 opzionali. `max_diff_lines: 60`, niente refactor
opportunistico. Re-review iter-2 dopo la fix.

> Onestà: il codice è solido e ben curato. F-1 è l'unico finding che vale davvero un
> giro di fix (race con leak reale su disconnect rapido); F-2 è un type-safety/UX gap
> a basso sforzo. Tutto il resto è qualità sopra la media.
