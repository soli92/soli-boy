# TSK-044 — A11y re-scan (EP-012 remediation, iter-2)

- **Componente**: ThemeSelector + persistenza `data-theme` (90s-party / dark / cyberpunk)
- **Target**: `http://localhost:5179/` · **Standard**: WCAG 2.2 AA
- **Tool**: `axe-playwright` (driver iter-2)
- **Temi/viewport**: { 90s-party, dark, cyberpunk } × { mobile 375, desktop 1280 }
- **Sorgente fix**: TSK-084 — override token DS app-level

## Summary
- Critical: 0
- Major: **0** — i finding cross-cutting attivati dal cambio tema (chip-on / danger /
  loader-label) sono tutti risolti dal fix DS.
- Sub-gap iter-1 (tema cyberpunk non scansionato): CHIUSO — cyberpunk scansionato in
  iter-2 su tutti e 3 gli stati, finding emerso su `.sb-chip-on` cyberpunk (ratio 2.21:1)
  risolto con override `--sd-color-primary-subtle: #052e36` (5.96:1).
- Manual checks: 3 (regola di neutralità N≥1 rispettata)

## Manual checks (N≥1)
- WCAG 4.1.2 — aria-label del select tema (invariato).
- WCAG 1.4.3 — contrast cyberpunk (ora scansionato e conforme).
- WCAG 3.2.5 — context change al cambio tema (invariato).

## Verdict
`a11y_status: pass` — il ThemeSelector funziona, i finding cross-cutting attivati dai
temi 90s-party/dark/cyberpunk sono chiusi dal fix DS app-level (TSK-084).
Run aggregato: `code_quality/reports/ep012-runs/all-runs-iter2.json` +
`all-runs-iter2-synthetic.json`.
