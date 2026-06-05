# TSK-003 — A11y scan (EP-012 remediation, iter-1)

- **Componente**: `FileLoader` (selettore file + drag&drop) — `packages/app/src/components/FileLoader/`
- **Target scan**: `http://localhost:5179/` (SPA single-route, FileLoader always-visible)
- **Tool**: `run_a11y_scan` via Playwright + axe-playwright (WCAG 2.2 AA)
- **Viewport**: mobile 375, desktop 1280 · **Temi**: 90s-party (default), dark
- **EP-012 wrapper**: TSK-079

## Summary
- Critical: 0
- Major: 1 — `color-contrast` su `.sb-loader > label` quando `data-theme="dark"`
- Minor: 2 — `landmark-unique`, `page-has-heading-one` (pagina, non specifici a FileLoader)
- Manual checks: 5 (N≥1 invariante — regola di neutralità rispettata)

## Finding per il componente
1. **Major — color-contrast (tema dark)**. La label della dropzone (`.sb-loader > label`)
   non raggiunge il contrasto WCAG AA su `data-theme="dark"`. In mobile e desktop entrambi.
   Nel tema `90s-party` (default) il finding non emerge. Fix richiede tuning del token
   colore di foreground nello scope `.sb-loader` per il tema dark (token `@soli92/solids`).
2. **Minor — landmark-unique**. Section regions senza nome accessibile univoco; impatto
   trasversale alla pagina, non specifico a FileLoader.

## Manual checks consigliati (N≥1)
- WCAG 2.1.1 — attivazione dropzone via tastiera (Enter/Space) — vincolo TSK-020.
- WCAG 1.4.3 — colore non è l'unico mezzo per veicolare lo stato (drag-over).
- WCAG 2.4.3 — focus order da `input` → dropzone → CTA library.

## Verdict consigliato
`a11y_status: major` — il color-contrast su tema dark è above-threshold ma non
critical (non blocca l'uso, riduce leggibilità). Auto-fix non eseguito (vincolo
remediation retroattiva: nessuna modifica a `packages/app/`). Gate owner per la
patch del token colore.

## Tracce di esecuzione
- Run JSON aggregato: `code_quality/reports/ep012-runs/all-runs.json`,
  `code_quality/reports/ep012-runs/all-runs-dark.json`
- Screenshot: `code_quality/reports/ep012-runs/always-visible-{mobile,desktop}-{90s-party,dark}.png`,
  `code_quality/reports/ep012-runs/always-visible-{mobile,desktop}-dark-actual.png`
