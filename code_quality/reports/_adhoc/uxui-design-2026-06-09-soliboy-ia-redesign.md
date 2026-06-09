---
report_id: uxui-design-2026-06-09-soliboy-ia-redesign
agent: ui-designer (ADR-020, US-030)
brief: ridisegno information architecture + layout — 3 finding reali (F-01 muro configurazione, viewport piccolo, TouchOverlay mal posizionato)
deliverable_type: ia_redesign + wireframe + touchoverlay_repositioning
timestamp: 2026-06-09
status: draft — pronto per review (ux-ui-reviewer)
tsk: adhoc
supersedes_context: uxui-review-2026-06-09-15-25-soliboy-home (finding F-01)
ui_design_spec_suggestion: code_quality/reports/_adhoc/uxui-design-2026-06-09-soliboy-ia-redesign.md
---

# Design Deliverable — Soli-boy IA Redesign

> Prodotto dal designer (faccia Design della capability [[ux-ui-review-design-capability]]).
> NON auto-valutato. Passare a `/ux-ui-review` per la valutazione.

---

## 1. Analisi dello stato attuale (da codice + review reale)

### Struttura attuale di App.tsx (ordine di render)

```
<main .sb-app>
  <header>                    — titolo "Soli-boy"
  <PrivacyNotice variant=banner>  — banner primo avvio (condizionale)
  <UpdateBanner>              — banner update Electron (condizionale)
  <FileLoader>                — pulsante "Carica ROM" + dropzone
  <Library>                   — griglia ROM + ricerca + filtri piattaforma
  <Player>                    — viewport emulatore (CONDIZIONALE: solo se ROM selezionata)
  <Settings>                  — SEMPRE VISIBILE, interamente espanso:
    ├ Controlli rimappatura
    ├ Resa video (scala/aspect/filtro)
    ├ Aspetto (tema UI)
    ├ Mobile (haptics toggle)
    ├ Dati (export/import salvataggi)
    ├ Legale (StoreComplianceNotice)
    └ Privacy (PrivacyNotice variant=section)
  <LegalNotice>               — nota legale a piè di pagina
</main>
```

### I 3 problemi confermati dal codice

**Problema 1 — Player condizionale e piccolo di default**
- Il `<Player>` è renderizzato SOLO quando `selected !== null`.
- Lo stato idle (nessuna ROM) non mostra nulla del viewport → l'utente non percepisce che l'app è un emulatore.
- `.sb-screen` ha dimensioni controllate da `videoSettingsToContainerStyle(effectiveSettings)` — senza ROM selezionata, il componente non è presente nella DOM.
- Il pulsante "Schermo intero" è l'unico modo per ingrandire, ma richiede prima di caricare una ROM e cliccare "Avvia".

**Problema 2 — TouchOverlay: positioning via offset percentuali su container assoluto**
- `TouchOverlayInner` usa `position: absolute; inset: 0` sul container overlay.
- D-pad: `left: ${config.dpadOffsetX}%; bottom: ${config.dpadOffsetY}%` (default: valori da `useTouchOverlayConfig`, ancorati all'interno del container `<section .sb-app>`).
- Il container overlay è figlio di `<section .sb-app>`, non del viewport `<.sb-screen>`. Di fatto l'overlay flotta sopra tutto il contenuto della pagina, non sopra la sola area di gioco.
- Su mobile in portrait, il layout a colonna lunga sposta il Player lontano dalla top → i tasti virtuali si trovano sopra sezioni non pertinenti (Settings, Library).

**Problema 3 — Settings sempre espanso, muro di configurazione**
- `<Settings>` è renderizzato incondizionatamente a DOM, interamente espanso.
- Nessuna separazione per sezione/tab/accordion: 7 sotto-sezioni in sequenza verticale.
- Confermato da review visiva (F-01, verdict: major, nielsen-8 aesthetic-minimalist).

---

## 2. Information Architecture proposta

### Navigazione principale (4 sezioni)

```
[ Play ]  [ Libreria ]  [ Impostazioni ]  [ Info & Privacy ]
```

**Mappa delle sezioni:**

| Sezione | Contenuto corrente mappato | Priorità |
|---|---|---|
| **Play** (default) | Player (viewport + controlli) + FileLoader (se no ROM) | Primaria |
| **Libreria** | Library (griglia ROM + ricerca + filtri piattaforma) | Secondaria |
| **Impostazioni** | Settings: Controlli rimappatura + Resa video + Aspetto + Mobile + Dati | Secondaria |
| **Info & Privacy** | PrivacyNotice (section) + StoreComplianceNotice + LegalNotice | Terziaria |

**Rationale IA:**
- **Play first**: l'obiettivo primario dell'utente è giocare (o preparare il gioco). Il viewport è il contenuto — non una conseguenza della navigazione.
- **Libreria separata**: la griglia ROM è una navigazione interna (scelta del gioco) non una funzionalità di configurazione. Va mantenuta accessibile ma non sovrapposta al viewport.
- **Impostazioni**: accordionata o dietro tab — non espansa di default. L'utente accede alle impostazioni raramente rispetto al ciclo play.
- **Info & Privacy**: contenuti statici (avvisi legali, privacy policy), tipicamente consultati una tantum. Separati per non inquinare il flusso di gioco.

**Componenti esistenti NON spostati:**
- `<PrivacyNotice variant="banner">` rimane come banner di primo avvio (overlay modale/top-banner), PRIMA di qualsiasi navigazione — invariato rispetto all'implementazione attuale.
- `<UpdateBanner>` rimane nel layer banner (sopra il contenuto), indipendente dalla navigazione.

---

## 3. Wireframe testuale — Layout emulator-first

### 3a. Desktop (viewport >= 768px)

```
╔══════════════════════════════════════════════════════════════════════╗
║  [banner privacy — se non ancora confermato, full-width, dismissibile]  ║
║  [banner update — se disponibile, full-width]                           ║
╠══════════════════════════════════════════════════════════════════════╣
║  Soli-boy        [ Play ]  [ Libreria ]  [ Impostazioni ]  [ Info ]  ║  ← <header> con nav landmark
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  SEZIONE: Play (default / scheda attiva)                             ║
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐   ║
║  │                                                              │   ║
║  │              VIEWPORT DI GIOCO (.sb-screen)                  │   ║
║  │        aspect-ratio: 160/144 (GB/GBC) o 240/160 (GBA)        │   ║
║  │        min-height: 360px  (scala "auto" responsive)          │   ║
║  │        max-width: 640px (desktop) — centrato                 │   ║
║  │                                                              │   ║
║  │   [stato idle: placeholder grafico + "Seleziona dalla        │   ║
║  │    Libreria o carica una ROM per iniziare"]                  │   ║
║  │                                                              │   ║
║  └──────────────────────────────────────────────────────────────┘   ║
║                                                                      ║
║  [ Avvia / Pausa / Riprendi / Arresta ]    [ Schermo intero ]       ║  ← .sb-hud + controlli
║  ROM: titolo | core: gambatte | stato: idle                         ║  ← HUD testuale sotto
║                                                                      ║
║  ┌────────────────────────────────────────────────────┐            ║
║  │ Pannello Save State (se ROM selezionata)            │            ║  ← collapsibile
║  └────────────────────────────────────────────────────┘            ║
║                                                                      ║
║  [se nessuna ROM selezionata: CTA "Carica ROM" + drag & drop]       ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  Soli-boy — non distribuisce ROM protette da copyright.             ║  ← <footer> con LegalNotice
╚══════════════════════════════════════════════════════════════════════╝
```

**Note desktop:**
- Il `<Player>` è SEMPRE presente nel DOM sulla tab Play, anche in stato idle.
- Stato idle: lo `.sb-screen` mostra un placeholder ("Seleziona un gioco dalla Libreria") con la stessa dimensione/aspect del viewport di gioco. L'utente vede subito lo "schermo" dell'emulatore — non una lista di form.
- Il FileLoader (Carica ROM / drag&drop) compare sotto il viewport solo quando nessuna ROM è selezionata. Scompare quando il gioco è in esecuzione (non inquina il layout di gioco).
- Il FileLoader alternativo può restare sempre accessibile nella tab Libreria (importa nuova ROM).

### 3b. Mobile portrait (viewport < 768px)

```
╔═══════════════════════════════╗
║  [banner privacy/update]      ║
╠═══════════════════════════════╣
║  Soli-boy                     ║  ← header compatto
╠═══════════════════════════════╣
║  [ Play ] [Lib] [Imp] [Info]  ║  ← tab bar compatta (icon + label)
╠═══════════════════════════════╣
║                               ║
║  ┌───────────────────────┐   ║
║  │                       │   ║
║  │   VIEWPORT DI GIOCO   │   ║  ← occupa max larghezza disponibile
║  │   aspect-ratio: auto  │   ║    (160/144 o 240/160 a seconda del core)
║  │   min-height: ~200px  │   ║    top: subito sotto la tab bar
║  │                       │   ║
║  └───────────────────────┘   ║
║                               ║
║  [ Avvia ] [ Pausa ] [Full]   ║  ← controlli sotto il viewport
║  core: gambatte | idle        ║
║                               ║
║  [se idle: CTA "Carica ROM"   ║
║   + "Vai a Libreria"]         ║
║                               ║
╠═══════════════════════════════╣
║  [safe-area-inset-bottom]     ║  ← padding per notch/home indicator
╚═══════════════════════════════╝
```

**Note mobile:**
- La tab bar è fissa in basso (o in alto se si preferisce non sovrapporsi ai controlli touch). Si propone **in alto subito sotto l'header** per evitare conflitti con il TouchOverlay che occupa la parte bassa dello schermo.
- In stato di gioco attivo (running/paused), i controlli (Pausa/Riprendi/Arresta) possono collassare in un HUD minimo per non togliere spazio al viewport.

### 3c. Mobile landscape (viewport < 768px, orientation: landscape)

```
╔════════════════════════════════════════════════════════╗
║  Soli-boy  [Play][Lib][Imp][Info]          [HUD min]  ║
╠══════════════╦══════════╦═════════════════════════════╣
║              ║          ║                             ║
║  D-PAD       ║ VIEWPORT ║   A/B/Start/Select buttons ║
║  (touch)     ║  GIOCO   ║   (touch)                  ║
║              ║          ║                             ║
║ [safe-area]  ║          ║   [safe-area]               ║
╚══════════════╩══════════╩═════════════════════════════╝
```

**Note landscape:**
- In landscape il layout diventa a 3 colonne: D-pad | schermo | tasti azione.
- Il TouchOverlay non flotta sopra lo schermo ma si dispone *accanto* al viewport (vedi §4).
- La tab bar si comprime all'header (icon only) per non sprecare spazio verticale.

---

## 4. Riposizionamento TouchOverlay

### Problema attuale (confermato dal codice)

`TouchOverlayInner` viene montato come figlio diretto di `<section .sb-app>` (figlio di Player, a sua volta figlio di App). Il container usa `position: absolute; inset: 0` — questo crea un overlay che copre l'intera sezione `.sb-app`, NON solo il viewport. Il risultato: i tasti virtuali si trovano *sopra il testo* di Settings, Library, etc. quando la pagina è scorsa.

Inoltre, `dpadOffsetX/Y` e `buttonsOffsetX/Y` sono percentuali dell'intero container `.sb-app` — non dell'area di gioco. Questo rende il posizionamento incoerente tra diversi viewport.

### Soluzione proposta: overlay ancorato al viewport (.sb-screen)

**Variante A — Overlay dentro .sb-screen (cambio di ancoraggio)**

Il `TouchOverlay` diventa figlio di `.sb-screen` (il div con ref `screenRef`) invece che figlio di `<section .sb-app>`. Già oggi `.sb-screen` è `position: relative` (CSS scoped in Player.tsx). L'overlay con `inset: 0` si ancorerebbe al solo viewport.

Vantaggi:
- I tasti virtuali restano fisicamente *sopra lo schermo di gioco*, non sopra Settings.
- Il fullscreen (`requestFullscreen` su `.sb-screen`) porta con sé l'overlay → i tasti funzionano anche a schermo intero (oggi potrebbero non esserci).
- Le percentuali di offset restano coerenti con le dimensioni del viewport di gioco.

**Variante B — Overlay "sidebar" in landscape (layout-level)**

In landscape, invece di sovrapporre i tasti al viewport, il layout a 3 colonne (§3c) li posiziona lateralmente. Il TouchOverlay passa da `position: absolute overlay` a blocchi posizionati nel flusso del documento — D-pad a sinistra, tasti azione a destra. Questo è il pattern classico dei controller GBA su emulatori mobile (es. Delta, RetroArch mobile).

**Posizione raccomandata per portrait:**
- D-pad: `position: absolute; left: env(safe-area-inset-left, 8px); bottom: env(safe-area-inset-bottom, 16px)` — ancorato al bordo sinistro inferiore del `.sb-screen` (o del viewport se a schermo intero).
- Tasti A/B: `position: absolute; right: env(safe-area-inset-right, 8px); bottom: env(safe-area-inset-bottom, 16px)` — bordo destro inferiore.
- Start/Select: `position: absolute; bottom: env(safe-area-inset-bottom, 8px); left: 50%; transform: translateX(-50%)` — centrati in basso.

**Safe-area:** usare CSS `env(safe-area-inset-*)` per iPhone X+ e Android con notch. Il CSS del TouchOverlay già gestisce `sb-touch-landscape` come classe condizionale — estendere con custom properties per safe-area.

**Target size:** i tasti D-pad (44x44px CSS) e AB (50x50px) rispettano già `--sd-layout-touch-target-min: 44px` (WCAG 2.5.8, confermato in `solids-theme.css`). Mantenere invariato il sizing.

**Rationale del riposizionamento:**
- Ancorare l'overlay al viewport di gioco (non all'intera pagina) è la scelta semanticamente corretta: i controlli touch riguardano il gioco, non la pagina.
- Il link tra tasto virtuale e azione di gioco è più immediato se i tasti appaiono *dentro* o *accanto* al viewport, non sparsi su layout di configurazione.
- La variante landscape a 3 colonne elimina la sovrapposizione tasti/schermo in landscape, che è uno dei pattern di usabilità più problematici sugli emulatori mobile.

---

## 5. Sezione Libreria (tab dedicata)

**Contenuto della tab Libreria:**
- Logo Soli-boy (già in `Library` header — invariato)
- Griglia ROM con ricerca e filtri piattaforma (invariato)
- FileLoader come CTA secondaria in fondo: "Aggiungi ROM" — pulsante o dropzone discreta

**Rationale:** la Library è già un componente autonomo con il proprio header. Spostarla in una tab dedicata non richiede modifiche interne al componente — solo di non renderizzarla nella tab Play.

**Stato idle (nessuna ROM):** la tab Libreria mostra lo stato vuoto con CTA "Carica ROM" prominente. La tab Play mostra lo schermo idle con link "Vai alla Libreria per scegliere un gioco".

---

## 6. Sezione Impostazioni (tab dedicata con accordion)

**Struttura proposta (accordion con sotto-sezioni):**

```
[Impostazioni]
  ▾ Controlli             — rimappatura tasti fisici (Settings profile)
  ▾ Resa video            — scala, aspect ratio, filtro
  ▾ Aspetto               — tema UI (ThemeSelector)
  ▾ Mobile                — haptics toggle
  ▾ Dati                  — export/import salvataggi (SaveService)
```

**Nessuna sotto-sezione eliminata** — tutte le funzionalità esistenti vengono mantenute, solo progressivamente rivelate (accordion chiuso di default, espandibile su click).

**Rationale:** l'accordionatura riduce il "muro di configurazione" senza nascondere feature. L'utente esperto può aprire qualsiasi sezione; l'utente nuovo non viene travolto da form.

**a11y accordion:** ogni `<summary>` / trigger di accordion ha:
- `aria-expanded` che riflette lo stato aperto/chiuso.
- Testo accessibile (già presente come testo visivo nelle sezioni).
- Focus management: aprire un accordion non sposta il focus automaticamente (evitare confusione per utenti tastiera).

---

## 7. Sezione Info & Privacy (tab dedicata)

**Contenuto:**
- `<PrivacyNotice variant="section">` — invariato
- `<StoreComplianceNotice>` — invariato
- `<LegalNotice>` — spostato da `<footer>` a questa sezione (rimane anche nel footer come nota concisa)

**Rationale:** i contenuti legali/privacy sono sempre disponibili ma non devono inquinare il flusso di gioco. Una tab dedicata è il pattern standard (es. "About" / "Legal" in app mobile).

---

## 8. Navigazione: approccio implementativo raccomandato

**Pattern consigliato: stato locale in App con render condizionale per tab**

```typescript
type Tab = "play" | "library" | "settings" | "info";
const [activeTab, setActiveTab] = useState<Tab>("play");
```

Ogni tab renderizza il proprio contenuto condizionalmente. Il `<Player>` rimane **sempre montato** (anche quando la tab non è "play") per non interrompere l'emulazione se l'utente naviga a Libreria. Solo il layout cambia, non lo stato del gioco.

**Alternativa: React Router** — non necessaria se l'app è una SPA senza routing URL. La navigazione a tab locale è sufficiente e non introduce dipendenze.

**Tab bar markup:**

```html
<nav aria-label="Navigazione principale" role="navigation">
  <button role="tab" aria-selected="true"  aria-controls="panel-play">Play</button>
  <button role="tab" aria-selected="false" aria-controls="panel-library">Libreria</button>
  <button role="tab" aria-selected="false" aria-controls="panel-settings">Impostazioni</button>
  <button role="tab" aria-selected="false" aria-controls="panel-info">Info & Privacy</button>
</nav>
<div id="panel-play"     role="tabpanel" aria-labelledby="tab-play">...</div>
<div id="panel-library"  role="tabpanel" aria-labelledby="tab-library" hidden>...</div>
<div id="panel-settings" role="tabpanel" aria-labelledby="tab-settings" hidden>...</div>
<div id="panel-info"     role="tabpanel" aria-labelledby="tab-info" hidden>...</div>
```

**Focus order (tab Play):**
1. Skip-link "Vai al contenuto principale" (opzionale ma raccomandato).
2. Header + nav tab (h1 + 4 tab button).
3. Viewport di gioco (`.sb-screen`) — focus-visible solo se interattivo.
4. Controlli runtime (Avvia / Pausa / Riprendi / Arresta / Schermo intero).
5. HUD testuale (non interattivo, non in tab order).
6. Pannello Save State (se presente).
7. FileLoader (se idle).

**Landmark di navigazione (fix F-03 dalla review):**
- `<header>` con `role="banner"` e `<h1>` — già presente.
- `<nav aria-label="Navigazione principale">` — NUOVO.
- `<main>` che wrappa il contenuto della tab attiva — già presente come `<main .sb-app>`.
- `<footer>` per la LegalNotice — da aggiungere come landmark esplicito.
- Le `<section>` con `aria-label` unico per ciascuna (fix landmark-unique da a11y.json).

---

## 9. Accessibilità by design

| Aspetto | Stato attuale | Proposta |
|---|---|---|
| Landmark navigation | `<section>` senza `aria-label` univoci (F-03) | `<nav aria-label="Navigazione principale">` + section con label univoci per tab |
| Focus order | Lineare top-bottom su colonna lunga | Lineare e coerente per-tab; Player sempre primo nella tab Play |
| Target size | 44px già presente (`--sd-layout-touch-target-min`) | Invariato; tab button ≥ 44px |
| Contrasto | Non ispezionato in questo deliverable | Vedi design system token — da verificare con ux-ui-reviewer |
| TouchOverlay a11y | `aria-hidden="true"` su overlay (corretto — non nel tab order) | Invariato; i controlli touch non sono accessibili via tastiera by design (uso touch device) |
| Schermo intero | `aria-label` + `aria-pressed` già presenti | Invariato |
| Tab panels | Non presente | `role="tabpanel"`, `aria-labelledby`, `hidden` su panel inattivi |
| Accordion settings | Non presente | `aria-expanded` su trigger, `aria-controls` su pannello |

---

## 10. Assumptions dichiarate

```yaml
assumptions:
  - id: A-01
    statement: >
      Il Player può essere sempre montato nella DOM (anche quando la tab attiva non è "play")
      senza impatti sulle performance. L'engine (WasmBoy) è avviato esplicitamente via
      wrapper.start() — montare il componente senza avviare l'engine non causa WASM execution
      non desiderata. Questa assumption è critica: se WasmBoy si inizializza al mount (non
      all'invocazione di load/start), il Player dovrebbe essere montato solo nella tab Play.
    confidence: medium
    needs_verification: true
    source: Player.tsx analisi — wrapper.load è chiamato solo in handlePlay, non al mount

  - id: A-02
    statement: >
      La navigazione a tab non interferisce con la gestione del Fullscreen API.
      requestFullscreen su .sb-screen deve funzionare indipendentemente da quale tab è attiva.
      In pratica la tab Play deve essere attiva per usare il fullscreen — comportamento atteso.
    confidence: high
    needs_verification: false

  - id: A-03
    statement: >
      L'app è usata principalmente su mobile touch (contesto emulatore portatile) o desktop.
      La navigazione a tab barra è il pattern più riconoscibile su entrambe le piattaforme.
    confidence: high
    needs_verification: false

  - id: A-04
    statement: >
      Il design system @soli92/solids espone classi/token per componenti tab/accordion (sd-tab,
      sd-accordion o simili). Se non disponibili, i tab/accordion vanno implementati con
      classi sb- custom coerenti con il DS esistente (sb-btn, sb-lbl, sd-card, etc.).
    confidence: low
    needs_verification: true
    source: solids-theme.css analisi — non sono state trovate classi sd-tab o sd-accordion

  - id: A-05
    statement: >
      Il banner PrivacyNotice (primo avvio) non richiede modifiche: rimane come overlay/banner
      a prescindere dalla navigazione tab. Il flusso di ack rimane in App.tsx.
    confidence: high
    needs_verification: false

  - id: A-06
    statement: >
      La prop `selected` in App.tsx (ROM selezionata) determina il contenuto della tab Play.
      La libreria può selezionare una ROM e poi "navigare automaticamente" alla tab Play —
      comportamento UX desiderabile (auto-switch a Play dopo selezione dalla Libreria).
      Questo richiede che setActiveTab sia accessibile dall'handler onSelect.
    confidence: high
    needs_verification: false
```

---

## 11. Open questions (richiedono conferma del maintainer)

```yaml
open_questions:
  - id: OQ-01
    question: >
      Il Player deve rimanere montato (e l'emulazione in corso) quando l'utente naviga
      alla tab Libreria o Impostazioni? O è accettabile che navigare via da "Play" metta
      automaticamente in pausa l'emulazione?
    impact: >
      Determina se il Player può essere un figlio permanente del DOM o deve essere
      condizionale alla tab attiva. Se la pausa automatica è accettabile, il Player
      può essere smontato/rimontato (più semplice ma rompe lo stato del core).
      Se deve rimanere in background, serve mantenerlo montato ma visivamente nascosto.
    stakeholder: maintainer

  - id: OQ-02
    question: >
      L'auto-switch alla tab Play dopo selezione di una ROM dalla Libreria è il comportamento
      desiderato? Alternativa: l'utente seleziona dalla Libreria, il gioco si carica in background,
      e l'utente naviga manualmente a Play.
    impact: Impatta il wiring onSelect tra Library e gestione dello stato di navigazione in App.tsx.
    stakeholder: maintainer

  - id: OQ-03
    question: >
      Il FileLoader (Carica ROM / drag & drop) deve essere disponibile:
      (a) solo nella tab Libreria, oppure
      (b) sia nella tab Play (come CTA nello stato idle) sia nella tab Libreria?
      La duplicazione aumenta l'accessibilità ma può confondere la struttura IA.
    impact: Positioning del componente FileLoader nell'IA.
    stakeholder: maintainer

  - id: OQ-04
    question: >
      Il TouchOverlay come variante landscape a 3 colonne (D-pad | schermo | tasti) richiede
      un cambio sostanziale al CSS del componente. È un cambiamento accettabile, o è preferibile
      mantenere l'overlay assoluto e correggere solo l'ancoraggio (Variante A — overlay dentro
      .sb-screen)?
    impact: Variante A è un refactoring minore; Variante B richiede un redesign CSS più esteso.
    stakeholder: maintainer / fe-dev

  - id: OQ-05
    question: >
      Il componente Settings ha sotto-sezioni condizionali (tema, haptics) che sono opzionali
      per backward compat dei test. Il refactoring in accordion deve mantenere questa opzionalità?
      In pratica: le sezioni senza prop (tema assente, haptics assente) vengono omesse dall'accordion
      (comportamento attuale) o mostrate come voce disabled?
    impact: Impatta la logica di render dell'accordion in Settings.
    stakeholder: fe-dev

  - id: OQ-06
    question: >
      La tab "Info & Privacy" deve essere presente sempre o solo se non ancora confermato il
      banner privacy? La PrivacyNotice (section) è già sempre visibile in Settings — con la
      separazione in tab, dove va la sezione privacy se l'utente non ha ancora confermato?
    impact: Gestione del banner vs sezione privacy nel nuovo layout a tab.
    stakeholder: maintainer
```

---

## 12. Sintesi rationale delle scelte principali

1. **Emulator-first (Player sempre presente in tab Play):** L'app è un emulatore. L'obiettivo primario dell'utente è giocare. Il viewport di gioco deve essere il primo contenuto visibile, non il risultato di una catena di azioni (carica ROM → appare Player). Lo stato idle del viewport ("Seleziona un gioco") comunica chiaramente la funzione dell'app.

2. **Tab navigazione invece di accordion top-level:** Le 4 sezioni (Play / Libreria / Impostazioni / Info) hanno obiettivi utente nettamente distinti. La navigazione a tab è il pattern standard per separare destinazioni funzionali differenti (non varianti della stessa funzione). L'accordion è usato *dentro* la tab Impostazioni per la progressive disclosure delle sotto-sezioni.

3. **TouchOverlay ancorato al viewport:** I controlli touch appartengono all'esperienza di gioco, non alla pagina. Ancorarli a `.sb-screen` (già `position: relative`) è semanticamente corretto e risolve il problema di posizionamento senza introdurre nuovi layer di stacking context.

4. **Safe-area CSS per mobile:** usare `env(safe-area-inset-*)` garantisce che i tasti virtuali non vengano nascosti dal notch o dall'indicatore home — richiede configurazione del viewport meta tag (`viewport-fit=cover`) che è già standard per app Capacitor.

5. **Nessun componente eliminato:** tutte le funzionalità esistenti (rimappatura controlli, BIOS, save-state, privacy, legal, haptics, tema) sono mantenute — solo riorganizzate. Il costo implementativo è strutturale (nuovo layout a tab + accordion), non funzionale.

---

*Deliverable prodotto da ui-designer (ADR-020, US-030). Passare a `/ux-ui-review --tsk=adhoc` per la valutazione. Il designer non auto-valuta il proprio output (vincolo no-auto-eval, ADR-020 §H).*
