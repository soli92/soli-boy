# EP-022 — Regression Guard Multi-Viewport

**File test:** `packages/app/e2e/ep022-multi-viewport.e2e.ts`
**TSK:** TSK-176 | **US:** US-110 | **EP:** EP-022
**Baseline:** 2026-07-03
**Come rieseguire:** `cd packages/app && npx playwright test e2e/ep022-multi-viewport.e2e.ts --reporter=line`

---

## Viewport matrix

| Viewport | Width × Height | Breakpoint Tailwind | ThemeSwitcher in header |
|---|---|---|---|
| mobile-portrait | 390 × 844 | < 640px | No (in Settings accordion "Tema") |
| mobile-landscape | 844 × 390 | ≥ 640px | Si (sm:block attivo) |
| tablet | 768 × 1024 | md: 768px | Si |
| desktop | 1280 × 800 | lg: 1024px+ | Si |

---

## Cosa copre

### Assertion strutturali (3 test per viewport, 12 totali)

| Test | Assertion | Riferimento fix |
|---|---|---|
| S1 — tablist + 4 tab visibili | `tablist[aria-label="Sezioni app"]` visibile; 4 tab (Play/Libreria/Impostazioni/Info) visibili. Info usa regex `/^Info/` per coprire sia "Info" (portrait) sia "Info & Privacy" (altri viewport) | US-105, TSK-166 |
| S2 — marker proto-root + ThemeSwitcher | `.proto-root` attaccato al DOM (EP-021 regression guard); `header .theme-switcher` visibile su width ≥ 640px, non visibile su portrait (width < 640px) | EP-021, TSK-166 (US-105) |
| S3 — bounding box tablist | Tablist edge destro ≤ viewport width + 2px (no overflow); larghezza > 100px su portrait (pre-fix era ~8px collassato da ThemeSwitcher overlay) | TSK-166 (US-105) |

### Navigazione tab (4 test per viewport, 16 totali = 4 viewport × 4 tab)

| Tab | Strategia navigazione | Assertion |
|---|---|---|
| Play | Naviga a Libreria → torna a Play. Portrait: ArrowLeft (keyboard nav, bypass limitazione visiva justify-center pre-esistente). Tutti gli altri: click diretto | `panel-play[data-state=active]` |
| Libreria | Click diretto su tutti i viewport | `panel-library[data-state=active]` |
| Impostazioni | Click diretto su tutti i viewport | `panel-settings[data-state=active]` |
| Info | Click diretto via regex `/^Info/` su tutti i viewport | `panel-info[data-state=active]` |

**Totale test:** 28 (12 strutturali + 16 navigazione)

---

## Cosa non copre

- **Pixel-diff / screenshot:** le suite visual (`ep022-visual-landscape.e2e.ts`, `ep022-visual-tablet.e2e.ts`, `ep022-visual-desktop.e2e.ts`) gestiscono screenshot e validazione visiva per singolo viewport.
- **Copertura temi:** questa suite non testa le combinazioni tema × viewport. La suite portrait (`ep022-portrait-navbar.e2e.ts`, TSK-167) copre i temi cyberpunk + 90s-party su 390×844. Le visual suites coprono entrambi i temi per gli altri viewport.
- **Device reali / hardware:** test su Chromium headless (Playwright). Non sostituisce test su dispositivi fisici iOS/Android.
- **E2E funzionale gaming:** nessun avvio ROM, nessuna sessione WasmBoy/mGBA. Lo scope è strutturale (DOM marker, visibilità, navigazione tab).
- **Overflow assertion approfondita:** l'overflow `scrollWidth` su tutta la pagina è coperto dalle visual suite (`.e2e.ts` individuali per viewport). Qui si verifica solo il bounding box del tablist.
- **Settings 2 colonne su tablet:** la griglia 2-col del pannello Settings su tablet non è implementata (fuori scope TSK-172, US-108). Non coperta.
- **ThemeSwitcher in Settings accordion "Tema" su portrait:** la verifica del ThemeSwitcher nel panel Settings (accordion "Tema — cambio rapido") è coperta da `ep022-portrait-navbar.e2e.ts` (TSK-167, test 4). Non duplicata qui.

---

## Suite preesistenti non duplicate

| File | TSK | Scope | Relazione |
|---|---|---|---|
| `ep022-portrait-navbar.e2e.ts` | TSK-167 | P0 portrait 390×844, temi cyberpunk+90s-party, ThemeSwitcher Settings accordion | Autonoma, non sostituita |
| `ep021-visual-fidelity.e2e.ts` | EP-021 | Parità strutturale app vs prototipo EP-020 su Chromium | Non sovrapposta |
| `ep022-visual-landscape.e2e.ts` | TSK-171 | Screenshot + overflow su 844×390 | Non sovrapposta |
| `ep022-visual-tablet.e2e.ts` | TSK-173 | Screenshot + overflow su 768×1024 | Non sovrapposta |
| `ep022-visual-desktop.e2e.ts` | TSK-175 | Screenshot + overflow su 1280×800 | Non sovrapposta |

---

## Gap noti

- **Play tab portrait — cliccabilità visiva:** il tab Play su 390px ha una limitazione pre-esistente di cliccabilità visiva dovuta a `justify-content: center` + `overflow-x: auto` sulla TabsList (~272px di tab su ~213px di nav). Il test usa keyboard navigation (ArrowLeft) come workaround, identico a TSK-167. Issue segnalata separatamente (separata dal fix ThemeSwitcher di TSK-166).
- **Settings 2-col tablet:** non implementato (fuori scope TSK-172).

---

## Fix EP-022 coperti dalla regressione

| Fix | TSK | Assertion che lo copre |
|---|---|---|
| ThemeSwitcher → Settings su mobile (`hidden sm:block`) | TSK-166 | S2 ThemeSwitcher portrait, S3 larghezza tablist portrait |
| Media query landscape compact header, `.sb-play-row` → 1024px | TSK-170 | N Play/altri tab landscape, S3 no overflow |
| Library `md:grid-cols-4`, `min-height 44px` WCAG globale | TSK-172 | N Libreria tab tutti i viewport |
| Player controls `justify-center` su ≥ 1024px | TSK-174 | N Play tab desktop/tablet |
