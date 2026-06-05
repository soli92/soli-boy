# TSK-040 — A11y re-scan (EP-012 remediation, iter-2)

- **Componente**: Integrazione DS reale `@soli92/solids` (cross-cutting)
- **Target**: `http://localhost:5179/` · **Standard**: WCAG 2.2 AA
- **Tool**: `axe-playwright` (driver iter-2)
- **Temi/viewport**: { 90s-party, dark, cyberpunk } × { mobile 375, desktop 1280 }
  + scope `synthetic-3-states` per coprire selettori non sempre presenti nello stato default.
- **Sorgente fix**: TSK-084 — override token DS app-level (`packages/app/src/styles/app-extra.css`)

## Summary
- Critical: 0
- Major: **0** — i 3 finding cross-cutting iter-1 (color-contrast) SONO TUTTI RISOLTI:
  - `.sb-chip-on` 90s-party → ratio 10.48:1
  - `.sb-danger.sb-btn` 90s-party → ratio 7.78:1
  - `.sb-loader > label` (`.sb-btn-primary`) dark → ratio 6.70:1
- Sub-gap iter-1 (tema cyberpunk non scansionato): cyberpunk ora scansionato; finding
  `color-contrast` su `.sb-chip-on` cyberpunk (era 2.21:1) → RISOLTO con override
  `--sd-color-primary-subtle: #052e36` (ratio 5.96:1).
- Manual checks: 3 (regola di neutralità N≥1 rispettata)

## Strategia di fix
Il DS `@soli92/solids@1.14.1` vive in `node_modules` (immutabile). Override applicati
in `packages/app/src/styles/app-extra.css` (importato in `main.tsx` DOPO
`@soli92/solids/dist/css/index.css`, così le custom properties sovrascrivono quelle
del DS). Cinque blocchi:

1. `[data-theme="dark"]` — `--sd-color-primary-default` `#3B82F6` → `#1d4ed8` (blue-700);
   `--sd-color-primary-hover` `#60A5FA` → `#1e40af`.
2. `[data-theme="dark"] .sb-chip-on` — `color: #93c5fd` (compensa il primary scurito sul chip).
3. `[data-theme="90s-party"] .sb-chip-on` — `color: #ffd1ff`.
4. `[data-theme="90s-party"] .sb-danger` — `color: #ff8fb8; border-color: #ff8fb8`.
5. `[data-theme="cyberpunk"]` — `--sd-color-primary-subtle: #052e36`.

## Manual checks (N≥1)
- WCAG 1.4.3 — contrast spot-check su 3 temi × 3 stati.
- WCAG 1.4.11 — non-text contrast (focus ring, border) post-override.
- WCAG 1.4.12 — text spacing: non alterato dal fix di colore.

## Verdict
`a11y_status: pass` — finding major cross-cutting iter-1 chiusi dal fix DS app-level.
Sub-gap cyberpunk anch'esso chiuso.
Run aggregati: `code_quality/reports/ep012-runs/all-runs-iter2.json` +
`all-runs-iter2-synthetic.json`.
