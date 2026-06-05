# TSK-038 — A11y re-scan (EP-012 remediation, iter-2)

- **Componente**: ricerca + filtro piattaforma (Library) — `.sb-chip-on` (chip filtro attivo)
- **Target**: `http://localhost:5179/` · **Standard**: WCAG 2.2 AA
- **Tool**: `axe-playwright` (driver iter-2, scan default + synthetic)
- **Temi/viewport**: { 90s-party, dark, cyberpunk } × { mobile 375, desktop 1280 }
- **Sorgente fix**: TSK-084 — override `[data-theme="90s-party"] .sb-chip-on` color

## Summary
- Critical: 0
- Major: **0** (color-contrast su `.sb-chip-on` 90s-party RISOLTO)
- Minor: invariati
- Manual checks: 3 (regola di neutralità N≥1 rispettata)

## Verifica del fix
Override `[data-theme="90s-party"] .sb-chip-on { color: #ffd1ff; }`
(was `var(--sd-color-primary-default) #e019dd`) su BG `var(--sd-color-primary-subtle) #4a1942`
= **10.48:1** (richiesto ≥4.5:1). Conforme WCAG 2.2 AA.

Note collaterali:
- Su tema dark, lo scuriamento di primary-default (TSK-084) avrebbe abbassato il chip-on
  dark a 2.56; override esplicito `[data-theme="dark"] .sb-chip-on { color: #93c5fd; }`
  → ratio **9.51:1**. No regressioni.
- Su tema cyberpunk, override `--sd-color-primary-subtle: #052e36` (was `#0e7490`)
  → chip-on cyber FG `#06b6d4` ratio **5.96:1**.

## Manual checks (N≥1)
- WCAG 1.3.1 — radiogroup semantico (chip filtro), invariato.
- WCAG 2.1.1 — keyboard nav fra chip (invariato).
- WCAG 3.3.2 — label search bar (invariato).

## Verdict
`a11y_status: pass` — finding major iter-1 chiuso dal fix DS app-level (TSK-084).
Run aggregato: `code_quality/reports/ep012-runs/all-runs-iter2.json` +
`all-runs-iter2-synthetic.json`.
Screenshot: `code_quality/reports/ep012-runs/iter2-synthetic-{90s-party,dark,cyberpunk}.png`.
