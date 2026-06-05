# TSK-044 — A11y scan (EP-012 remediation, iter-1)

- **Componente**: ThemeSelector + persistenza `data-theme` · **EP-012**: TSK-083

## Summary
- Critical: 0 · **Major: 1** (color-contrast cross-cutting attivati dal tema) · Minor: 2 · Manual: 5

## Verdict
`a11y_status: major` — il ThemeSelector funziona; i contrast finding attivati cambiando
tema sono imputabili ai token DS (cross-link TSK-040). **Gap dichiarato**: tema `cyberpunk`
non scansionato automaticamente in questa iterazione (servirebbe un terzo run con
`setOption('cyberpunk')`).

## Manual checks (N≥1)
- WCAG 4.1.2 aria-label select · WCAG 1.4.3 contrast cyberpunk · WCAG 3.2.5 context change.
