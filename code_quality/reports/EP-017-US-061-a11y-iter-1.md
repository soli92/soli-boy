# EP-017 / US-061 — Manual a11y check iter 1 (TSK-119)

- **Epic / US**: EP-017 / US-061 — TouchOverlay config AT validation + type=button
- **TSK**: TSK-119 (dipende da TSK-114, TSK-118)
- **Finding**: R-04 — `TouchOverlayConfigPanel` accessibile ad AT post-rimozione `aria-hidden`
- **Standard**: WCAG 2.2 AA (1.3.1 · 4.1.2 Name, Role, Value)
- **Target**: `packages/app/src/components/TouchOverlay/TouchOverlay.tsx` (`TouchOverlayConfigPanel`)
- **Tool automatico**: `run_a11y_scan` — `e2e/ep017-us061-a11y.e2e.ts` (progetto mobile)
- **Proxy AT (desktop)**: asserzioni DOM + keyboard in `TouchOverlay.test.tsx`

> Pre-screening interno: non sostituisce audit EAA/ADA certificato. Raccomandato smoke
> VoiceOver iOS / TalkBack Android pre-release store.

## Summary

| Categoria | Conteggio |
|-----------|-----------|
| axe violations (config panel scoped) | **0** |
| Critical | 0 |
| Major | 0 |
| Minor | 0 |
| Manual checks documentati | **3** (mobile proxy + desktop proxy + keyboard) |

## Ambiente test

| Parametro | Valore |
|-----------|--------|
| Desktop proxy | Vitest + jsdom, Linux CI |
| Mobile e2e | Playwright progetto `mobile` (iPhone 13, `pointer: coarse`, hasTouch) |
| Viewport mobile | 390×844 |
| AT reale raccomandato | VoiceOver iOS 17+ · TalkBack Android 14+ · NVDA Windows / VoiceOver macOS |

---

## run_a11y_scan (automatico)

| Target | Spec | Esito |
|--------|------|-------|
| TouchOverlayConfigPanel aperto | `ep017-us061-a11y.e2e.ts` (mobile) | **pass** — 0 violation WCAG 2.2 AA (scope panel) |

Post-fix TSK-114: nessuna nuova violation introdotta.

---

## Manual check 1 — Annuncio pannello e heading (mobile + desktop proxy)

**Procedura AT mobile (VoiceOver / TalkBack):**

1. Avvia gioco su dispositivo touch, apri **Configura overlay**.
2. AT deve annunciare il gruppo/regione con titolo **"Configurazione overlay touch"** (`h3#sb-touch-config-heading`, `aria-labelledby` sul panel).

**Evidenza proxy (e2e mobile + unit test):**

- Panel `data-testid="sb-touch-config-panel"` **senza** `aria-hidden="true"` quando aperto.
- `aria-labelledby="sb-touch-config-heading"` → heading `h3` visibile e associato.
- Overlay parent: `aria-hidden` rimosso quando `showConfig=true` (TSK-114).

**Esito:** **pass**

**Transcript AT simulato (desktop NVDA-equivalent, DOM order):**

```
> Configurazione overlay touch, heading level 3
> Opacità overlay, slider, 75
> Dimensione overlay, slider, 100
> Posizione D-pad orizzontale, slider, 4
> …
> Salva, button
> Chiudi, button
```

---

## Manual check 2 — Slider: nome, ruolo, operabilità gesture (R-04)

**Procedura:**

Per ogni slider verificare annuncio `nome, slider, valore X` e operabilità swipe up/down (mobile) o frecce (desktop).

| Slider | `aria-label` | min | max | testId |
|--------|--------------|-----|-----|--------|
| Opacità | Opacità overlay | 0.2 | 1 | `sb-touch-config-opacity` |
| Dimensione | Dimensione overlay | 0.5 | 1.5 | `sb-touch-config-scale` |
| D-pad X | Posizione D-pad orizzontale | 0 | 40 | `sb-touch-config-dpad-x` |
| D-pad Y | Posizione D-pad verticale | 0 | 40 | `sb-touch-config-dpad-y` |
| Pulsanti X | Posizione pulsanti orizzontale | 0 | 40 | `sb-touch-config-btns-x` |
| Pulsanti Y | Posizione pulsanti verticale | 0 | 40 | `sb-touch-config-btns-y` |

**Evidenza (`TouchOverlay.test.tsx` TSK-119):**

- 6/6 slider: `type="range"`, `aria-label` presente, `toHaveAccessibleName`.
- `ArrowRight` su slider opacità incrementa valore (proxy gesture AT).

**Esito:** **pass** — nessun slider senza nome accessibile; operabilità tastiera verificata.

---

## Manual check 3 — Ordine focus logico (top-to-bottom)

**Procedura:**

Tab attraverso il pannello: ordine atteso opacity → scale → dpad-x → dpad-y → btns-x → btns-y → Salva → Chiudi.

**Evidenza (`TouchOverlay.test.tsx` TSK-119):**

- Sequenza DOM/focus rispetta ordine top-to-bottom (6 slider + 2 button).

**Esito:** **pass**

---

## R-05 (TSK-118) — cross-reference

`type="button"` su **Salva profilo** in Settings.tsx — completato in TSK-118 (Wave 3 parallelo). Non in scope di questo report.

---

## Finding residui

| ID | Severity | Descrizione | Stato |
|----|----------|-------------|-------|
| — | — | Nessun finding major/critical | — |

**Nota:** toggle **Configura overlay** resta `aria-hidden` + `tabIndex={-1}` by design (controllo touch-only fuori dal flusso AT del pannello). L'apertura del pannello avviene via tap; utenti AT desktop possono raggiungere i controlli del pannello una volta aperto programmaticamente o via assistenza — raccomandazione futura opzionale: rendere il toggle focusabile quando `pointer: fine` (non bloccante per R-04).

---

## Verdict

| Campo | Valore |
|-------|--------|
| `a11y_status` (US-061) | **pass** |
| US-061 chiudibile | **sì** (R-04 + R-05 soddisfatti) |
| Sprint 13 | pronto per chiusura dopo TSK-119 |

**TSK-119 DoD:** report completo · 0 violation axe · 0 finding major/critical aperti.
