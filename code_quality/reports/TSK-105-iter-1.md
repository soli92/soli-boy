# Code Review — TSK-105 (iter 1)

- **TSK**: TSK-105 — Aspect-ratio CSS invariante su `.sb-screen` (canvas idle no-jump)
- **Epic / Story**: EP-015 / US-055
- **Data**: 2026-06-15
- **Reviewer**: code-reviewer v2.21
- **Verdict**: **conditional**
- **Iter**: 1 / 3 (loop_status: aperto)

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

**conditional** — 3 finding low, 0 blocking. La fix funzionale (aspect-ratio CSS invariante + rimozione branch else stretch) e corretta, robusta e verificata dal visual oracle (pass iter-1, 213px vs 24px baseline rotta). I tre finding riguardano esclusivamente documentazione/commenti: due imprecisioni di contratto e un commento tecnicamente inesatto sul behavior UA in fullscreen. Nessun finding impatta il comportamento runtime.

---

## Finding (ordinati per severity)

### F-105-01 — low | Passata: idiomaticita

**Regola**: `[^rule: code_quality/rules/canonical/CSS-DESIGN-001.md §Rationale]`

**Titolo**: CSS custom property `--sb-canvas-aspect` senza marcatura "token locale" esplicita.

**Posizione**: `[^src5: packages/app/src/components/Player/Player.tsx:359]`

**Descrizione**: La custom property `--sb-canvas-aspect: 3 / 2` e' definita localmente nel CSS scoped di Player.tsx — non proviene da SoliDS. Tuttavia, nello stesso blocco `<style>` sono presenti token DS (`--sd-color-text-primary`). Senza una marcatura esplicita, un futuro maintainer non puo' distinguere a colpo d'occhio i token locali da quelli del design system. La regola CSS-DESIGN-001 richiede che il contratto dei token sia esplicito: il fallback `#f0e9ff` accanto a `--sd-color-text-primary` soddisfa la regola per quel token; `--sb-canvas-aspect` invece manca di commento di provenienza.

**Suggerimento**: Aggiungere `/* token locale soli-boy, non @soli92/solids */` sulla stessa riga o sopra la dichiarazione `--sb-canvas-aspect: 3 / 2`.

---

### F-105-02 — low | Passata: design

**Regola**: `[^rule: code_quality/rules/canonical/CSS-DESIGN-001.md §Rationale]`

**Titolo**: `DEFAULT_SCREEN_ASPECT_RATIO` (JS) e `--sb-canvas-aspect` (CSS) condividono il valore `3 / 2` senza riferimento reciproco.

**Posizione**: `[^src5: packages/app/src/components/Player/useVideoSettings.ts:194]` + `[^src5: packages/app/src/components/Player/Player.tsx:359]`

**Descrizione**: `DEFAULT_SCREEN_ASPECT_RATIO = "3 / 2"` in useVideoSettings.ts governa l'aspect-ratio inline per `aspect="original"`. `--sb-canvas-aspect: 3 / 2` in Player.tsx governa il fallback CSS per `aspect="stretch"`. Entrambi rappresentano il medesimo vincolo (GBA nativo 3:2), ma sono costanti separate senza cross-reference. Una modifica isolata di una crea una divergenza silenziosa (nessun errore di build, nessun test failure). Il JSDoc aggiornato di `videoSettingsToContainerStyle` menziona TSK-105 e la meccanica del fallback CSS, ma non cita `DEFAULT_SCREEN_ASPECT_RATIO` come valore di riferimento.

**Suggerimento** (inline, bassa invasivita): Aggiungere nel commento TSK-105 di Player.tsx: `/* valore = DEFAULT_SCREEN_ASPECT_RATIO (useVideoSettings.ts:194) — modificare in sincronia */`. Alternativa strutturale (fuori scope iter-2): unificare il valore tramite una costante CSS iniettata dinamicamente, allineando i due branch.

---

### F-105-03 — low | Passata: robustezza

**Regola**: `[^rule: code_quality/rules/canonical/CSS-DESIGN-001.md §Rationale]`

**Titolo**: Commento sul behavior UA in `:fullscreen` e' tecnicamente impreciso.

**Posizione**: `[^src5: packages/app/src/components/Player/Player.tsx:357]`

**Descrizione**: Il commento afferma "in :fullscreen la UA forza width/height espliciti con priorita' su aspect-ratio". La specifica CSS Fullscreen (W3C) definisce che lo UA stylesheet applica `width: 100%; height: 100%` ma non sovrascrive l'author stylesheet per `aspect-ratio` — il calcolo del layout rimane standard e `aspect-ratio` dell'autore partecipa normalmente al sizing algorithm. Il risultato pratico (fullscreen non rotto) e' corretto e confermato dal visual oracle; il rischio e' che un maintainer futuro rimuova la custom property ritenendola ininfluente in fullscreen, introducendo una regressione. Finding low perche' non impatta il comportamento runtime corrente.

**Suggerimento**: Sostituire la frase con: "Fullscreen non impattato: in :fullscreen la UA applica width:100%/height:100% — `aspect-ratio` resta attivo ma il container si espande a tutto schermo (comportamento verificato, visual oracle pass TSK-105)."

---

## Loop status

| Iterazione | Verdict | Finding (H/M/L) | Note |
|---|---|---|---|
| iter-1 (corrente) | conditional | 0/0/3 | Prima iterazione |

max_iterations: 3 — iter rimanenti: 2.

---

## Prossimo step

**Azione**: il dev-agent riceve il `task_package` con i tre finding di documentazione. Fix attesa: ~6-10 righe di diff in commenti/JSDoc (max_diff_lines: 20). Nessuna modifica logica richiesta. Alla successiva `/review TSK-105` il verdict atteso e' `pass` se i tre finding sono chiusi senza regressioni.

**Blast radius**: nessuno (Graphify non invocato — diff di entita' bassa, solo commenti).
