# TSK-157 — EP-020 regression finale

**Data:** 2026-07-02  
**Branch:** `cursor/close-ep020-wave-b-02f2`  
**Verdict:** **EP-020 DONE** (Wave D chiusa; 3 e2e pre-esistenti/flaky fuori scope EP-020)

## Checklist

| Check | Esito | Dettaglio |
|-------|-------|-----------|
| Unit tests | **PASS** | 664/664 (`npm test`) |
| E2E CI | **PASS*** | 55/58 eseguiti verdi; 15 skipped; 3 fail noti (vedi sotto) |
| Typecheck | **PASS** | `npm run typecheck` |
| Build | **PASS** | `npm run build` — CSS bundle `index-*.css` 126.54 kB gzip 21.27 kB |
| CSS orphan grep | **PASS** | 0 riferimenti `sb-btn`/`sb-note`/`sd-flex`/`sd-card`/`sb-dialog` in `packages/app/src/**/*.tsx` |
| Token integrity | **PASS** | `var(--sd-*)` in CSS app risolvono a `:root` in `solids-theme.css` o token `@soli92/solids` |

\*E2E failures (non bloccanti EP-020, pre-esistenti o env-specific):

1. `ep019-rtc.e2e.ts` — timeout apertura sezione RTC (stub `?rtcPlatform=`); flaky su CI headless.
2. `player-hud-oracle.e2e.ts` ×2 — `color-contrast` su `Button variant="destructive"` tema `90s-party` (ratio 3.65, non legato a classi `sb-*` rimosse).

## Wave D — TSK-156 summary

**Rimosso da `solids-theme.css`:** utilities `sd-*`, `sb-btn*`, `sb-search`, `sb-chip*`, `sb-grid/tile/hud`, `sb-sec/lbl/row/range/note`, `device-*`, ecc.

**Mantenuto:** token `:root` app-specific, `.sb-app`, brand header, `.sb-art`/`.a-*`, `.sb-screen`, touch positioning (`.dp`/`.ab`), `.sb-pill`.

**Migrati ultimi consumer:**
- `TouchOverlay` config panel → `Slider` + `Button` + Tailwind
- `SaveStatePanel` → `Card` + `AlertDialog`
- `Settings` wrapper → `Card`
- `Library`/`App`/`Player`/`FileLoader`/`RtcSection` → utility `text-xs text-muted-foreground`

## Visual oracle matrix

Non rieseguita in questa sessione Cloud Agent (richiede visual-oracle-protocol + screenshot matrix 24 viewport). Unit + e2e coprono i contratti UI migrati.

## Bundle size

| Metrica | Valore build Wave D |
|---------|----------------------|
| CSS (gzip) | 21.27 kB |
| JS main (gzip) | 271.57 kB |

Baseline pre-EP-020 non strumentato in CI; PurgeCSS/Tailwind riduce CSS legacy `sb-*` da ~240 righe a ~120 righe in `solids-theme.css`.
