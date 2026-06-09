---
report_id: uxui-review-2026-06-09-soliboy-ia-redesign
agent: ux-ui-reviewer (ADR-020, US-030)
schema: ux_ui_review
mode: no-visual
timestamp: 2026-06-09
rubric_mode: strict
target_design: code_quality/reports/_adhoc/uxui-design-2026-06-09-soliboy-ia-redesign.md
tsk: adhoc
verdict: conditional
---

# UX/UI Review — Soli-boy IA Redesign

> Prodotto dal ux-ui-reviewer (faccia Review della capability [[ux-ui-review-design-capability]]).
> Mode: no-visual dichiarata (proposta di design pre-implementazione, nessun rendering da catturare).
> Evidenza raccolta via Read/Grep su `packages/app/src/`.

---

## Verdict: CONDITIONAL

La proposta di redesign IA è **strutturalmente solida** e risolve correttamente i 3 finding
confermati. Un solo conditional blocker (C-01) deve essere risolto prima dell'implementazione.
Nessun reject.

**Sintesi in 3 righe:**
1. La navigazione a 4 tab risolve F-01 (muro di configurazione) — ancoraggio rubrica corretto, evidenza da Settings.tsx confermata.
2. Il riposizionamento TouchOverlay su `.sb-screen` è tecnicamente sound (Variante A confermata); la descrizione del bug nel design contiene un'imprecisione sulla gerarchia DOM che non inficia la fix ma va corretta nella spec implementativa.
3. L'assunzione A-01 (Player sempre montato senza avviare il core) è supportata dal codice per il path normale ma espone un rischio latente in `useAppLifecycle.resume()` su engine idle — da verificare prima di commitarsi sull'architettura always-mounted.

---

## Findings

### F-R01 — minor | Structural accuracy
**rubric_ref:** nielsen-1 (visibility of system status — precondizione per fix corretta)

**Title:** TouchOverlay anchor: scope del bug è più circoscritto di quanto descritto

La proposta afferma che `TouchOverlayInner` flotta sopra tutta la pagina (Settings, Library,
etc.) perché ancorato a `<section .sb-app>`. Evidence dal sorgente:

- `Player.tsx:247` — Player renderizza `<section className="sb-app">`, non `<main>`.
- `App.tsx:147` — App usa `<main className="sb-app">`.
- Il TouchOverlay è figlio della `<section .sb-app>` del Player, non del `<main>` di App.

In realtà `.sb-screen` non ha `position: relative` nel CSS statico (`solids-theme.css:153-156`).
La `position: relative` è iniettata a runtime da un tag `<style>` scopato (Player.tsx:257,
selettore `.sb-screen[data-video-scope="..."]`). I valori percentuali `dpadOffsetX/Y` e
`buttonsOffsetX/Y` (TouchOverlay.tsx:176,185) sono quindi relativi al nearest positioned ancestor
del container overlay, non a `.sb-screen` — questo è il bug reale, ed è quello che la Variante A
risolve correttamente.

**Raccomandazione:** Correggere la descrizione del bug nella spec implementativa. La fix
(montare TouchOverlay come figlio di `screenRef`) rimane corretta; verificare che il selettore
scopato `position: relative` si applichi correttamente anche con il nuovo child. Non blocca
l'implementazione.

---

### F-R02 — conditional | Assumption risk
**rubric_ref:** nielsen-1 + flow-ux-3 (error prevention in design assumptions)

**Title:** A-01 (WasmBoy always-mounted): rischio latente in `useAppLifecycle.resume()`

Il codice conferma che `WasmBoy.config()` e `WasmBoy.loadROM()` sono chiamati solo dentro
`handlePlay()` → `wrapper.load()`. Il mount del componente non avvia il core. **A-01 è positiva
per il path normale.**

Tuttavia: `useAppLifecycle` (Player.tsx:151) osserva la Visibility API e chiama
`wrapper.resume()` al ripristino della visibilità. `WasmBoyEngine.resume()` chiama
`WasmBoy.play()` senza un guard `!this.configured` (`wasmboy-engine.ts:76-80`). Se il Player
è montato (tab non attiva) ma il gioco non è mai stato avviato, un evento di visibilità
potrebbe chiamare `WasmBoy.play()` su un engine non configurato.

**Raccomandazione (blocker C-01):** Prima dell'implementazione, verificare che
`useAppLifecycle.resume()` su engine idle sia un no-op, oppure aggiungere un guard
(`if (wrapper.currentState === 'idle') return`) nel lifecycle hook. Se confermato safe, A-01
diventa high confidence e l'architettura always-mounted è validata.

---

### F-R03 — minor | Design system gap
**rubric_ref:** ui-visual-4 (consistency with design system tokens)

**Title:** Nessun `sd-tab` o `sd-accordion` in `@soli92/solids` — confermato da source scan

`grep sd-tab|sd-accordion` sull'intera directory `@soli92/solids/dist/css/` — nessun match.
L'assunzione A-04 (confidence: low) del designer è corretta. Il markup ARIA proposto
(role=tab, aria-selected, role=tabpanel, aria-expanded) è semanticamente corretto per il
WAI-ARIA Tab Panel pattern, indipendentemente dai token DS.

**Raccomandazione:** Implementare con classi `sb-tab-bar` / `sb-accordion` custom, coerenti
con la nomenclatura `sb-btn` / `sb-sel` / `sd-card` esistente. Aprire una DS extension request
per `@soli92/solids` v2+. Non blocca l'implementazione.

---

### F-R04 — minor | Nav pattern
**rubric_ref:** nielsen-7 (flexibility and efficiency) + flow-ux-1 (primary task reachability)

**Title:** Label truncation a 320px viewport: 4 tab con label lunghe non indirizzata

I label [Play, Libreria, Impostazioni, Info & Privacy] a viewport 320px con 4 tab uguali
equivalgono a ~80px per tab. "Impostazioni" (12 chars) e "Info & Privacy" (14 chars)
richiedono truncation o font ridotto. Il wireframe §3b specifica "icon + label" ma non
definisce le icone.

**Raccomandazione:** Definire una strategia di truncation (icon-only sotto 375px, o label
abbreviate: "Settings" → "Impost.", "Info & Privacy" → "Info"). Dettaglio per la spec
implementativa, non un blocker IA.

---

### F-R05 — PASS | IA resolution
**rubric_ref:** nielsen-8 (aesthetic and minimalist design) + flow-ux-2 (cognitive load)

**Title:** Nav a 4 tab risolve F-01 (Settings wall) — strutturalmente corretto

`Settings.tsx:394-625` conferma 7 sezioni sempre renderizzate in sequenza verticale.
La proposta separa Play/Libreria/Impostazioni/Info per obiettivo utente distinto e accordiona
le 5 sotto-sezioni di Settings. Entrambi gli interventi riducono il cognitive load al primo
avvio. **Assessment: pass.**

---

### F-R06 — PASS | TouchOverlay fix soundness
**rubric_ref:** ui-visual-2 (spatial layout coherence) + flow-ux-4 (direct manipulation proximity)

**Title:** Variante A (anchor a `.sb-screen`) è tecnicamente sound

`Player.tsx:297-331` — `.sb-screen` div con `ref={screenRef}`. `useFullscreen(screenRef)`
(Player.tsx:162) porta i figli con sé in fullscreen. La `position: relative` scopata
si applicherà correttamente al nuovo child TouchOverlay. Il `zIndex:10` del overlay è
superiore al canvas (nessun z-index esplicito su `.sb-canvas-host`). **Assessment: pass con nota
implementativa** (aggiungere `z-index:1` su `.sb-canvas-host` per chiarezza dello stacking).

---

### F-R07 — minor | A11y design
**rubric_ref:** ui-a11y-1 (landmark structure) + ui-a11y-2 (focus management)

**Title:** hidden attribute vs conditional render: distinzione necessaria per Player panel

Il markup proposto (§8) usa `hidden` su tutti i panel inattivi. Per il Player panel questa
è la scelta obbligata (always-mounted). Per Library, Settings, Info il conditional render
è più semplice e accettabile (nessuno stato background da preservare).

**Raccomandazione:** Specificare nella impl spec: Player panel = `hidden` attribute (no unmount);
altri 3 panel = `{activeTab === '...' && <Componente />}` (unmount accettabile). Evita
la complessità di tenere Library/Settings nel DOM senza necessità.

---

### F-R08 — PASS | Emulator-first
**rubric_ref:** nielsen-1 (visibility of system status) + flow-ux-1 (primary task first)

**Title:** Idle viewport placeholder risolve il problema di identità dell'app

`App.tsx:170-187` — `{selected && <Player ...>}`: nessun viewport al primo avvio.
La proposta risolve correttamente con always-mounted Player + idle placeholder.
Nota per l'implementazione: il testo corrente `"Premi Avvia"` (Player.tsx:320, stato idle)
dovrà essere aggiornato al testo proposto ("Seleziona un gioco dalla Libreria per iniziare")
nel nuovo flusso. **Assessment: pass.**

---

## Conditional Blockers

| ID | Finding | Condizione | Owner |
|---|---|---|---|
| C-01 | F-R02 | Verificare `useAppLifecycle.resume()` safe su engine idle (o aggiungere guard). Elevare A-01 a high confidence. | fe-dev / maintainer |

---

## Valutazione Open Questions del designer

| OQ | Valutazione reviewer | Priorità |
|---|---|---|
| OQ-01 (Player montato in bg?) | Ben posta. F-R02 aggiunge un rischio specifico da risolvere come parte della risposta. Raccomandazione: always-mounted + CSS-hidden + guard in useAppLifecycle. | Alta (blocca C-01) |
| OQ-02 (Auto-switch a Play dopo selezione ROM?) | Ben posta. Da UX (nielsen-1, flow-ux-1) l'auto-switch è preferibile: l'intento utente di selezionare una ROM è giocarla. Decisione prodotto. | Media |
| OQ-03 (FileLoader: solo in Library o anche in Play idle?) | Ben posta. Raccomandazione: Play tab mostra un CTA link "Vai alla Libreria" (navigazione, non duplicazione), FileLoader resta canonico in Library. | Bassa |
| OQ-04 (Variante A vs Variante B TouchOverlay) | Ben posta. F-R06 conferma Variante A sound. Raccomandazione: Variante A come primo step, Variante B come enhancement paesaggio. Non mutualmente esclusivi. | Media |
| OQ-05 (Accordion Settings: sezioni condizionali omesse o disabled?) | Ben posta. Coerente col pattern attuale (Settings.tsx): omettere quando prop assente. Accordion: ometti sezioni vuote (nielsen-8). | Bassa |
| OQ-06 (Privacy tab: sempre visibile o solo se non confermata?) | Ben posta. Raccomandazione reviewer: sempre visibile (requisito di accessibilità/GDPR, App Store compliance). Il banner di primo avvio è ortogonale alla disponibilità della tab. | Media |

---

## Rubric Summary

| Dimensione | Rating | Note |
|---|---|---|
| N1 Visibility of system status | pass | Idle placeholder + emulator-first |
| N2 Match real world | pass | Label tab coerenti col modello mentale |
| N3 User control | pass | Navigazione reversibile, nessuna azione distruttiva |
| N4 Consistency standards | pass | Pattern tab standard, ARIA corretto |
| N5 Error prevention | conditional | F-R02 (A-01 resume risk) |
| N6 Recognition over recall | pass | Tab labels + idle placeholder |
| N7 Flexibility & efficiency | minor | F-R04 (label truncation) |
| N8 Aesthetic minimalist | pass | Risolve F-01 Settings wall |
| UV4 DS consistency | minor | F-R03 (no sd-tab/sd-accordion) |
| UV6 Responsive | minor | F-R04 (narrow viewport) |
| FU1 Primary task reachability | pass | Play tab default |
| FU2 Cognitive load | pass | Tab + accordion |
| FU3 Error prevention | conditional | F-R02 |
| FU4 Direct manipulation | pass | F-R06 TouchOverlay |
| FU5 Feedback | pass | Tab active state, accordion state |

---

## Prossimi passi raccomandati

1. **Resolve C-01**: maintainer/fe-dev verifica `useAppLifecycle.resume()` su engine idle. Se safe → A-01 diventa high confidence → architettura always-mounted validata.
2. **Rispondere OQ-01..OQ-06** con maintainer (OQ-01 priorità alta, dipende da C-01).
3. **Correggere la descrizione del bug TouchOverlay** nella spec implementativa (F-R01).
4. **Passare a fe-dev** per implementazione con le note F-R03 (custom classes DS), F-R07 (hidden vs conditional render), F-R06 (z-index stacking note).

---

*Review prodotta da ux-ui-reviewer (ADR-020, US-030). Il reviewer non progetta: valutazioni only. Per alternative di design invocare `/ux-ui-design` o l'agente `ui-designer`.*
