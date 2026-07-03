# Visual Oracle Report — TSK-166 Iter 2

**Data:** 2026-07-03
**Iter:** 2
**Verdict:** PASS
**Agente:** visual-oracle-protocol

---

## Contesto

Iter 1 aveva dato `conditional` per un bug residuo: `justify-content: center` sul nav causava overflow a sinistra dei tab su 390px. Fix applicato in `app-extra.css`:

```css
@media (max-width: 639px) {
  .sb-app-header__nav {
    overflow-x: auto;
    justify-content: flex-start;  /* NUOVO */
  }
  .sb-app-header__tabs {
    justify-content: flex-start;  /* NUOVO */
    max-width: none;               /* NUOVO */
  }
}
```

---

## Build

- Comando: `npm run build` (tsc --noEmit + vite build)
- Esito: **verde**, nessun errore TypeScript
- Bundle: `dist/assets/index-D5OOnuwd.js 810.54 kB`

---

## Misurazioni Playwright

### mobile-portrait-390 (390×844)

| Tab | visible | x | y | w | h |
|---|---|---|---|---|---|
| Play | true | 93.625 | 22 | 49.156 | 28 |
| Libreria | true | 142.781 | 22 | 69.844 | 28 |
| Impostazioni | true | 212.625 | 22 | 102.563 | 28 |
| Info & Privacy | true | 315.188 | 22 | 110.516 | 28 |

ThemeSwitcher-in-header: **absent/hidden** (corretto — mobile)

### mobile-portrait-375 (375×667)

| Tab | visible | x | y | w | h |
|---|---|---|---|---|---|
| Play | true | 86.125 | 22 | 49.156 | 28 |
| Libreria | true | 135.281 | 22 | 69.844 | 28 |
| Impostazioni | true | 205.125 | 22 | 102.563 | 28 |
| Info & Privacy | true | 307.688 | 22 | 110.516 | 28 |

ThemeSwitcher-in-header: **absent/hidden** (corretto — mobile)

### desktop-1280 (1280×800)

| Tab | visible | x | y | w | h |
|---|---|---|---|---|---|
| Play | true | 429.797 | 22 | 49.156 | 28 |
| Libreria | true | 478.953 | 22 | 69.844 | 28 |
| Impostazioni | true | 548.797 | 22 | 102.563 | 28 |
| Info & Privacy | true | 651.359 | 22 | 110.516 | 28 |

ThemeSwitcher-in-header: **w=201.641, h=32** (corretto — desktop)

---

## Valutazione criteri

| Criterio | Atteso | Esito |
|---|---|---|
| mobile-390: tutti e 4 tab visible=true | true | PASS |
| mobile-390: tutti e 4 tab x >= 0 | x >= 0 | PASS (min x=93.625) |
| mobile-375: tab Play visible=true | true | PASS |
| desktop-1280: ThemeSwitcher-in-header w > 0 | w > 0 | PASS (w=201.641) |
| Nessun tab con bounding box nullo | box != null | PASS |

**Note:** Su 390px il tab "Info & Privacy" (x=315.2, w=110.5) supera il viewport di ~35px ma
l'overflow-x: auto consente lo scroll — il criterio richiede solo x >= 0 (no overflow sinistro),
soddisfatto. Il tab Play (il caso P0) è il primo a sinistra con x=93.625, pienamente visibile.

---

## Screenshot

Screenshots salvati in: `code_quality/reports/TSK-166-visual-iter-2/`
- `mobile-portrait-390.png`
- `mobile-portrait-375.png`
- `desktop-1280.png`

---

## Verdict

**PASS** — tutti i criteri di Iter 2 sono soddisfatti.

Il fix `justify-content: flex-start` applicato in Iter 1 risolve correttamente l'overflow sinistro:
- Su mobile (390px, 375px): header mostra logo + tutti e 4 i tab con x >= 0, ThemeSwitcher assente.
- Su desktop (1280px): layout header invariato con ThemeSwitcher visibile (w=201.641px).

Pipeline FE: develop ✓ → visual-oracle **PASS** ✓ → a11y → ux-ui-review → code-review
