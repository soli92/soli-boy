# TSK-012 — A11y scan (EP-012 remediation, iter-1)

- **Componente**: Library (griglia ROM persistite)
- **EP-012 wrapper**: TSK-079 · Target: `http://localhost:5179/`
- Viewport mobile/desktop, temi 90s-party/dark · Tool: axe-playwright WCAG 2.2 AA

## Summary
- Critical: 0 · Major: 0 · Minor: 2 (trasversali alla pagina) · Manual: 5

## Verdict consigliato
`a11y_status: pass` — nessun finding specifico alla griglia/card. Il `page-has-heading-one`
minor potrebbe essere risolto promovendo il brand-name + page title della Library a `h1`,
ma è best-practice axe non WCAG-blocking.

## Manual checks (N≥1)
- WCAG 1.3.1 / 2.4.6 — heading hierarchy della Library.
- WCAG 2.1.1 — card e CTA Avvia keyboard-reachable.
