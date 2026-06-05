# TSK-014 — A11y re-scan (EP-012 remediation, iter-2)

- **Componente**: Player controls (pausa/ripresa/arresto) — `.sb-danger.sb-btn` "Arresta"
- **Target**: `http://localhost:5179/` · **Standard**: WCAG 2.2 AA
- **Tool**: `axe-playwright` (driver iter-2, scan default + synthetic)
- **Temi/viewport**: { 90s-party, dark, cyberpunk } × { mobile 375, desktop 1280 }
- **Sorgente fix**: TSK-084 — override `[data-theme="90s-party"] .sb-danger`

## Summary
- Critical: 0
- Major: **0** (color-contrast su `.sb-danger.sb-btn` 90s-party RISOLTO)
- Minor: invariati
- Manual checks: 2 (regola di neutralità N≥1 rispettata)

## Verifica del fix
Override `[data-theme="90s-party"] .sb-danger { color: #ff8fb8; border-color: #ff8fb8; }`
(was `var(--sd-color-intent-danger) #ff0055`) su BG `var(--sd-color-bg-elevated) #251447`
= **7.78:1** (richiesto ≥4.5:1). Conforme WCAG 2.2 AA.

Su tema dark il pulsante Arresta usa FG `#f87171` (intent-danger DS) su BG `#1E2430`
(bg-elevated DS) — ratio nativo conforme, non richiede override.

## Manual checks (N≥1)
- WCAG 1.4.11 — non-text contrast: border del danger button visibile su bg-elevated.
- WCAG 2.5.5 — touch target ≥44px (invariato, già conforme da `--sd-layout-touch-target-min`).

## Verdict
`a11y_status: pass` — finding major iter-1 chiuso dal fix DS app-level (TSK-084).
Run aggregato: `code_quality/reports/ep012-runs/all-runs-iter2.json` +
`all-runs-iter2-synthetic.json`.
Screenshot: `code_quality/reports/ep012-runs/iter2-synthetic-90s-party.png`.
