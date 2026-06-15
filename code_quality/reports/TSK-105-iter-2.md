# Code Review — TSK-105 (iter 2)

- **TSK**: TSK-105 — Aspect-ratio CSS invariante su `.sb-screen` (canvas idle no-jump)
- **Epic / Story**: EP-015 / US-055
- **Data**: 2026-06-15
- **Reviewer**: code-reviewer v2.21
- **Verdict**: **pass**
- **Iter**: 2 / 3 (loop_status: chiuso)

---

## Stack rilevato

| Campo | Valore | Confidenza |
|---|---|---|
| Linguaggio | TypeScript | 0.97 |
| Framework | React 18 | 0.97 |
| CSS strategy | CSS-in-JS template literal | 0.97 |
| Build tool | Vite | 0.95 |
| Modalita | guided (stack confermato) | — |

---

## Verdict

**pass** — 0 finding in tutte e tre le passate. I tre finding low dell'iter-1 sono stati chiusi correttamente con modifiche minimali al commento TSK-105 in `Player.tsx`. Nessuna regressione introdotta. Loop chiuso.

---

## Verifica fix iter-1

### F-105-01 — CHIUSO

**Regola**: `[^rule: code_quality/rules/canonical/CSS-DESIGN-001.md §Rationale]`

**Posizione**: `[^src5: packages/app/src/components/Player/Player.tsx:353]`

**Verifica**: Il commento ora riporta esplicitamente "Token locale soli-boy (non @soli92/solids DS)" nella riga del TSK-105 CSS block (riga 353). La custom property `--sb-canvas-aspect` è ora chiaramente marcata come token locale distinto dai token `--sd-*` del design system SoliDS. Finding chiuso.

---

### F-105-02 — CHIUSO

**Regola**: `[^rule: code_quality/rules/canonical/CSS-DESIGN-001.md §Rationale]`

**Posizione**: `[^src5: packages/app/src/components/Player/Player.tsx:354-355]`

**Verifica**: Il commento ora include "valore allineato a DEFAULT_SCREEN_ASPECT_RATIO in useVideoSettings.ts — modificare in sincronia" (righe 354-355). Il cross-reference tra la costante CSS (`--sb-canvas-aspect: 3 / 2`) e la costante JS (`DEFAULT_SCREEN_ASPECT_RATIO = "3 / 2"`) è ora esplicito. Una modifica futura all'uno dei due valori sarà accompagnata dall'istruzione di aggiornare l'altro. Finding chiuso.

---

### F-105-03 — CHIUSO

**Regola**: `[^rule: code_quality/rules/canonical/CSS-DESIGN-001.md §Rationale]`

**Posizione**: `[^src5: packages/app/src/components/Player/Player.tsx:358-360]`

**Verifica**: Il commento fullscreen ora recita "la UA applica width:100%/height:100% sul container — aspect-ratio resta attivo ma il container si espande a tutto schermo (verificato, visual oracle pass TSK-105)". La formulazione precedente ("la UA forza width/height espliciti con priorita' su aspect-ratio") è stata sostituita con una descrizione tecnicamente accurata del sizing algorithm CSS Fullscreen W3C: `aspect-ratio` dell'autore non viene sovrascritto, il container si espande perché i constraint UA ne determinano le dimensioni fisiche. Finding chiuso.

---

## Finding iter-2

Nessun nuovo finding nelle tre passate (idiomaticità, design, robustezza).

---

## Loop status

| Iterazione | Verdict | Finding (H/M/L) | Note |
|---|---|---|---|
| iter-1 | conditional | 0/0/3 | Tre finding low su commenti/documentazione |
| iter-2 (corrente) | **pass** | 0/0/0 | Tutti i finding chiusi; nessuna regressione |

max_iterations: 3 — loop chiuso a iter-2.

---

## Prossimo step

Nessuna azione richiesta. TSK-105 transita a `review_status: passed`. La fix funzionale (aspect-ratio invariante su `.sb-screen` in ogni stato Player) e la documentazione dei token CSS sono ora complete e corrette.
