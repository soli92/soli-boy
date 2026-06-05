# TSK-020 — A11y scan (EP-012 remediation, iter-1)

- **Componente**: Dropzone FileLoader attivabile da tastiera (REACT-A11Y-001)
- **Target**: `http://localhost:5179/` · **Standard**: WCAG 2.2 AA
- **Tool**: `run_a11y_scan` (Playwright + axe-playwright)
- **EP-012 wrapper**: TSK-079

## Summary
- Critical: 0 · Major: 0 · Minor: 2 (non specifici al componente) · Manual: 5

## Finding per il componente
Nessun finding axe specifico. La dropzone (`role="button"` + `tabIndex={0}` + `onKeyDown`)
non genera violazioni di `aria-allowed-role`, `focusable-content` né `interactive-supports-focus-state`.

## Verdict consigliato
`a11y_status: pass` (axe-only). I 2 minor sono trasversali alla pagina (`landmark-unique`,
`page-has-heading-one`), non bloccano il componente. Manual check WCAG 2.1.1 raccomandato
con AT reale per validare l'attivazione Enter/Space (axe non testa keyboard activation).

## Manual checks (N≥1)
- WCAG 2.1.1 — Enter/Space → apre file picker (vincolo principale TSK-020).
- WCAG 2.4.7 — focus visibile.
- WCAG 4.1.2 — role/name/value via screen-reader.
