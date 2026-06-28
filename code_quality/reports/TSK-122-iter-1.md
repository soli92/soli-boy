# Code Review — TSK-122 — iter 1

## Stack rilevato

TypeScript / React 19.2.7 (Vite + Vitest, jsdom) — confidence 0.95

Evidence: `package.json` (React ^19.2.7, manifest weight 0.5) · `vite.config.ts` (weight 0.2) ·
`tsconfig.json` (weight 0.1) · import React hooks in `TouchOverlay.tsx` (weight 0.15).

Ruleset: `typescript.react.v19`. Regole applicate: TS-IDIOM-001, TS-IDIOM-002,
REACT-IDIOM-001, TS-DESIGN-001, TS-DESIGN-002, `*.design.complexity.*`, TS-ROBUST-001, QA-TEST-001.

Note di scopo: ESLint v10 non configurato (no `eslint.config.js` flat-config) — linter
output non disponibile per passata 1. `lizard` non installato — ciclomatica stimata
manualmente (±1 margine). `tsc --noEmit` → 0 errori. Vitest 545/545 pass.

---

## Verdict

**CONDITIONAL**

TSK-122 è qualitativamente ben eseguito: `coreHasShoulderButtons` stabilisce correttamente
il single source of truth US-063, l'invariante è documentata e testata in modo esaustivo
(7 test layout shoulder + 3 invariante helper, fbneo/mame esplicitamente coperti).
`ReadonlySet<Core>` e `import type` idiomatici. Nessun `any`, nessun `!` ingiustificato.

L'unica criticità rilevata è la complessità ciclomatica di `TouchOverlayInner` (~18,
soglia medium: >10), causata dai 6 rami shoulder aggiunti da TSK-122 su una funzione
già a ~12. La correzione è a basso impatto (extract helper/componente).

Due pattern emergenti candidati per revisione umana (dettaglio nella sezione Emergent).

---

## Finding ordinati

| # | Severity | File : Lines | Rule | Rationale |
|---|----------|-------------|------|-----------|
| F1 | **medium** | `TouchOverlay.tsx` : 177–408 (`TouchOverlayInner`) | `*.design.complexity.cyclomatic_violation` [^rule1] | Ciclomatica ~18 (>10 soglia medium). TSK-122 aggiunge 6 rami shoulder inline nel map callback (isShoulder + 5 ternari stile) a una funzione già complessa. Estrarre `ActionButton` o `shoulderStyleFor()`. |

[^rule1]: `[^rule: code_quality/rules/canonical/design-complexity.md §*.design.complexity.cyclomatic_violation §Rationale]`

**Totale finding: high 0 / medium 1 / low 0. Dedup: 0.**

---

## Emergent candidates (non scored — gate umano per attivazione)

### `TS-DESIGN-003-shoulder-identity-coupling` (candidate)

Pattern rilevato in `TouchOverlay.tsx` line 360:

```typescript
const isShoulder = button === "l" || button === "r";
```

`button-map.ts` dichiara `coreHasShoulderButtons` come single source of truth ("ogni
decisione di rendering su L/R deve passare di qui"), ma `TouchOverlayInner` reintroduce
la conoscenza di *quali button sono shoulder* tramite confronto letterale `"l"/"r"`.
Se in futuro `BUTTON_MAP` aggiungesse `l2`/`r2` per un nuovo core, `TouchOverlay.tsx`
applicherebbe silenziosamente stile non-shoulder. Soluzione: aggiungere
`isShoulderButton(btn: GameButton): boolean` a `button-map.ts`, o esporre
`shoulderSide?: "left" | "right"` in `VirtualButton`.

Draft: `code_quality/rules/emergent/TS-DESIGN-003-shoulder-identity-coupling.md`

### `TS-IDIOM-003-mutable-readonly-consistency` (candidate)

`BUTTON_MAP: Record<Core, VirtualButton[]>` — gli array interni sono mutabili,
a differenza di `CORES_WITH_SHOULDER_BUTTONS: ReadonlySet<Core>`. Un consumer potrebbe
fare `BUTTON_MAP["mgba"].push(...)` alterando silenziosamente tutti i render successivi.
Idioma TS moderno: `Record<Core, ReadonlyArray<VirtualButton>>` o
`Record<Core, readonly VirtualButton[]>`.

Draft: `code_quality/rules/emergent/TS-IDIOM-003-mutable-readonly-consistency.md`

---

## Loop status

Iter **1 / 3**. Markers: nessuno (no_progress: false, regression: false,
loop_exhausted: false, degraded: false).

---

## Prossimo step

**Conditional → task_package consegnato a `fe-dev` per re-Develop.**

```json
{
  "tsk_id": "TSK-122",
  "iter": 1,
  "constraint": {
    "scope": "fix only the findings below; no opportunistic refactor",
    "max_diff_lines": 80
  },
  "actions": [
    {
      "rule_id": "*.design.complexity.cyclomatic_violation",
      "rule_ref": "code_quality/rules/canonical/design-complexity.md",
      "file": "packages/app/src/components/TouchOverlay/TouchOverlay.tsx",
      "lines": [359, 404],
      "current_snippet": "buttons.map(({ button, label }) => {\n  const isShoulder = button === 'l' || button === 'r';\n  const shoulderStyle: React.CSSProperties | undefined = isShoulder\n    ? { position: 'absolute', top: 0, ... }\n    : undefined;\n  return <button ... style={shoulderStyle} ... />;",
      "expected_fix": "Estrarre il corpo del map callback in una funzione pura `renderActionButton({ button, label, isShoulder, handleTouchStart, handleTouchEnd, handleTouchCancel })` oppure in un componente `ActionButton`. In alternativa, spostare `shoulderStyleFor(button: GameButton)` in button-map.ts ed esportarla. Il target è ridurre TouchOverlayInner a ciclomatica ≤ 10.",
      "acceptance_criteria": "TouchOverlayInner cyclomatic ≤ 10 (hand-count o lizard). Tutti i 545 test verdi. Nessuna modifica alle asserzioni di test esistenti."
    }
  ],
  "report_ref": "code_quality/reports/TSK-122-iter-1.md",
  "previous_files_modified": []
}
```

Prossima review sarà **iter 2 / 3**. Procedere con dispatch al dev-agent? [y/N]
