# UX/UI Review Report — TSK-166 Iter 1

**Data:** 2026-07-03
**Target:** TSK-166 — Fix P0 mobile portrait navbar (EP-022 / US-105)
**Iter:** 1
**Verdict:** conditional
**Mode:** no-visual (sorgente Read/Grep + dati visual-oracle TSK-166-visual-iter-2.md)
**Agente:** ux-ui-reviewer
**Rubrica:** nielsen-10 + ui-dim-6 + flow-ux-5 (anti-soggettività, strict)

---

## Evidenza raccolta

| Fonte | Tipo |
|---|---|
| `packages/app/src/App.tsx` righe 438-447 | Sorgente — wrap ThemeSwitcher `hidden sm:block` |
| `packages/app/src/components/Settings/Settings.tsx` righe 403-432 | Sorgente — AccordionItem `theme-mobile` |
| `packages/app/src/styles/app-extra.css` righe 107-119 | Sorgente — `@media (max-width: 639px)` defensive rule |
| `packages/app/src/styles/solids-theme.css` righe 70-80 | Sorgente — `.sb-logo` unificata |
| `packages/app/src/components/ThemeSelector/ThemeSwitcher.tsx` | Sorgente — comportamento e stato visivo |
| `packages/app/src/components/ThemeSelector/ThemeSelector.tsx` | Sorgente — ThemeSelector full (RadioGroup, 3 temi) |
| `code_quality/reports/TSK-166-visual-iter-2.md` | Visual oracle — misurazioni Playwright iter-2 PASS |

---

## Findings

### F1 — Discoverability: nessun affordance in header per tema su mobile
- **rubric_ref:** nielsen-6 (Recognition rather than Recall), flow-ux-3 (Findability)
- **Tipo:** Problema oggettivo
- **Severità:** Medium

**Evidenza:** `App.tsx` righe 445-447 — `<div className="hidden sm:block"><ThemeSwitcher .../></div>`: su viewport ≤640px il ThemeSwitcher è `display:none` nell'header. Il flexbox dell'header (`sb-app-header`) mostra soltanto `[logo] [nav]` su mobile; nessun elemento residuo indica che un controllo tema esiste altrove. Il design brief EP-020 §5 specifica visibility of system status come invariante.

**Impatto:** Un utente che conosceva il ThemeSwitcher nell'header non trova indizi in loco per dedurre che il controllo è stato spostato in Settings. Il passaggio da "sempre visibile" a "nascosto + reperibile solo con navigazione a un'altra tab" costituisce un aumento del carico mnestico (nielsen-6: recognition → recall).

**Fattori mitiganti:**
- L'AccordionItem "Tema" è il **primo** elemento dell'Accordion in `Settings.tsx` (riga 417) su mobile — posizione ottimale per il discovery all'interno della tab.
- Il tab "Impostazioni" è etichettato in modo chiaro (contenuto aspettato: impostazioni dell'app).
- Il ThemeSwitcher stesso, una volta trovato, comunica il tema attivo via `aria-label` e label testuale (vedi F3-POSITIVO).

**Non è una preferenza:** l'assenza di un affordance "dove si trova il tema" in header è una deviazione misurabile rispetto al principio nielsen-6. Non si tratta di giudizio sul design della soluzione (che è una scelta PO documentata), ma sulla presenza/assenza di un indicatore di localizzazione.

---

### F2 — Tap count regression: cambio tema su mobile
- **rubric_ref:** flow-ux-3 (Findability), nielsen-7 (Flexibility and Efficiency of Use)
- **Tipo:** Problema oggettivo, tradeoff documentato (decisione PO)
- **Severità:** Low-Medium (contestuale, non blocca)

**Evidenza (calcolata dal sorgente):**

| Scenario | Tap necessari | Path |
|---|---|---|
| Prima di TSK-166 (mobile) | 1 | Tap ThemeSwitcher in header |
| Dopo TSK-166 (mobile, da tab Play) | 4 | (1) Tap "Impostazioni" tab → (2) ThemeSwitcher non è visibile finché accordion è chiuso → (3) Tap trigger accordion "Tema" → (4) Tap ThemeSwitcher |

La regressione da 1 a 4 interazioni è obiettiva (nielsen-7: efficienza degli utenti esperti). La decisione è documentata nel TSK-166 `## Context` come scelta PO esplicita per risolvere il P0. Il finding è registrato per completezza del quadro UX, non come blocco.

---

### F3 — Tab scroll affordance: "Info & Privacy" parzialmente oltre il viewport
- **rubric_ref:** nielsen-1 (Visibility of System Status), ui-dim-4 (Affordance & Signifiers)
- **Tipo:** Problema oggettivo
- **Severità:** Medium

**Evidenza dai dati visual-oracle (TSK-166-visual-iter-2.md):**

| Viewport | Tab "Info & Privacy" x | w | right edge | Viewport width | Overflow |
|---|---|---|---|---|---|
| 390×844 | 315.188 | 110.516 | **425.7px** | 390px | **~36px oltre viewport** |
| 375×667 | 307.688 | 110.516 | **418.2px** | 375px | **~43px oltre viewport** |

La regola `overflow-x: auto` in `app-extra.css` righe 113-114 abilita lo scroll, ma non esiste un indicatore visivo che comunichi all'utente che lo scroll orizzontale è disponibile. Su iOS Safari e Android Chrome gli scrollbar scompaiono dopo pochi millisecondi; un utente che non sa che la tab bar è scrollabile non tenterà lo scroll e non vedrà "Info & Privacy".

**Distinzione:** questo non è un problema introdotto ex novo da TSK-166 — è una conseguenza geometrica di avere 4 tab labels su 375-390px. TSK-166 ha **migliorato** la situazione (prima il tab era coperto dall'overlay del ThemeSwitcher/logo, ora è scrollabile). Tuttavia il finding è reale: l'utente non ha segnali che indichino la presenza di contenuto nascosto a destra.

**Non è un'opinione:** l'assenza di indicatore di scroll è misurabile — o esiste un elemento che segnala la scrollabilità (fade, indicatore puntino, chevron) o non esiste. Non esiste.

---

### F4 — Naming inconsistency: "Tema" vs pattern "Categoria — descrittore"
- **rubric_ref:** nielsen-4 (Consistency and Standards)
- **Tipo:** Deviazione dalla convenzione di naming
- **Severità:** Low

**Evidenza dal sorgente `Settings.tsx`:**

| AccordionItem | Label trigger |
|---|---|
| `theme-mobile` | "Tema" |
| `controls` | "Controlli — rimappatura" |
| `video` | "Resa video — scala e proporzioni" |
| `aspect` | "Aspetto — tema UI" |
| `mobile` | "Mobile — feedback aptico" |
| `autostart` | "Avvio — automatico dalla libreria" |
| `data` | "Dati — salvataggi (export/import)" |

Il pattern stabilito è `Categoria — descrittore`. Il nuovo accordion "Tema" usa solo la categoria senza descrittore. Non è un errore funzionale, ma rompe la coerenza visiva della lista accordion (nielsen-4: le cose simili devono sembrare simili).

---

### F5 — Doppio controllo tema su mobile Settings
- **rubric_ref:** nielsen-4 (Consistency and Standards), ui-dim-6 (Visual Hierarchy)
- **Tipo:** Open question (intento progettuale da confermare)
- **Severità:** Low

**Evidenza dal sorgente `Settings.tsx`:**
- Riga 417: `AccordionItem value="theme-mobile" className="block sm:hidden"` → ThemeSwitcher (quick toggle, 2 temi: CYBERPUNK ↔ 90S PARTY)
- Riga 580: `AccordionItem value="aspect"` → ThemeSelector (RadioGroup, 3 temi: 90's Party, Dark, Cyberpunk)

Su mobile entrambi i controlli sono visibili in Settings. Funzionalmente differiscono: il ThemeSwitcher non espone il tema "dark" (ThemeSwitcher.tsx riga 7: `QUICK_TOGGLE_THEMES = ["cyberpunk", "90s-party"]`), mentre il ThemeSelector lo include. Un utente che usa "dark" theme non potrà cambiare tema con il quick toggle (rimarrà bloccato su "cyberpunk" per la normalizzazione di `toQuickToggleTheme`). Questo potrebbe generare confusione.

Questa è una **open question**: la presenza di due controlli tema in mobile Settings è intenzionale? Dovrebbe il ThemeSwitcher (mobile-only) essere rimosso se il ThemeSelector completo è già presente?

---

## Positivi

| ID | Finding positivo | rubric_ref |
|---|---|---|
| P1 | P0 risolto: tutti e 4 i tab visibili su 375-390px (visual-oracle iter-2 PASS, nessun overlay) | nielsen-1, flow-ux-1 |
| P2 | ThemeSwitcher mostra stato corrente e prossimo tema nell'aria-label e nel label testuale — stato UI comunicato correttamente quando trovato | nielsen-1 |
| P3 | AccordionItem "Tema" è il PRIMO elemento dell'Accordion in Settings su mobile — posizione ottimale per il discovery | flow-ux-3 |
| P4 | Regola difensiva CSS `flex-wrap: nowrap` a ≤639px previene regressioni future sull'header | nielsen-5 (Error Prevention) |
| P5 | Invariante desktop preservata: ThemeSwitcher nell'header a 1280px con w=201.641px (visual-oracle confermato) | nielsen-4 |
| P6 | Cleanup `.sb-logo` zombie rules in `solids-theme.css` — nessun impatto funzionale, riduzione rumore cognitivo nel devtools | ui-dim-1 |
| P7 | Props `theme` + `onThemeChange` già presenti in `SettingsProps` — nessuna churn dell'interfaccia | nielsen-4 |
| P8 | Build TypeScript verde, nessun errore — invariante qualità del codice mantenuta | nielsen-5 |

---

## Open Questions

| ID | Domanda | Contesto |
|---|---|---|
| OQ-1 | L'utente mobile che cercava il ThemeSwitcher nell'header verrà orientato verso Settings? C'è un meccanismo di onboarding (tooltip, coachmark, notice una-tantum) per la transizione? | Richiede contesto: frequenza di uso del tema switch, profilo utente, se l'app ha onboarding |
| OQ-2 | Dovrebbe esistere un indicatore visivo di scroll orizzontale nella tab bar (es. fade-out sull'ultimo tab, chevron, pill-indicator)? | Decisione di design: complessità implementativa vs. impatto discoverability "Info & Privacy" |
| OQ-3 | Il doppio controllo tema su mobile Settings (ThemeSwitcher + ThemeSelector) è intenzionale? Se sì, dovrebbe il ThemeSwitcher escludere il tema "dark" anche nel contesto Settings? | Dipende da intento PO: quick toggle = shortcut, full selector = setting permanente |
| OQ-4 | Esiste una specifica per la label del nuovo accordion? "Tema" o "Tema — cambio rapido" per mantenere il pattern categoria-descrittore? | Dipende da decisione di naming del team |

---

## Compliance Design Brief EP-020

| Criterio | Stato |
|---|---|
| Token `--sd-*` (nessun colore hardcoded) | PASS — ThemeSwitcher e accordion usano token DS |
| Radix Tabs (keyboard navigation) | PASS — invariante, nessuna modifica alle Tabs |
| Focus visible `ring-2` | PASS — ThemeSwitcher è `<button>` con stili DS; AccordionTrigger ha focus-visible via DS |
| Safe-area insets `.sb-app.proto-root` | PASS — invariante, non toccato |
| Desktop layout EP-021 parity | PASS — visual-oracle confermato (w=201.641px ThemeSwitcher a 1280px) |
| Cascata CSS ordine corretto | PASS — nessuna modifica all'ordine di import |

---

## Verdict

**conditional**

**Rationale:**

Il P0 è risolto correttamente e l'implementazione è solida (P1-P8). Il conditional è motivato da due finding medium che richiedono una decisione progettuale prima della release definitiva:

1. **F1 (medium, nielsen-6/flow-ux-3):** assenza di affordance in header per il tema su mobile. Non è un blocco tecnico — è una domanda progettuale: il PO accetta esplicitamente la regressione di discoverability come tradeoff del P0? In caso affermativo, documentarlo come decisione e registrare OQ-1.

2. **F3 (medium, nielsen-1/ui-dim-4):** "Info & Privacy" parzialmente oltre viewport senza indicatore di scroll. Richiede una decisione sul se aggiungere un affordance visivo o documentare come comportamento accettabile.

**F2, F4, F5** non bloccano: F2 è un tradeoff PO documentato, F4 e F5 sono low severity risolvibili con un rename e una conferma di intento.

**Pipeline FE:** develop ✓ → visual-oracle PASS ✓ → ux-ui-review **conditional** ← [qui] → a11y → code-review

---

## Riepilogo findings

| ID | rubric_ref | Tipo | Severità |
|---|---|---|---|
| F1 | nielsen-6, flow-ux-3 | Oggettivo | Medium |
| F2 | flow-ux-3, nielsen-7 | Oggettivo (tradeoff PO) | Low-Medium |
| F3 | nielsen-1, ui-dim-4 | Oggettivo | Medium |
| F4 | nielsen-4 | Deviazione naming | Low |
| F5 | nielsen-4, ui-dim-6 | Open question | Low |
| P1-P8 | nielsen-1/4/5, flow-ux-1/3, ui-dim-1 | Positivi | — |

**rubric_violations_count:** 2 (F1 medium, F3 medium; F2 tradeoff documentato; F4-F5 low)
