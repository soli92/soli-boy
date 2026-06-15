# UX Design Rationale — soli-boy (EP-019 Art-Director Statement)

**Prodotto da:** TSK-085 (EP-013, sprint 11)
**Data:** 2026-06-15
**Pattern:** EP-019 Design Intelligence Layer — art-director DSL

---

## EP-019 Step 1 — ART-DIRECTOR STATEMENT

```
INTENT:
  soli-boy è un emulatore retro. L'esperienza centrale è GIOCARE.
  L'utente apre l'app per vedere immediatamente il gioco — non un menu,
  non un wizard di configurazione, non una griglia di opzioni.
  Ogni decisione di design deve rispondere alla domanda:
  "questo aiuta l'utente a giocare più in fretta e con meno friction?"

PROBLEM:
  L'iterazione corrente (post-sprint 10) ha tre deficit UX misurabili:

  1. VISIBILITÀ EMULATORE — Il canvas dell'emulatore appare piccolo
     (finding: canvas CSS 378x24px in stato idle, altezza collassata).
     Su schermo desktop l'emulatore è meno prominente di quanto dovrebbe.
     L'utente non percepisce immediatamente "questo è uno schermo di gioco".

  2. TOUCH OVERLAY — L'overlay touch in portrait non-fullscreen era
     sovrapposto allo schermo (position:absolute;inset:0 su tutto il
     viewport), rendendo impossibile vedere il gioco mentre si giocava.
     Fix applicato (Variante B, 2026-06-09) ma non formalmente verificato
     e documentato nel design rationale.

  3. INFORMAZIONI LEGALI DUPLICATE — LegalNotice è presente sia nella
     tab "Info & Privacy" sia nel footer: il footer non è il posto
     canonico per info legali in un'app tab-based. Crea ridondanza,
     aumenta il DOM, segnala incertezza architetturale su dove stia
     l'"informazione legale" dell'app.

DESIGN RATIONALE:
  Tre principi guida per soli-boy:

  P1 — EMULATOR-FIRST: Il viewport di gioco è l'hero component.
    Deve avere dimensioni percepibili anche in stato idle (nessun gioco
    caricato). La scala "auto" con maxWidth 480px è corretta — l'altezza
    collassata (24px) è un bug CSS da correggere, non una scelta di design.
    Il fix non è "rendere più grande" ma "garantire che lo spazio sia
    sempre visibile" (aspect-ratio 3/2 applicato sempre).

  P2 — TOUCH CONTROLS BELOW SCREEN: Su mobile portrait i controlli
    touch devono stare SOTTO il video, non sopra. È il comportamento
    atteso da chi ha mai usato un emulatore mobile (Delta, RetroArch,
    provaMDS). In landscape e fullscreen l'overlay assoluto è corretto.
    La Variante B è la soluzione giusta — questo rationale la conferma.

  P3 — INFORMATION ARCHITECTURE: Le sezioni informative (legale, privacy,
    compliance) hanno una casa: la tab "Info & Privacy". Il footer può
    restare come elemento strutturale (margine inferiore, bordo separatore)
    ma non deve replicare contenuto già in una tab dedicata.

CONSTRAINTS:
  - Accessibilità WCAG 2.2 AA: ogni modifica deve preservare i fix
    color-contrast di TSK-084 e i pass a11y di EP-012.
  - Design System SoliDS: usare token --sd-* e classi sd-*/sb-* per
    qualunque nuovo stile. Nessun valore hardcoded per colori/spaziatura
    (ad eccezione dei fallback già esistenti nei CSS custom props).
  - Test coverage: 420 test devono restare verdi dopo ogni modifica.
  - Typecheck: nessun errore TypeScript introdotto.
  - Backwards compat: le preferenze persistite dall'utente non devono
    essere invalidate dai fix CSS/comportamentali.
  - Scope FE-only: no modifiche a backend, storage, o engine.
```

---

## EP-019 Step 2 — DESIGN SPEC DSL

### Layout A: Tab "Play" — Desktop (≥768px)

```
Component: PlayerPanel (tab Play, desktop)
Layout:
  - Flex column, centrata orizzontalmente (max-width 920px, margin auto)
  - .sb-screen: aspect-ratio 3/2, width auto (max 480px), centrato
  - .sb-player-layout: flex-column, allineamento centrato
  - Controlli (Avvia/Pausa/Stop/Fullscreen): riga sotto il canvas
  - CTA idle (nessuna ROM): FileLoader + "Vai alla Libreria" sotto i controlli
Hierarchy:
  - Primario: canvas (.sb-screen, hero component)
  - Secondario: controlli gioco (pulsanti azione)
  - Terziario: CTA idle (FileLoader + library CTA)
State:
  - idle: .sb-screen visibile con aspect-ratio (NO altezza collassata);
           testo placeholder "Premi Avvia" dentro il canvas-host
  - running: canvas attivo, testo scomparso, Pausa visibile
  - paused: canvas congelato, Riprendi visibile
Tokens:
  - --sd-color-bg-canvas: background schermo
  - --sd-space-lg: gap fra componenti
  - --sd-radius-lg: border-radius .sb-screen (se applicato)
  - width: 100% con maxWidth: 480px (già in videoSettingsToContainerStyle)
  - aspectRatio: "3 / 2" (DEFAULT_SCREEN_ASPECT_RATIO, già definito)
```

### Layout B: Tab "Play" — Mobile Portrait (≤479px)

```
Component: PlayerPanel + TouchOverlay (mobile portrait, non-fullscreen)
Layout:
  - .sb-player-layout: flex-column
  - .sb-screen: width 100% (auto scale), aspect-ratio 3/2 (forza altezza)
  - .sb-touch-overlay.sb-touch-portrait-flow: flex-row, SOTTO .sb-screen
    D-pad a sinistra, pulsanti a destra, justify-content: space-between
    min-height: 132px, padding safe-area
Hierarchy:
  - Primario: .sb-screen (video, occupa tutta la larghezza)
  - Secondario: .sb-touch-overlay (D-pad + pulsanti, separati visivamente)
  - Nascosto quando gamepad connesso (auto-hide TSK-062)
State:
  - Non-fullscreen portrait: overlay in flusso (position:relative)
  - Landscape: overlay assoluto 3-colonne (.sb-touch-landscape)
  - Fullscreen: overlay assoluto dentro .sb-screen (INCREMENT 3 invariato)
Tokens:
  - --sd-layout-touch-target-min: 44px (min target tocco per WCAG 2.5.8)
  - --sd-space-sm/md: padding e gap fra D-pad e pulsanti
  - env(safe-area-inset-*): notch/home indicator (già applicato)
```

### Layout C: Tab "Info & Privacy"

```
Component: InfoPanel
Layout:
  - Flex column, gap --sd-space-lg
  - Ordine: PrivacyNotice (section variant) → StoreComplianceNotice → LegalNotice
  - Footer: elemento strutturale vuoto (border-top + padding-top, NO contenuto)
Hierarchy:
  - Primario: PrivacyNotice (più importante per compliance GDPR)
  - Secondario: StoreComplianceNotice (info store)
  - Terziario: LegalNotice (no ROM protette — ultima, già conosciuta dall'utente)
State: static (nessuno stato interattivo)
Tokens:
  - --sd-space-lg: gap fra sezioni
  - --sd-color-border-muted: border-top footer
  - --sd-space-md: padding-top footer
```

---

## EP-019 Step 4 — CRITIC PASS (art-director self-review)

```
CRITIC:
  1. Il principio P1 (emulator-first) dipende da un fix CSS (aspect-ratio
     applicato sempre). Se il bug fosse più profondo (es. strettamente legato
     al lifecycle di montaggio React), un fix CSS-only potrebbe non bastare.
     ASSUNZIONE POTENZIALMENTE SBAGLIATA: che il problema sia solo CSS.
     Serve una verifica nel codice (useVideoSettings.ts + Player.tsx).

  2. Il principio P2 (touch below screen) è già implementato dalla Variante B.
     RISCHIO: che la Variante B abbia introdotto un nuovo problema su alcuni
     dispositivi reali (non verificabile senza device fisico — gate umano su TSK-059).
     Il test automatico (.e2e.ts mobile-touch) copre la struttura ma non il
     rendering visivo reale.

  3. Il principio P3 (info architecture) rimuove LegalNotice dal footer.
     RISCHIO: alcuni utenti si aspettano di trovare info legali nel footer
     (pattern web legacy molto consolidato). La tab "Info & Privacy" è discoverabile?
     Il tab label è chiaro? Su mobile la tab bar scrollabile potrebbe nascondere
     le tab meno usate.
     MITIGAZIONE: il label "Info & Privacy" è esplicito. Il tab è sempre
     visibile nella barra (4 tab totali, nessun overflow su mobile standard 375px).

VERDICT: conditional
  - P1: da verificare nel codice prima di dichiarare pass
  - P2: pass (Variante B già implementata e testata automaticamente)
  - P3: pass con nota (label discoverabile, 4 tab nella barra)

FIX:
  - TSK-086: verifica che videoSettingsToContainerStyle applichi aspect-ratio
    ANCHE quando scale="auto" (già fa: sì, riga 225. Ma solo per aspect="original".)
    Il problema potrebbe essere che lo state idle ha aspect="original" ma non
    lo applica quando non c'è contenuto nel canvas-host. Verificare.
  - TSK-087: audit del CSS portrait-flow, verifica che min-height 132px sia sufficiente
  - TSK-088: rimuovi LegalNotice dal footer, verifica 0 regressioni test
```
