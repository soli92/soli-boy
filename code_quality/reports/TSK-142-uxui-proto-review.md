---
id: TSK-142-uxui-proto-review
type: ux-ui-review
target: output/prototypes/ep020/
tsk: TSK-142
epic: EP-020
mode: no-visual
rubric_mode: strict
verdict: conditional
rubric_violations: 16
critical: 1
major: 10
minor: 5
created: 2026-07-02
---

# TSK-142 — UX/UI Review Prototipo EP-020 + Gap Analysis

**Target:** `output/prototypes/ep020/`
**Design brief:** `wiki/design/ep020-design-brief.md`
**Mode:** `no-visual` — evidenza raccolta via Read/Grep su sorgente (nessun server dev attivo, ADR-063 §C)
**Rubric:** Nielsen 10 + 6 dimensioni UI visive + 5 dimensioni di flusso (`rubric_strict: true`)
**Verdict:** `conditional` — 1 critical + 10 major + 5 minor. Nessun finding che rende l'implementazione inutilizzabile per il flusso primario di gioco. Il finding critical (C01) deve essere risolto come DoD bloccante in TSK-149.

> **R.D3:** Questo verdict è advisory, non deterministicamente bloccante. Anche `conditional`
> non blocca l'implementazione. Solo `reject` richiede revisione umana prima di procedere.

---

## Sommario Findings

| ID | Superficie | Severity | Titolo | TSK Phase 2 |
|----|-----------|----------|--------|-------------|
| C01 | Settings → Dati | **critical** | "Cancella tutti i dati" senza confirm dialog | TSK-149 |
| M01 | App shell | **major** | Dual Radix Tabs — ARIA tab/panel association rotta | TSK-143 |
| M02 | App shell / Settings | **major** | Tema `dark` in SettingsTab non nel design brief; header stale | TSK-143 + TSK-151 |
| M03 | Play | **major** | Save State Panel non accessibile su mobile (hidden senza fallback) | TSK-144 |
| M04 | Dialog | **major** | ConfirmGameChangeDialog: confirm usa `variant="default"` non `variant="destructive"` | TSK-153 |
| M05 | Globale / input | **major** | `outline: none` inline su Input → focus ring soppressa | TSK-147 + TSK-150 |
| M06 | Settings / Select | **major** | `outline: none` + nessun `[data-highlighted]` in SelectItem → focus keyboard invisibile | TSK-150 |
| M07 | Settings / Accordion | **major** | Chevron AccordionTrigger non ruota su `data-state="open"` → nessun indicatore visivo aperto/chiuso | TSK-149 |
| M08 | Library | **major** | Pulsante `✕` rimozione ROM: touch target 1.5rem (24px), sotto soglia 44px | TSK-146 |
| M09 | Info | **major** | `role="alert"` su contenuto legale statico — live region assertive fuori contesto | TSK-152 |
| M10 | App shell | **major** | `TabsContent style={{ outline: 'none' }}` → focus ring soppressa sui pannelli tab | TSK-143 |
| m01 | Play | minor | Controlli disabilitati prima della CTA idle — gerarchia visiva degradata | TSK-144 |
| m02 | App shell | minor | Hover TabsTrigger via `onMouseEnter/Leave` JS — keyboard users senza feedback hover | TSK-143 |
| m03 | Play / TouchOverlay | minor | Colori hardcoded (`#000`, `rgba(255,255,255,...)`) in CSS TouchOverlay — viola token contract | TSK-155 |
| m04 | Library | minor | Badge "In gioco" sostituisce piattaforma — perde metadato platform | TSK-146 |
| m05 | Info | minor | Stringa versione hardcoded `v0.4.0 · EP-020 prototype · TSK-141` | TSK-152 |

---

## Tab: App Shell (App.tsx)

### UX-EP020-M01 — Dual Radix Tabs: ARIA tab/panel association rotta

**Severity:** major
**rubric_ref:** N4 (Consistency and standards) — ARIA 1.1 Tabs pattern; N1 (Visibility of system status per AT)

**Evidenza (App.tsx L141-148 e L196-209):**

In `App.tsx` esistono due istanze separate di `<Tabs>` (Radix Root):
1. Nell'`<nav>` del header: contiene `<TabsList>` + `<TabsTrigger>` ma nessun `<TabsContent>`.
2. Nel `<main>`: contiene i `<TabsContent>` ma nessun `<TabsList>`.

Radix Tabs genera `aria-controls` sui `TabsTrigger` e `id` sui `TabsContent` con prefisso derivato dall'ID auto-generato del Root di appartenenza. Poiché le due Root sono istanze distinte, gli ID generati nella Root #1 (nav) non corrispondono a quelli della Root #2 (main). Risultato: ogni `<TabsTrigger>` ha un `aria-controls` che punta a un pannello inesistente nel suo albero DOM.

I screen reader annunceranno tab senza pannello associato. L'associazione semantica ARIA `tablist → tab → tabpanel` è interrotta.

**Impatto:** Utenti con screen reader non possono navigare correttamente tra i tab.

**Gap Analysis:** TSK-143 (App shell + Tabs navigation migration) deve unificare le due Root in un'unica istanza `<Tabs>` con `TabsList` e tutti i `TabsContent` sotto lo stesso Root, oppure usare lo `asChild` rendering con navigazione custom + ruoli ARIA espliciti.

---

### UX-EP020-M02 — Tema `dark` non nel design brief; header theme switcher stale

**Severity:** major
**rubric_ref:** N4 (Consistency and standards) — R.D1 (design brief §1); N1 (Visibility of system status)

**Evidenza:**

`SettingsTab.tsx` L9-13 definisce 3 temi: `90s-party`, `dark`, `cyberpunk`. Il design brief `ep020-design-brief.md` §1 definisce solo `cyberpunk` e `90s-party`. Il tema `dark` non è documentato né specificato nel contratto visivo.

`App.tsx` L21-24: `THEME_NEXT` mappa solo `cyberpunk ↔ 90s-party`. Se l'utente seleziona `dark` da Settings, il header mostra ancora `CYBERPUNK ↔ 90S PARTY` — lo stato del tema corrente non è riflesso correttamente.

**Impatto:** Violazione R.D1 (nessun agente FE può ignorare il design brief). Inconsistenza stato sistema N1. Header diventa fuorviante dopo selezione `dark`.

**Gap Analysis:**
- TSK-143: allineare il toggle header alla selezione corrente, o rimuovere il toggle rapido e delegare tutto a Settings.
- TSK-151 (ThemeSelector → RadioGroup): rimuovere `dark` dall'enum se non previsto dal DS, o aggiornare il design brief con ADR aggiuntivo (gating rule §6 punto 2).

---

### UX-EP020-M10 — `TabsContent outline: none` — focus ring soppressa sui pannelli

**Severity:** major
**rubric_ref:** N4 (Consistency and standards) — WCAG 2.4.11 (Focus Appearance); N7 (Flexibility)

**Evidenza (App.tsx L197, L201, L205, L208):**

```tsx
<TabsContent value="play" style={{ outline: 'none' }}>
```

Lo stesso `style={{ outline: 'none' }}` è applicato a tutti e 4 i pannelli tab. Il tab panel (`role="tabpanel"`) riceve focus alla navigazione keyboard (Tab key dopo selezione trigger). Con `outline: none` inline (specificità > regola CSS), il focus è invisibile. La regola globale `:focus-visible` in `prototype.css` viene soverchiata dagli stili inline.

**Gap Analysis:** TSK-143 deve rimuovere `outline: none` inline dai `TabsContent` e gestire il focus ring via Tailwind utility (`focus-visible:outline-none` + ring token, oppure ring esplicito) con specificità corretta.

---

### UX-EP020-m02 — TabsTrigger hover via JS event handlers

**Severity:** minor
**rubric_ref:** N4 (Consistency) — keyboard/mouse parity; N7 (Flexibility)

**Evidenza (ui/index.tsx L324-338):**

L'hover sui tab trigger è implementato con `onMouseEnter`/`onMouseLeave` che manipolano direttamente `el.style.background` e `el.style.color`. Questo approccio:
- Non si attiva con keyboard arrow navigation (gli eventi mouse non vengono emessi da keyboard)
- Può produrre stili inline stale in caso di re-render mid-hover
- Non è compatibile con animazioni CSS transition su `:hover`

**Gap Analysis:** TSK-143 deve sostituire gli handler JS con CSS `:hover` (Tailwind `hover:` utilities) che coprono sia mouse che focus.

---

## Tab: Play (PlayTab.tsx)

### UX-EP020-M03 — Save State Panel inaccessibile su mobile

**Severity:** major
**rubric_ref:** N7 (Flexibility and efficiency of use) — F2 (Task flow mobile)

**Evidenza (PlayTab.tsx L158-188):**

```tsx
<Card style={{ width: '14rem', flexShrink: 0, display: 'none' as React.CSSProperties['display'] }} className="save-panel-desktop">
  <style>{`@media (min-width: 768px) { .save-panel-desktop { display: block !important; } }`}</style>
```

Il Save State Panel è nascosto con `display: none` e visibile solo su viewport ≥ 768px via media query con `!important`. Su mobile non esiste alcun path di navigazione alternativo per visualizzare/caricare/salvare gli stati di gioco.

I save state sono una feature core per un emulatore. L'assenza totale di accesso mobile non è un compromesso accettabile.

**Gap Analysis:** TSK-144 (Player container + HUD + controls) deve definire una soluzione mobile per i save state: bottom sheet, drawer, o sezione collassabile. Il DoD deve includere accesso save state su viewport <768px.

---

### UX-EP020-m01 — Controlli disabilitati prima della CTA idle

**Severity:** minor
**rubric_ref:** N6 (Recognition rather than recall) — V1 (Hierarchy)

**Evidenza (PlayTab.tsx L97-154):**

Quando `hasRom = false`, la UI mostra:
1. I button player (Avvia, Pausa, ×2, Fullscreen) → tutti `disabled`
2. La drop-zone CTA "Carica una ROM per iniziare" → sotto i button

La gerarchia visiva presenta prima i controlli (tutti disabilitati e non-azionabili) e poi la CTA principale. L'utente potrebbe tentare i controlli prima di capire che deve caricare una ROM.

**Gap Analysis:** TSK-144: nella stato `!hasRom`, considerare di mostrare solo la drop-zone come area principale, collassando o nascondendo i controlli fino al caricamento ROM.

---

## Tab: Library (LibraryTab.tsx)

### UX-EP020-M08 — Touch target `✕` rimozione ROM sotto soglia 44px

**Severity:** major
**rubric_ref:** N4 (Consistency and standards) — WCAG 2.5.5 (Target Size); N5 (Error prevention — touch target piccolo aumenta errori)

**Evidenza (LibraryTab.tsx L109-116):**

```tsx
<Button
  variant="ghost"
  size="sm"
  style={{ padding: '0 var(--sd-space-1)', height: '1.5rem', fontSize: '0.65rem', ... }}
  onClick={onRemoveRom}
  aria-label={`Rimuovi ${game.title}`}
>✕</Button>
```

`height: 1.5rem` = ~24px. La soglia WCAG 2.5.5 (Target Size Enhanced) è 44×44px. Il target di dimensioni minime WCAG 2.5.8 (Target Size Minimum) è 24×24px con spaziatura adeguata — ma qui la spaziatura dall'elemento adiacente (Badge) è `var(--sd-space-1)` ≈ 4px, insufficiente come offset.

Il pulsante rimuove un ROM: un'attivazione accidentale porta direttamente all'apertura del dialog di conferma (correttamente protetto da dialog), ma il touch target piccolo aumenta la probabilità di attivazione non intenzionale su mobile.

**Gap Analysis:** TSK-146 (GameTile grid → Card + Badge + Button) deve dimensionare il target di rimozione a minimo 44×44px su mobile (o 24×24 con padding offset adeguato ≥ 10px). L'`aria-label` è già corretto.

---

### UX-EP020-m04 — Badge "In gioco" nasconde il platform del gioco attivo

**Severity:** minor
**rubric_ref:** N6 (Recognition rather than recall) — V1 (Information hierarchy)

**Evidenza (LibraryTab.tsx L106-108):**

```tsx
<Badge variant={game.active ? 'default' : 'secondary'} style={{ fontSize: '0.6rem' }}>
  {game.active ? 'In gioco' : game.platform}
</Badge>
```

Quando un gioco è attivo, il badge mostra "In gioco" al posto della piattaforma (es. "GBC"). Nella Library, la piattaforma è un attributo di filtraggio e identificazione importante. L'informazione non viene recuperata da nessun altro elemento del tile.

**Gap Analysis:** TSK-146: valutare di mostrare entrambe le informazioni (es. due badge: uno "In gioco" variant=default + uno platform variant=secondary). Open question: quanto spazio è disponibile nel tile a dimensione minima?

---

## Tab: Settings (SettingsTab.tsx)

### UX-EP020-C01 — "Cancella tutti i dati" senza confirm dialog [CRITICAL]

**Severity:** critical
**rubric_ref:** N5 (Error prevention) — F3 (Error flow / recovery)

**Evidenza (SettingsTab.tsx L268-276):**

```tsx
<div style={{ fontSize: 'var(--sd-font-size-sm)', color: 'var(--sd-color-destructive-default)' }}>Cancella tutti i dati</div>
<div style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)' }}>Azione irreversibile</div>
...
<Button variant="destructive" size="sm">Cancella</Button>
```

Il pulsante "Cancella" nella sezione Dati non ha `onClick` nel prototipo (placeholder). In produzione, deve triggherare una confirm dialog **prima** di eseguire la cancellazione. L'azione è esplicitamente annotata "Azione irreversibile" — cancella save state, configurazione e libreria.

Il prototipo non definisce né visualizza alcuna dialog di conferma per questa azione, a differenza di RemoveRomConfirmDialog e ConfirmGameChangeDialog che sono correttamente modellate.

**Impatto:** Se implementato senza protect flow, un click accidentale su "Cancella" distrugge irreversibilmente tutti i dati dell'utente. Nessun recovery path. Questo è il finding più grave del prototipo.

**Gap Analysis (bloccante per DoD):** TSK-149 (Settings → Accordion) deve definire e implementare una `DeleteAllDataConfirmDialog` come `AlertDialog` con:
- Titolo esplicito: "Cancellare tutti i dati?"
- Descrizione del perimetro di cancellazione (save state, config, libreria)
- Confirm button: `variant="destructive"`, label "Cancella tutto"
- Cancel button: `variant="outline"`, label "Annulla"
- Focus trap + Esc obbligatori (Radix AlertDialog nativo)

**Questo finding deve apparire nel DoD di TSK-149 come prerequisito bloccante.**

---

### UX-EP020-M07 — Accordion trigger chevron non indica stato aperto/chiuso

**Severity:** major
**rubric_ref:** N1 (Visibility of system status) — V6 (Motion — transition definita ma mai attivata); F4 (Feedback)

**Evidenza (ui/index.tsx L591-592):**

```tsx
<span style={{ transition: 'transform 200ms ease', fontSize: '0.75rem', color: '...' }}>▾</span>
```

Il chevron `▾` ha una `transition: transform 200ms ease` ma nessuna regola CSS applica una rotazione quando la sezione è aperta. Radix imposta `data-state="open"` sul trigger, ma non esiste nessun selettore CSS del tipo:

```css
[data-state="open"] > span { transform: rotate(180deg); }
```

Il risultato è che tutte le sezioni accordion mostrano sempre `▾` indipendentemente dallo stato. Gli utenti non possono distinguere visivamente quale sezione è aperta senza osservare il contenuto espanso.

Il prototipo apre `video` e `audio` di default (`defaultValue={['video', 'audio']}`), ma questo non è evidente dal solo chevron.

**Gap Analysis:** TSK-149 deve aggiungere la regola CSS/Tailwind per ruotare il chevron:
```css
[data-state="open"] .accordion-chevron { transform: rotate(180deg); }
```
o equivalente Tailwind `data-[state=open]:rotate-180`.

---

### UX-EP020-M05 — `outline: none` inline su Input — focus ring soppressa

**Severity:** major
**rubric_ref:** N4 (Consistency and standards) — WCAG 2.4.11 (Focus Appearance); WCAG 2.4.7 (Focus Visible)

**Evidenza (ui/index.tsx L265):**

```tsx
<input
  style={{
    ...
    outline: 'none',  // inline → specif. massima, override :focus-visible impossibile
    ...
  }}
/>
```

Lo stile inline `outline: none` ha specificità (1,0,0,0), superiore a qualsiasi regola stylesheet. La regola globale `:focus-visible { outline: 2px solid var(--sd-color-primary-default) }` definita in `prototype.css` non può sovrascriverlo. I campi di testo (search in Library, campi in Settings) non mostrano alcun focus ring durante la navigazione keyboard.

**Gap Analysis:** TSK-147 (Search input) e TSK-150 (Form controls) devono rimuovere `outline: none` dagli Input o gestirlo via Tailwind `focus-visible:ring-2 focus-visible:ring-[--sd-color-primary-default]` con la specificità corretta. Il pattern target è quello del design brief §5: `ring-2 ring-[--sd-color-primary-default]`.

---

### UX-EP020-M06 — SelectItem: nessun `[data-highlighted]` CSS — keyboard focus dropdown invisibile

**Severity:** major
**rubric_ref:** N1 (Visibility of system status) — WCAG 2.4.7 (Focus Visible); N4 (Consistency)

**Evidenza (ui/index.tsx L534-538):**

```tsx
<SelectPrimitive.Item
  ref={ref}
  style={{
    ...
    outline: 'none',  // inline override
    ...
  }}
```

Radix `Select.Item` imposta `data-highlighted` sull'item con keyboard focus. Nessuna regola CSS gestisce `[data-highlighted]` nel prototipo. Combinato con `outline: none` inline, la navigazione keyboard nel dropdown Select (tasti Arrow, Enter) non ha alcun indicatore visivo di selezione corrente. In Settings → Video, le dropdown "Scala schermo" e "Filtro rendering" sono completamente opache alla navigazione keyboard.

**Gap Analysis:** TSK-150 (Form controls → Switch, Select, Slider) deve aggiungere CSS/Tailwind per `[data-highlighted]`:
```css
[data-highlighted] { background: var(--sd-color-bg-hover); outline: none; }
```
e rimuovere l'`outline: none` inline dal componente.

---

## Tab: Info (InfoTab.tsx)

### UX-EP020-M09 — `role="alert"` su contenuto legale statico

**Severity:** major
**rubric_ref:** N4 (Consistency and standards) — ARIA 1.1 alert role semantics; N8 (Aesthetic and minimalist — AT announces unexpected interruption)

**Evidenza (ui/index.tsx L209-210):**

```tsx
<div
  role="alert"
  ...
>
```

Il componente `Alert` hardcoda `role="alert"`, che implica `aria-live="assertive"`. Quando il componente monta, i screen reader interrompono immediatamente l'annuncio corrente per leggere il contenuto. Nella InfoTab, `Alert` è usato per lo "Store Compliance Notice" — un testo legale statico che non costituisce un avviso critico di sistema.

L'interruzione assertiva per contenuto legale crea un'esperienza jarring per utenti AT e non è semanticamente corretta. `role="alert"` è destinato a notifiche urgenti e dinamiche (errori, conferme di azione), non a testo informativo statico sempre presente.

**Gap Analysis:** TSK-152 (Info tab notices → Card + Alert) deve:
- Usare `role="status"` (live="polite") o nessun ruolo ARIA live per i notice statici
- Riservare `role="alert"` a notifiche dinamiche (UpdateBanner quando appare, errori di caricamento BIOS)
- Il componente `Alert` nel DS dovrebbe offrire `role` come prop con default `"status"` per varianti non-destructive.

---

### UX-EP020-m05 — Stringa versione hardcoded

**Severity:** minor
**rubric_ref:** N2 (Match between system and the real world) — versione stale

**Evidenza (InfoTab.tsx L67):**

```tsx
<p>soli-boy v0.4.0 · EP-020 prototype · TSK-141</p>
```

La versione è hardcoded con riferimento al task del prototipo. In produzione, la versione deve essere sourced da `package.json` (import o env var build-time) per evitare desync.

**Gap Analysis:** TSK-152: sostituire con import dinamico o env var build-time (`import.meta.env.VITE_APP_VERSION` o `__APP_VERSION__` definito in `vite.config.ts`).

---

## Dialogs (App.tsx)

### UX-EP020-M04 — ConfirmGameChangeDialog: confirm button `variant="default"` anziché `variant="destructive"`

**Severity:** major
**rubric_ref:** N5 (Error prevention — segnale visivo deve comunicare il rischio); V2 (Contrasto/colore semantico); F3 (Error flow)

**Evidenza (App.tsx L70-76):**

```tsx
<AlertDialogAction asChild>
  <Button variant="default" size="md">Cambia gioco</Button>
</AlertDialogAction>
```

Il dialog "Cambia gioco?" avvisa che "il progresso non salvato andrà perso". L'azione confirm usa `variant="default"` (cyan — colore primario neutro), non `variant="destructive"` (magenta elettrico — colore danger). Il confronto visivo con `RemoveRomConfirmDialog` (L92-96) che correttamente usa `variant="destructive"` per "Rimuovi" mostra l'inconsistenza.

Il cyan per un'azione che causa perdita di progresso non comunica il rischio all'utente. Il magenta/rosso è il segnale convenzionale per azioni distruttive.

**Gap Analysis:** TSK-153 (ConfirmGameChangeDialog → AlertDialog) deve usare `variant="destructive"` per il pulsante confirm di cambio gioco. Il `RemoveRomConfirmDialog` è già corretto e va usato come riferimento.

---

### Dialogs — Findings positivi (pattern corretti)

- Focus trap e Esc: Radix `AlertDialogContent` gestisce correttamente focus trap, dismissal con Esc, Portal nativo — conformi al design brief §5.
- `AlertDialogCancel asChild` + `AlertDialogAction asChild`: pattern corretto per wrapping con `<Button>`.
- `RemoveRomConfirmDialog`: descrizione chiara, `variant="destructive"` corretto, copy informativo su save state preservati — pattern di riferimento per gli altri dialog.

---

## Global — TouchOverlay

### UX-EP020-m03 — Colori hardcoded TouchOverlay violano token contract

**Severity:** minor
**rubric_ref:** V2 (Contrasto/tema) — R.D1 (design brief §3: nessun colore hardcoded)

**Evidenza (prototype.css L128-131, L163-164, L177-178):**

```css
.dpad-btn {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.8);
}
.btn-a { color: #000; }
.btn-b { color: #000; }
```

I colori RGBA hardcoded assumono background scuro e non si adattano a variazioni di tema. Il `#000` su `.btn-a` e `.btn-b` è un colore assoluto non tokenizzato.

Il design brief §3 è esplicito: "Tutti i colori UI devono leggere da `--sd-*` CSS variables — nessun colore hardcoded." I button pad sono in `Token invarianti` ma solo per `--sd-color-pad-a/b` (background) — il testo del pulsante non ha un token dedicato.

**Gap Analysis:** TSK-155 (TouchOverlay visual styling → Tailwind) deve proporre token `--sd-color-pad-text` (o simile) per il testo sui pad button, e sostituire i `rgba` hardcoded con `--sd-color-overlay-*` tokens se disponibili nel DS, o definirli come invarianti gaming nella `solids-theme.css`.

---

## Open Questions

Le seguenti domande richiedono contesto utente/PM e non vengono dichiarate come issue:

1. **Remap keyboard flow**: I pulsanti "Remap" in Settings → Controlli non hanno un flusso definito. Come si cattura un nuovo tasto? Esiste un modale di cattura? Gestione conflitti? Questo flusso deve essere specificato prima di TSK-150.

2. **Save state mobile**: Il design brief non menziona come i save state devono essere accessibili su mobile. Un bottom sheet è sufficiente? Un overlay? Questa decisione influenza TSK-144.

3. **BIOS loading**: La sezione BIOS mostra "Nessun BIOS caricato" per tutti e tre le piattaforme. Il BIOS è opzionale o obbligatorio per alcune piattaforme? Qual è l'error state durante il gameplay se BIOS mancante ma richiesto? Questo deve essere documentato prima di TSK-150.

4. **Tema `dark`**: Includere `dark` nel ThemeSelector richiede un ADR aggiuntivo (design brief §6 gating rule 2). La decisione spetta al PM/art-director umano — non è una scelta che TSK-151 può risolvere autonomamente.

5. **Demo buttons in produzione**: I button "Demo: Cambia gioco dialog" / "Demo: Rimuovi ROM dialog" nell'header del main sono scaffold prototipale. In produzione, i trigger devono provenire dal contesto corretto (Library → ✕ per RemoveRom, Play → selezione gioco da Library per GameChange). Verificare che TSK-143 rimuova questi button demo.

---

## Gap Analysis — Matrice Finding → TSK Phase 2

| Finding | Severity | TSK Phase 2 | Wave | Note DoD |
|---------|----------|-------------|------|----------|
| C01 — Cancella tutti dati senza confirm | critical | **TSK-149** | B | Prerequisito bloccante DoD: DefineDeleteAllDataConfirmDialog |
| M01 — Dual Tabs ARIA break | major | **TSK-143** | A | Unificare in singolo Tabs.Root |
| M02 — Tema dark non in brief / header stale | major | **TSK-143** (header) + **TSK-151** (RadioGroup) | A/B | Rimuovere dark o ADR; allineare toggle header |
| M03 — Mobile save state inaccessibile | major | **TSK-144** | A | Aggiungere mobile path a DoD |
| M04 — ConfirmGameChange variant sbagliato | major | **TSK-153** | B | `variant="destructive"` nel confirm button |
| M05 — Input outline:none | major | **TSK-147** + **TSK-150** | A/B | Focus ring via Tailwind focus-visible |
| M06 — SelectItem no keyboard focus | major | **TSK-150** | B | CSS `[data-highlighted]` + rimuovere outline:none |
| M07 — Accordion chevron statico | major | **TSK-149** | B | `data-state="open"` CSS rotate rule |
| M08 — Touch target ✕ sotto 44px | major | **TSK-146** | A | Touch target ≥ 44×44px su mobile |
| M09 — role="alert" su statico | major | **TSK-152** | C | `role="status"` o nessun live region per notice statici |
| M10 — TabsContent outline:none | major | **TSK-143** | A | Rimuovere outline:none inline; gestire via Tailwind |
| m01 — Gerarchia disabilitati/CTA | minor | **TSK-144** | A | Advisory: mostrare CTA prima dei controlli in stato !hasRom |
| m02 — Hover JS anziché CSS | minor | **TSK-143** | A | Sostituire con CSS :hover/Tailwind |
| m03 — Colori hardcoded TouchOverlay | minor | **TSK-155** | D | Token per testo pad button |
| m04 — Badge "In gioco" hide platform | minor | **TSK-146** | A | Advisory: dual badge o platform sempre visibile |
| m05 — Versione hardcoded | minor | **TSK-152** | C | Build-time env var VITE_APP_VERSION |

**Wave mapping:**
- Wave A (TSK-143..145): M01, M02 (parziale), M03, M05 (parziale), M10, m01, m02, m04 (parziale)
- Wave B (TSK-146..151): C01, M02 (parziale), M04, M05 (parziale), M06, M07, M08, m04 (parziale)
- Wave C (TSK-152..154): M09, m05
- Wave D (TSK-155..157): m03

---

## Findings Positivi (conformità al design brief)

I seguenti elementi del prototipo sono correttamente implementati e devono essere preservati nelle implementazioni Phase 2:

1. **Token contract rispettato** — Tutti i componenti in `ui/index.tsx` usano esclusivamente `var(--sd-*)` per colori, spaziatura, font, bordi. Zero colori hardcoded nei componenti (l'eccezione è nel CSS TouchOverlay, finding m03, non nei componenti React).
2. **Invarianti gaming** — `hud-mono`, `.sb-screen`, slot-panel usano `var(--sd-font-mono)` come richiesto dal brief §4 — invariante non migrata, corretta.
3. **Radix AlertDialog per azioni distruttive** — `RemoveRomConfirmDialog` usa correttamente `AlertDialog` con focus trap, Esc, Portal, button variant="destructive" — pattern da replicare per `DeleteAllDataConfirmDialog`.
4. **Focus visible globale** — `:focus-visible { outline: 2px solid var(--sd-color-primary-default); outline-offset: 2px }` in `prototype.css` — approccio corretto, solo da non sovrascrivere con `outline: none` inline (finding M05/M06/M10).
5. **Keyboard support dichiarato su form controls** — Radix Slider (Arrow), Switch (Space), Select (Enter/Arrow), RadioGroup (Arrow), Accordion (Enter/Space) — tutte le primitive Radix correttamente usate secondo §5 del design brief.
6. **Dual-theme support** — Il meccanismo `data-theme` su `html` + CSS variables funziona correttamente per cyberpunk/90s-party (finding M02 riguarda solo l'aggiunta non-documentata di `dark`).
7. **aria-label su TouchOverlay buttons** — Tutti i pulsanti d-pad, A/B, SELECT/START hanno `aria-label` corretti.
8. **Accordion animazione** — CSS `@keyframes accordion-down/up` definiti e applicati tramite `data-state` — l'animazione del contenuto funziona; solo il chevron manca del selettore (finding M07).

---

## Verdict

**CONDITIONAL**

Il prototipo EP-020 dimostra correttamente la struttura component-to-surface (design brief §2), il token contract (§3), le primitive Radix per keyboard interaction (§5). L'architettura di base è solida.

1 finding critical (C01) presente: mancanza di confirm dialog per "Cancella tutti i dati". Questo non rende l'intera implementazione inutilizzabile ma richiede risoluzione obbligatoria in TSK-149 come DoD bloccante.

10 finding major: prevalentemente pattern keyboard/a11y (focus ring, ARIA associations, accordion state). Devono essere embedded come note nei DoD dei rispettivi TSK Phase 2.

Per R.D3: il verdict `conditional` è advisory. Non blocca l'inizio dell'implementazione Phase 2. L'implementazione può procedere con i TSK della Wave A (TSK-143..145) incorporando le note di questo report.
