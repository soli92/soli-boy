---
report_id: soliboy-functional-iter-2
type: functional_oracle
target: http://127.0.0.1:4317/ (build dist servita via vite preview)
acceptance_spec: code_quality/acceptance/soliboy.acceptance.yaml (corretto)
fixture: packages/app/public/test-roms/gba-tests-thumb.gba
agent: functional-oracle (pipeline EP-018, esecuzione reale)
timestamp: 2026-06-09 17:20
verdict: pass
iterations: 2
supersedes: soliboy-functional-iter-1 (falso negativo)
---

# Functional Oracle iter-2 — soli-boy: **l'emulazione PARTE** (verdict corretto)

> Re-run dopo la correzione dell'acceptance-spec (cause del falso negativo iter-1 risolte).
> Conferma il feedback del maintainer e dimostra l'oracolo calibrato.

## Esito: **pass** — engine running confermato con segnale deterministico

| Asserzione | kind | severità | esito | evidenza |
|---|---|---|---|---|
| `engine-running` | selector_visible `button:has-text("Pausa")` | **blocking** | **PASS** | a running il bottone "Avvia" diventa "Pausa" |
| `avvia-consumed` | selector_absent `button:has-text("Avvia")` | blocking | **PASS** | "Avvia" non più presente dopo lo start |
| `canvas-advancing` | canvas_pixel_variance | advisory | n/a (atteso) | distinct=1/12 — test-ROM statica, variance~0 ATTESO (non un fail) |
| `no-console-error` | console_no_error | advisory | PASS | 0 errori |

Verdict **pass**: entrambe le blocking passano.

## Perché iter-1 era un falso negativo (root cause confermata da codice + run)

1. **`state-running` via testo HUD era sbagliato.** `Player.tsx:320`:
   `{running ? (title ?? "In esecuzione") : paused ? "In pausa" : "Premi Avvia"}`.
   Con una ROM **titolata**, lo stato running mostra il **titolo** ("gba-tests-thumb"), NON la stringa
   "In esecuzione". Quindi il `.sb-screen`="gba-tests-thumb" di iter-1 **era già lo stato running** —
   l'assertion lo leggeva come fail. Fix: assert via `button "Pausa"` presente / `"Avvia"` assente.
2. **`canvas_pixel_variance` inadatta alla fixture.** `gba-tests-thumb` è una test-ROM con schermata
   statica → l'engine rende frame identici a 60fps → variance~0 è ATTESO anche girando. Declassata
   ad advisory; per un blocking "frame advancing" serve una fixture animata o un frame-counter engine.

## Finding oggettivo collaterale (alimenta il backlog UX) — bug di layout quantificato

Il canvas ha risoluzione nativa corretta **240×160** (GBA) ma è renderizzato in CSS a **378×24px**:
l'altezza collassa a **24px**, aspect-ratio distrutto. È la prova quantificata del finding maintainer
«emulatore piccolo di default»: non solo piccolo — **schiacciato verticalmente** (probabile bug
`object-fit`/aspect-ratio nel layout del viewport non-fullscreen). Candidato fix nel redesign
emulator-first (vedi `uxui-design-2026-06-09-soliboy-ia-redesign` + backlog).

## Lezione EP-018 (calibrazione oracolo, persistita in memoria)

- Asserire lo stato funzionale da un **segnale deterministico dell'app** (bottone/`data-state`), mai
  da testo HUD ambiguo.
- `canvas_pixel_variance` blocking **solo** con fixture animate; altrimenti advisory.
- **Validare il primo run dell'oracolo contro la realtà** prima di fidarsi del verdict.
- Raccomandazione prodotto: esporre un `data-state="running|paused|idle"` su `.sb-screen` per
  asserzioni funzionali stabili (oggi lo stato è desumibile solo da bottoni/testo).
