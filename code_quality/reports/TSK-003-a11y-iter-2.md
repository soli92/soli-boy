# TSK-003 — A11y re-scan (EP-012 remediation, iter-2)

- **Componente**: `FileLoader` (selettore file + drag&drop) — `packages/app/src/components/FileLoader/`
- **Target**: `http://localhost:5179/` · **Standard**: WCAG 2.2 AA
- **Tool**: `axe-playwright` (Playwright + axe-core) driver `iter-2`
- **Temi/viewport**: { 90s-party, dark, cyberpunk } × { mobile 375, desktop 1280 }
- **Sorgente fix**: TSK-084 (US-049, EP-012) — override token DS in `packages/app/src/styles/app-extra.css`

## Summary
- Critical: 0
- Major: **0** (color-contrast su `.sb-loader > label` dark RISOLTO)
- Minor: invariati (landmark-unique, page-has-heading-one — non in scope di questo TSK)
- Manual checks: 3 (regola di neutralità N≥1 rispettata)

## Verifica del fix
Token override `[data-theme="dark"] --sd-color-primary-default: #1d4ed8` (was `#3B82F6`)
→ `.sb-btn-primary` "Carica ROM" su `data-theme="dark"`: FG `#FFFFFF` su BG `#1d4ed8`
= **6.70:1** (richiesto ≥4.5:1). Conforme WCAG 2.2 AA.

## Manual checks (N≥1)
- WCAG 2.1.1 — attivazione dropzone via tastiera (Enter/Space) — invariato, vincolo TSK-020.
- WCAG 1.4.3 — colore non è l'unico mezzo per veicolare lo stato (drag-over).
- WCAG 1.4.11 — non-text contrast: focus ring sul primary button con il nuovo blu più scuro.

## Verdict
`a11y_status: pass` — finding major iter-1 chiuso dal fix DS app-level (TSK-084).
Run aggregato: `code_quality/reports/ep012-runs/all-runs-iter2.json`.
Screenshot: `code_quality/reports/ep012-runs/iter2-always-visible-{mobile,desktop}-dark.png`.
