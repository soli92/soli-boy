---
tsk: TSK-166
us: US-105
ep: EP-022
date: 2026-07-03
iteration: 1
verdict: conditional
protocol: visual-oracle-protocol
node: v24.16.0
playwright: true
screenshots: code_quality/reports/TSK-166-visual-iter-1/
---

# Visual Oracle — TSK-166 — Iter 1

**Verdict: `conditional`**

Il fix primario di TSK-166 (ThemeSwitcher nascosto su mobile, accordion "Tema" in Settings) è
correttamente implementato e passa tutti i criteri. Tuttavia il criterio DoD critico
"Tutti i 4 tab visibili su 390px" non è soddisfatto: il tab **Play** non è accessibile
visivamente su mobile portrait a causa di un bug di allineamento CSS (`justify-content: center`
sul TabsList + overflow sinistro inaccessibile).

---

## Fase 1 — Build

```
npm run build → verde
tsc --noEmit: 0 errori
vite build: 1942 moduli, dist/ generato correttamente
```

## Fase 2 — Serve

`npx serve dist -p 4174` → HTTP 200 su `http://localhost:4174`

---

## Fase 3 — Screenshot multi-viewport

Screenshot catturati con Playwright (chromium headless) in:
`code_quality/reports/TSK-166-visual-iter-1/`

| Viewport | Dimensioni | Screenshot |
|---|---|---|
| mobile-portrait | 390×844 | `mobile-portrait-default.png`, `mobile-portrait-settings.png` |
| mobile-landscape | 844×390 | `mobile-landscape-default.png`, `mobile-landscape-settings.png` |
| tablet | 768×1024 | `tablet-default.png`, `tablet-settings.png` |
| desktop | 1280×800 | `desktop-default.png`, `desktop-settings.png` |

---

## Fase 4 — Critica visiva

### mobile-portrait (390×844) — CONDITIONAL

**ThemeSwitcher in header:** `display: none` — wrapper `.hidden.sm:block` ha computed
`display=none` ✓. Bounding box: x=0, w=0, h=0 — completamente rimosso dal layout ✓.

**ThemeSwitcher in Settings — accordion "Tema":**
Visibile come primo elemento dell'accordion in `Impostazioni` ✓.
Screenshot `mobile-portrait-settings.png` conferma: accordion "Tema" presente con chevron.

**Tab Play — FAIL critico:**

Playwright bounding box debug:
```
Header:   x=0,   w=390, padding=16px 24px, gap=16px, flex-wrap=nowrap
Logo:     x=24,  w=113  (ends at x=137)
Nav:      x=153, w=213  (ends at x=366, flex:1, justify-content:center, overflow-x:auto)
TabsList: x=153, w=213  (justify-content:center — Radix default)

Tab "Play":          x=94,  w=49  → ends x=143  ← BEFORE nav left edge (x=153)
Tab "Libreria":      x=143, w=70  → ends x=213  ← starts 10px before nav
Tab "Impostazioni":  x=213, w=103 → ends x=316  ✓ visible
Tab "Info & Privacy":x=315, w=111 → ends x=426  ← clips right (scrollable)
```

**Root cause:** `justify-content: center` su TabsList (Radix UI default, confermato da
`tabsListStyles.justifyContent = "center"`) combinato con:
- Totale width 4 tabs: ~357px (49+70+103+111+gaps ~24px)
- Container TabsList: 213px
- Centering offset: (213-357)/2 = **-72px** → il contenuto inizia 72px prima del bordo sinistro

Con `overflow-x: auto`, lo scroll a sinistra (scrollLeft < 0) è fisicamente impossibile in LTR.
Il tab Play (a x=94, prima del nav a x=153) è **inaccessibile**: non scorribile, parzialmente
sovrapposto al logo.

Il DoD item **"Tutti i 4 tab sono visibili e non coperti dal logo su viewport 390px"** NON è soddisfatto.

**Nota:** Playwright `isVisible()` ha restituito `true` per Play (l'elemento non è
CSS-hidden), ma il bounding box x=94 è fuori dal nav e sovrapposto al logo — falso positivo
del controllo di visibilità superficiale.

### mobile-landscape (844×390) — PASS

- ThemeSwitcher visibile in header (display=block, breakpoint sm=640px: 844 > 640) ✓
- All 4 tabs visibili (Play, Libreria, Impostazioni, Info & Privacy) ✓
- Accordion "Tema" in Settings non visibile (corretto: `block sm:hidden` → hidden ≥640px) ✓

### tablet (768×1024) — PASS

- ThemeSwitcher visibile in header (display=block) ✓
- All 4 tabs visibili ✓
- Accordion "Tema" non visibile in Settings (corretto) ✓

### desktop (1280×800) — PASS

Screenshot `desktop-default.png` conferma:
- Header a riga unica: logo + "Play | Libreria | Impostazioni | Info & Privacy" + ThemeSwitcher "90S PARTY → CYBERPUNK" ✓
- ThemeSwitcher visible: bounding box x>366, display=block ✓
- Nessuna regressione EP-021 ✓

---

## Criteri DoD — Valutazione

| Criterio | Stato |
|---|---|
| ≤639px: ThemeSwitcher assente dall'header | PASS — display:none confermato |
| ≥640px: header invariato (logo+tabs+switcher) | PASS — desktop/landscape/tablet ✓ |
| Tab Settings mobile: AccordionItem "Tema" visibile | PASS — primo elemento accordion ✓ |
| **Tutti i 4 tab visibili su 390px (no overlay)** | **FAIL — Play a x=94, nascosto (nav inizia a x=153)** |
| Nessuna regressione desktop EP-021 | PASS — screenshot desktop ✓ |
| npm run build verde | PASS — 0 errori TypeScript |

---

## Remediation consigliata — Iter 2

**Bug residuo:** `justify-content: center` su TabsList causa unsafe overflow sinistro su mobile.

**Fix suggerito** — aggiungere in `app-extra.css` nel blocco `@media (max-width: 639px)`:

```css
@media (max-width: 639px) {
  .sb-app-header {
    flex-wrap: nowrap;
  }
  .sb-app-header__nav {
    overflow-x: auto;
  }
  /* FIX: safe alignment — justify-content:center con overflow sinistro rende Play inaccessibile */
  .sb-app-header__tabs {
    justify-content: flex-start;
  }
}
```

Oppure aggiungere la Tailwind class `justify-start` (solo mobile) al `<TabsList>` in `App.tsx`:
```tsx
className="sb-app-header__tabs w-full ... justify-start sm:justify-center"
```

**Test di verifica iter 2:**
- Play tab bounding box x deve essere ≥ nav.x (153) su 390px
- Tutti i 4 tab con x+w ≤ viewport width (o almeno x ≥ 0 e visibile nel nav)

---

## Cleanup

```bash
pkill -f "serve dist" 2>/dev/null || true
```
