# TSK-040 — A11y scan (EP-012 remediation, iter-1)

- **Componente**: Integrazione DS reale `@soli92/solids` (cross-cutting)
- **EP-012 wrapper**: TSK-080
- **Target**: `http://localhost:5179/` (always-visible + player-rom-loaded)

## Summary
- Critical: 0 · **Major: 1** (color-contrast) · Minor: 2 · Manual: 4

## Finding cross-cutting
- **Major — color-contrast** su classi DS:
  - `.sb-chip-on` (chip filtro attivo, Library) — tema 90s-party
  - `.sb-danger.sb-btn` (CTA Arresta, Player) — tema 90s-party
  - `.sb-loader > label` (FileLoader) — tema dark
  
  Sono i tre stessi finding che emergono nei TSK-038/014/003. Trattandosi del DS,
  la fix dovrebbe essere upstream (token DS o classi `sb-*` di override).

## Verdict consigliato
`a11y_status: major` — i 3 contrast finding sono attribuiti al DS shared.
Auto-fix non eseguito (vincolo retroattivo: no modifiche `packages/app/`).

## Manual checks (N≥1)
- WCAG 1.4.3 contrast su 3 temi · WCAG 1.4.11 non-text contrast (focus ring, border).
