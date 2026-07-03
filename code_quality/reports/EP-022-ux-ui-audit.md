# EP-022 — UX/UI Audit Multi-Viewport

**Data:** 2026-07-03
**Versione:** iter-1
**Target:** `packages/app/` — 4 viewport: mobile portrait, mobile landscape, tablet, desktop
**Modalità:** `no-visual` — evidenza raccolta da Read/Grep sul sorgente
**Rubrica:** Nielsen 10 + Responsiveness 6 + Flow-UX 5 (anti-soggettività)

---

## 1. Analisi strutturale dell'header (fondamento del P0)

**SVG logo** (`packages/app/src/assets/soliboy-logo-horizontal.svg`):
- Dimensioni intrinseche: `width="680" height="240"`, viewBox `0 0 680 240`
- Aspect ratio: 680 / 240 = **2.833 : 1**

**CSS applicato** (`packages/app/src/styles/solids-theme.css` righe 71-78):
- Regola 1: `.sb-logo { width:34px; height:34px; border-radius:...; background:...; display:flex; ... }`
- Regola 2 (override parziale): `.sb-logo { display:block; height:40px; width:auto; max-width:200px; }`
- Width calcolata a runtime: `height:40px` × AR 2.833 = **≈ 113px**

**ThemeSwitcher** (`packages/app/src/styles/app-extra.css` righe 101-116):
- Font: `var(--sd-font-mono, 12px)`, padding `6px 12px`
- Larghezza stimata totale: **≈ 198px** (su tema default 90s-party)

**Header flex container** (`app-extra.css` righe 67-77):
```css
.sb-app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sd-space-md, 12px);
  padding: var(--sd-space-md, 12px) var(--sd-space-lg, 20px);
  flex-wrap: wrap;  /* ← radice del problema P0 */
}
.sb-app-header__nav {
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 0;     /* permette shrink a 0 */
}
```

**Calcolo per viewport comuni (portrait)**:

| Device | Viewport | Disponibile (−40px pad) | Logo | ThemeSwitcher | 2× gap | Residuo nav |
|---|---|---|---|---|---|---|
| iPhone SE / 12 mini | 375px | 335px | 113px | 198px | 24px | **0px** |
| iPhone 14 | 390px | 350px | 113px | 198px | 24px | **15px** |
| iPhone 14 Pro Max | 430px | 390px | 113px | 198px | 24px | **55px** |
| Android comune | 360px | 320px | 113px | 198px | 24px | **wrappa** |
| Android mid | 412px | 372px | 113px | 198px | 24px | **37px** |

La larghezza minima del tab "Play" (`px-3 whitespace-nowrap text-sm`) è ≈ 66px. Su tutti i dispositivi 375–430px (maggioranza iPhone), il nav riceve meno di 66px → i tab trigger sono compressi o invisibili.

---

## 2. Bug Critico P0: Mobile Portrait (≤ 640px)

### FINDING P0-01 — Tab navigation non accessibile su iPhone 375–430px

**Elemento UI:** `sb-app-header` / `TabsList` (`App.tsx` righe 425-435, `app-extra.css` righe 67-98)
**Tipo:** Bug funzionale — blocco di navigazione
**Gravità:** P0
**rubric_ref:** `flow-ux-1`, `nielsen-7`, `responsiveness-breakpoint`

**Causa tecnica (P0-01-A — confermata dal codice):**

Il flex container `.sb-app-header` ha `flex-wrap: wrap`. I tre figli sono:
1. `h1` con `sb-logo`: larghezza calcolata 113px (invariante al viewport)
2. `nav.sb-app-header__nav`: `flex: 1; min-width: 0` — ottiene lo spazio residuo
3. `button.theme-switcher`: `white-space: nowrap`, larghezza ≈198px, `min-content-size` pari alla larghezza piena

Su 375px, il residuo per il nav è **0px**. Il TabsList con `overflow-x: auto` viene renderizzato in un container di larghezza 0-15px: i trigger rimangono nel DOM ma sono invisibili o richiedono micro-scroll su area di hit-test di 0px.

La descrizione del PO ("navbar va in overlay, Play rimane SOTTO il logo") corrisponde alla situazione in cui il ThemeSwitcher occupa tutta la prima riga assieme al logo e il nav collassa a zero o si accoda sotto in un flex-wrap.

**Causa tecnica (P0-01-B — aggravante):**

Su viewport < 335px (320px), la somma logo + ThemeSwitcher + 2 gap (335px) supera lo spazio disponibile: `flex-wrap` distribuisce i figli su due righe. La regola CSS `justify-content: space-between` su una singola riga con il nav a zero non garantisce che i tab compaiano dove l'utente li cerca.

**File di riferimento:**
- `packages/app/src/styles/app-extra.css`, righe 67-98
- `packages/app/src/App.tsx`, righe 420-438
- `packages/app/src/components/ThemeSelector/ThemeSwitcher.tsx`
- `packages/app/src/components/ui/tabs.tsx`, righe 23-35

**Fix raccomandato:**
- Breakpoint `@media (max-width: 640px)`: header in due righe — logo + ThemeSwitcher su riga 1, TabsList full-width su riga 2
- OPPURE: ThemeSwitcher ridotto a icona/dot su mobile (nasconde il testo)
- OPPURE: `flex-wrap: nowrap` con logo e ThemeSwitcher che cedono spazio al nav

---

## 3. Findings per Viewport

### VIEWPORT 1 — Mobile Portrait (≤ 640px)

**P0-01** — vedasi sopra (navigazione inaccessibile)

**P1-01 — Dimensione touch target: TabsTrigger sotto 44px**
- **Elemento:** `packages/app/src/components/ui/tabs.tsx` riga 30
- **Problema:** `TabsTrigger` ha `h-9` (36px) → altezza effettiva ≈ 28-32px. Token `--sd-layout-touch-target-min: 44px` dichiarato in `solids-theme.css` riga 48 ma non applicato ai trigger.
- **Gravità:** P1
- **rubric_ref:** `touch-target-min` (44×44px WCAG 2.5.5), `nielsen-7`

**P2-01 — Padding-top mancante in `sb-app-main`**
- **Elemento:** `app-extra.css` riga 91: `padding: 0 var(--sd-space-lg, 20px) var(--sd-space-lg, 20px)`
- **Problema:** Padding-top è 0. Contenuto a filo del border-bottom dell'header. Il prototipo (`output/prototypes/ep020/src/App.tsx` riga 153) aveva spazio verticale nel contenuto.
- **Gravità:** P2
- **rubric_ref:** `aesthetics-whitespace`

**P2-02 — Privacy banner riduce ulteriormente lo spazio utile**
- **Elemento:** `App.tsx` riga 443: `<PrivacyNotice variant="banner" ...>`
- **Problema:** Il banner si renderizza dentro `sb-app-main`, sopra il TabsContent, ogni volta che `!privacyAck`. Su mobile portrait, occupa ~60-80px aggiuntivi. Nessun auto-dismiss o riduzione contestuale.
- **Gravità:** P2
- **rubric_ref:** `nielsen-8`

**P2-03 — Drop-zone idle non accessibile da tastiera**
- **Elemento:** `App.tsx` righe 484-510: `<div className="drop-zone" onClick={...}>`
- **Problema:** Il div drop-zone ha `onClick` ma nessun `role`, nessun `tabIndex`, nessun `onKeyDown`. Il perimetro cliccabile più ampio non è raggiungibile da tastiera.
- **Gravità:** P2
- **rubric_ref:** `nielsen-7`, `a11y-keyboard-navigation`

---

### VIEWPORT 2 — Mobile Landscape (≤ 900px, orientamento orizzontale)

**P1-02 — Header non si compatta in landscape**
- **Elemento:** `app-extra.css` — assenza di regola `@media (orientation: landscape)` per `.sb-app-header`
- **Problema:** Header mantiene `padding: 12px 20px` in landscape. Su iPhone 14 landscape (844×390px), l'header occupa ≈64px = 16.4% dello schermo. Lo spazio per il canvas di gioco è ridotto.
- **Gravità:** P1
- **rubric_ref:** `responsiveness-reflow`, `nielsen-8`

**P2-04 — Padding laterale `sb-app-main` non ridotto in landscape**
- **Elemento:** `app-extra.css` riga 91: padding non overridato da `@media (orientation: landscape)`.
- **Gravità:** P2
- **rubric_ref:** `responsiveness-reflow`

**P2-05 — TouchOverlay config panel: overflow risk in portrait**
- **Elemento:** `TouchOverlay.tsx` righe 470-477: `position: "absolute"; top: 48; right: 8; width: 260`
- **Problema:** In portrait non-fullscreen, il pannello config (260px) posizionato con `right: 8` rispetto all'overlay. Se l'overlay è più stretto di 268px, il pannello straripa a sinistra.
- **Gravità:** P2
- **rubric_ref:** `responsiveness-overflow`, `nielsen-1`

**Positivo — Landscape 3-colonne correttamente implementato:**
La logica `isAbsoluteOverlay = isFullscreen || landscape` in `TouchOverlay.tsx` riga 240 e il CSS in `app-extra.css` righe 292-337 gestiscono correttamente il layout D-pad | schermo | pulsanti in landscape. L'implementazione `safe-area-inset-*` via `env()` è presente e corretta.

---

### VIEWPORT 3 — Tablet (641–1024px)

**P2-06 — Assenza layout tablet dedicato**
- **Elemento:** Assenza di breakpoint `md:` specifici per tablet nell'header e nel player
- **Problema:** Tra 641px e 767px, il layout è identico a mobile. Solo a 768px scatta `sb-play-row flex-direction: row` (`app-extra.css` riga 162). La range 641-767px è un "territorio grigio".
- **Gravità:** P2
- **rubric_ref:** `responsiveness-breakpoint`

**P2-07 — Library grid: salto brusco 3→5 colonne a 1024px**
- **Elemento:** `Library.tsx` riga 340: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- **Problema:** Nessun breakpoint `md:grid-cols-4`. A 1023px le card ROM sono 3 colonne, a 1024px diventano 5 colonne. Il salto è percettivamente brusco.
- **Gravità:** P2
- **rubric_ref:** `responsiveness-breakpoint`, `aesthetics-density`

**Positivo a tablet:**
- A 768px+ il `sb-play-row` switch a row correttamente
- Il `save-panel-desktop` passa a `width: 14rem` a 768px: proporzionato

---

### VIEWPORT 4 — Desktop (> 1024px)

**P2-08 — Nessun max-width cap su desktop wide**
- **Elemento:** `solids-theme.css` riga 68: `.sb-app { max-width: 100%; margin: 0; }`
- **Nota:** scelta documentata EP-021 ("full-width proto layout (no max-width cap)"). Da confermare col PO se definitiva.
- **Gravità:** P2
- **rubric_ref:** `aesthetics-density`, `nielsen-4`

**P2-09 — Player HUD: controlli player `justify-content: start` su tutta la larghezza**
- **Elemento:** `Player.tsx` riga 688: `.sb-player-controls { justify-content: start }`
- **Problema:** Su desktop wide, i controlli si allineano a sinistra mentre il Player screen può essere centrato → disallineamento visivo.
- **Gravità:** P2
- **rubric_ref:** `aesthetics-alignment`, `nielsen-4`

---

## 4. Finding Cross-Cutting: CSS Conflict `.sb-logo`

**P1-03 — Doppia regola `.sb-logo` con conflitto di proprietà**
- **Elemento:** `packages/app/src/styles/solids-theme.css` righe 71-78
- **Tipo:** Bug CSS / visual artifact
- **Gravità:** P1
- **rubric_ref:** `ds-conformance`, `aesthetics-consistency`

```css
/* Riga 71 — intent: icona box 34×34 */
.sb-logo {
  width: 34px; height: 34px; border-radius: var(--sd-radius-md);
  background: var(--sd-color-primary-subtle);
  color: var(--sd-color-primary-default);
  display: flex; align-items: center; justify-content: center; font-size: 20px;
}
/* Riga 78 — intent: img SVG orizzontale */
.sb-logo { display: block; height: 40px; width: auto; max-width: 200px; }
```

La regola 2 sovrascrive `display`, `height`, `width`. Rimangono dalla regola 1 (non sovrascritta): `background: var(--sd-color-primary-subtle)`, `border-radius: var(--sd-radius-md)`. Il background colorato può creare un "alone" intorno al SVG nelle aree trasparenti.

---

## 5. Delta vs Design Brief EP-020

| Specifica Brief | Implementazione | Delta | Gravità |
|---|---|---|---|
| §1 Cyberpunk: `--sd-radius-sm: 2px; --sd-radius-md: 4px` (sharp HUD) | `solids-theme.css` `:root { --sd-radius-sm:6px; --sd-radius-md:10px }` — nessun override `[data-theme="cyberpunk"]` | DELTA: radii non aggiornati per cyberpunk | P1 |
| §1 90s-party: `--sd-radius-md: 12px` | `:root { --sd-radius-md: 10px }` — 2px di scarto | DELTA minore | P2 |
| §1 Cyberpunk: `Font heading: Orbitron` | `--sd-font-heading: 'DM Sans','Inter',sans-serif` — nessun override `[data-theme="cyberpunk"]` | DELTA: Orbitron non applicato in cyberpunk | P1 |
| §2 Logo: `height: 2.5rem` | `height: 40px` (equivalente) | Allineato | — |
| §3 Nessun colore hardcoded | SVG logo ha `fill="#140b22"` hardcoded | DELTA minore | P2 |
| §5 Focus visible: `ring-[--sd-color-primary-default]` | Tab trigger usa token `ring` non `primary-default` | DELTA: token focus non allineato | P2 |

---

## 6. Domande Aperte

1. **Logo replacement**: L'entità della revisione (solo dimensioni/posizione o nuovo SVG) sblocca la dimensione del fix P0-01.
2. **ThemeSwitcher su mobile**: mantenere in header (tradeoff navigazione vs brand) o spostare in Settings?
3. **Landscape header**: header nascosto/ridotto in landscape per gaming experience ottimale?
4. **max-width desktop**: la scelta "no max-width cap" (EP-021) è definitiva?
5. **A11y scan completo**: richiede `run_a11y_scan` con Playwright — delegare a `/a11y`.

---

## 7. Priorità di Intervento

| # | ID | Titolo breve | File | Effort |
|---|---|---|---|---|
| 1 | P0-01 | Header flex-wrap: nav inaccessibile su 375-430px | `app-extra.css` 67-98, `ThemeSwitcher.tsx` | M |
| 2 | P1-01 | Touch target TabsTrigger < 44px | `components/ui/tabs.tsx` 30 | XS |
| 3 | P1-02 | Header non si compatta in landscape | `app-extra.css` — aggiungere media query landscape | S |
| 4 | P1-03 | `.sb-logo` CSS conflict, doppia regola | `solids-theme.css` 71-78 | XS |
| 5 | P1-04 | Radii cyberpunk non overridati | `solids-theme.css` — aggiungere `[data-theme="cyberpunk"]` radius | XS |
| 6 | P1-05 | Orbitron non applicato in cyberpunk | `solids-theme.css` — aggiungere font override | S |
| 7 | P2-01 | `sb-app-main` senza padding-top | `app-extra.css` 91 | XS |
| 8 | P2-05 | TouchOverlay config panel overflow | `TouchOverlay.tsx` 471 | S |
| 9 | P2-03 | Drop-zone non keyboard-accessible | `App.tsx` 484 | XS |
| 10 | P2-07 | Library grid salto 3→5 colonne | `Library.tsx` 340 | XS |

---

## Riepilogo

| Gravità | Count | Descrizione sintetica |
|---|---|---|
| P0 | 1 | Navigazione primaria inaccessibile su iPhone 375-430px (flex-wrap + ThemeSwitcher troppo largo) |
| P1 | 5 | Touch target sotto-spec, header landscape, CSS conflict logo, 2 delta brief (radii + font cyberpunk) |
| P2 | 7 | Padding, overflow panel, keyboard-a11y drop-zone, grid library, desktop widescreen |
| Open questions | 5 | Logo spec, ThemeSwitcher mobile, landscape header, max-width, a11y scan completo |

**Verdict:** `reject` su mobile portrait (P0-01 è blocco funzionale). Gli altri finding sono miglioramenti e delta vs brief. Il blocco funzionale è risolvibile con una singola media query mobile sull'header e riduzione/spostamento del ThemeSwitcher su viewport stretti.
