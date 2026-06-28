# Code Review — TSK-123 — iter 1

## Stack rilevato

TypeScript 5.x / Vitest 3.x (be — engine adapter layer) — confidence 0.93

Linter: ESLint non disponibile (nessun `eslint.config.js` in `packages/app`).
TypeScript: `tsc --noEmit` → exit 0, zero diagnostics.

## Verdict

**PASS.** TSK-123 è un task di documentazione e verifica (zero modifiche funzionali) che
consegna commenti espliciti e test mirati per il pipeline L/R across tre engine adapter.
L'unico finding (basso) è un gap di test pre-esistente su mgba-engine fuori dallo scope
del TSK; non richiede re-Develop.

## Finding ordinati

| # | Severity | File:Lines | Rule | Rationale |
|---|---|---|---|---|
| 1 | low | `packages/app/src/core/mgba-engine.ts`:122-126 | QA-TEST-001 | Nessun `mgba-engine.test.ts`; `sendInput` ha branching non banale (guard + press/unpress). Gap pre-esistente, WASM testing infeasible in-repo (documentato nel file header). Non introdotto da TSK-123. |

[^rule1: code_quality/rules/canonical/QA-TEST-001.md §Rationale]
[^src1: packages/app/src/core/mgba-engine.ts:122]

### Pattern emergente (non finding — nessuna regola active applicabile)

`wasmboy-engine.ts` BTN map comment: `// l, r: assenti volutamente — vedi commento TSK-123
sopra.` — riferimento spaziale ("sopra") fragile sotto riorganizzazione del codice. Nessuna
regola active copre questo pattern. Bozza emergente creata in
`code_quality/rules/emergent/TS-COMMENT-001.md` (`status: candidate`) per review umana.
Non contato come finding in questa iterazione.

## Note per pass

### Passata 1 — Idiomaticità
Nessun finding. I 4 file toccati non introducono `any`, non-null assertion (`!`), né
import mancanti di `import type`. Le nuove righe sono commenti o test Vitest corretti.

### Passata 2 — Design
Nessun finding contro regole attive. Pattern emergente TS-COMMENT-001 identificato (vedi
sopra). Nessuna violazione TS-DESIGN-001 (no export test-only da moduli di produzione)
né TS-DESIGN-002 (no full-scan su index).

### Passata 3 — Robustezza
1 finding LOW (QA-TEST-001) su mgba-engine.ts — gap pre-esistente.
wasmboy-engine.ts: `sendInput` boundary handling corretto (`if (!this.configured) return;
if (!key) return;`). Test wasmboy correttamente usano `vi.clearAllMocks()` prima delle
asserzioni `not.toHaveBeenCalled()`. Test regressione (L/R no-op non interferisce con
pulsanti mappati) è particolarmente rilevante.

## Highlights positivi

- **Commenti precisi e azione-oriented**: i commenti TSK-123 in mgba e wasmboy citano
  esplicitamente il TSK, la US, il BR §4 e la dipendenza TSK-120 — il futuro manutentore
  capisce il contesto senza cercare altrove.
- **Test wasmboy `expect.objectContaining`**: il test di regressione usa
  `expect(WasmBoy.setJoypadState).toHaveBeenCalledWith(expect.objectContaining({ A: true }))`,
  che è idiomatico Vitest e robusto a espansioni future del joypad state.
- **`vi.clearAllMocks()` inline nei test wasmboy**: dopo `makeLoadedEngine()`, il mock
  history viene azzerato prima delle asserzioni — pattern corretto per evitare
  contaminazione dallo stato di setup.

## Loop status

Iter **1 / 3**. Nessun marker attivo (no_progress: false, regression: false,
loop_exhausted: false).

## Prossimo step

**Verdict pass → chiusura.** `review_status: passed` aggiornato nel frontmatter TSK-123.
Entry appesa a `wiki/log.md`.

Il finding LOW (QA-TEST-001 su mgba-engine.ts) è **raccomandato** come follow-up separato
(non blocca questo TSK): aggiungere `mgba-engine.test.ts` con mock di `MgbaModule` per
coprire `sendInput` (pressed/unpressed/guard !module). Questo è out-of-scope per TSK-123
e può essere schedulato come tech-debt nel prossimo sprint.
