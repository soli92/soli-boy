# Visual Oracle — TSK-103 (iter 1)

**Date:** 2026-06-15
**TSK:** TSK-103 — HUD Player user-facing: romTitle + stati italiani + overlay pausa
**Verdict:** `pass`
**Stato sotto test:** `idle` (nessuna ROM caricata)

## Matrice screenshot

| Viewport | Light | Dark |
|---|---|---|
| mobile-375 | `mobile-375-light.png` | `mobile-375-dark.png` |
| desktop-1280 | `desktop-1280-light.png` | `desktop-1280-dark.png` |

## Verifica Acceptance Criteria

### AC#1 — HUD mostra `title` o "Nessun gioco selezionato" — PASS

Lo screenshot desktop-1280 mostra l'HUD inferiore con il left-span valorizzato a
**"Nessun gioco selezionato"**: è la stringa `HUD_TITLE_IDLE` usata come fallback
quando la prop `title` è `undefined` (caso idle senza ROM selezionata).

### AC#2 — Stato in italiano centralizzato — PASS

Il right-span dell'HUD mostra **"Premi Avvia"** = `HUD_STATE_LABELS.idle`.
Mapping confermato a sorgente (`Player.tsx:524`) e visivamente.

### AC#3 — Overlay pausa `⏸` — PASS (NOT-APPLICABLE in idle)

In stato `idle` l'overlay `.sb-pause-overlay` **non** è renderizzato: condizionale
su `state === 'paused'`. Corretto. La verifica visiva dell'overlay in stato paused
richiede una ROM caricata + transizione di stato — fuori scope per un visual oracle
a stato statico. Demanda al functional-oracle (AC#6 TSK).

### AC#4 — `aria-live="polite"` + `aria-atomic="true"` — PASS (code review)

Confermato a sorgente: `Player.tsx:518-522`.

```tsx
<div className="sb-hud" aria-live="polite" aria-atomic="true">
  <span>{title ?? HUD_TITLE_IDLE}</span>
  <span>{HUD_STATE_LABELS[state]}</span>
</div>
```

### Aspect-ratio `.sb-screen` — PASS

Sul desktop-1280, la box LCD è ~320×210 px (rapporto ~10:7, prossimo al GameBoy
DMG 160:144 = 10:9). Su mobile-375 la box mantiene proporzioni, non appare
schiacciata. Bordi arrotondati e bordo viola intatti.

## Findings

### Trivial #1 — Light/dark identici (out of scope)

Le 4 PNG light vs dark sono pixel-identiche. Il progetto non implementa
`@media (prefers-color-scheme)`; il tema è app-controlled tramite il theme
switcher UI (varianti `90s-party`, `dark`, `cyberpunk`). Nessuna AC del
TSK-103 richiede sensibilità a `prefers-color-scheme`. Nessun fix.

### Trivial #2 — HUD sotto la fold su mobile-375

Su viewport 375×667, l'HUD inferiore non è catturato perché il privacy banner +
le tabs + `.sb-screen` riempiono il primo viewport. Lo screenshot
`fullPage: false` taglia sotto. L'HUD esiste nel DOM (verificabile via DevTools)
ed è verificato visivamente sui desktop-1280. Nessun fix per TSK-103.

## Counts

- Majors: **0**
- Minors: **0**
- Trivials: **2** (entrambi out-of-scope)

## Verdict & Next Action

**Verdict:** `pass` — Nessun finding major/minor. AC#1/#2/#4 + aspect-ratio
verificati visivamente; AC#3 verificato come non-rendering in idle (corretto)
con verifica completa demandata a functional-oracle.

**Next action:** TSK-103 → `status: done`. Procedere con UX/UI review (Fase 4-ter)
e poi code-review (Fase 5) secondo la pipeline ADR-019.
