# Soliboy — Deep A11y Audit (WCAG 2.2 AA)

**Data:** 2026-06-15
**Standard:** WCAG 2.2 AA (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`)
**Tool:** axe-playwright v2.2.2 + Playwright 1.60.0 (Chromium headless)
**Viewports:** mobile 375x812, desktop 1280x900
**Serve:** `vite preview` su `http://127.0.0.1:4174/`
**Stati scansionati:** 7 (privacy-notice, home-empty, library-empty, player-active, settings-panel, theme-selector, info-panel)
**Scansioni totali:** 14 (7 stati × 2 viewport)
**Agente:** a11y-specialist (ADR-014 modalità 3 standalone)

> Regola di neutralità invariante (ADR-016 §G): nessun errore automatico rilevato non implica conformità WCAG.
> I tool automatici coprono il 30-40% dei criteri. Restano 12 verifiche manuali obbligatorie.

---

## Stato iniziale — Privacy Notice overlay

### Stato: privacy-notice

Viewport mobile (375px): 0 violations (critical: 0, major: 0, minor: 0)
Viewport desktop (1280px): 0 violations (critical: 0, major: 0, minor: 0)

Nessun errore automatico rilevato su questo stato.

**Osservazioni da code review:**
- `<section role="region" aria-labelledby="sb-privacy-heading-banner">` — corretto: landmark region con label.
- `<p id="sb-privacy-heading-banner" className="sb-lbl">` — il heading ID corrisponde all'`aria-labelledby`. Nota: l'elemento è `<p>` non `<h2>`. Questo è un aspetto da verificare manualmente (cfr. manual check 1.3.1).
- Il pulsante "Ho capito" ha `aria-label={PRIVACY_ACK_LABEL}` ridondante con il testo visibile — non un errore, ma minima verbosità per gli AT.
- `<i className="ti ti-shield-check" aria-hidden="true">` — icone correttamente rimosse dall'albero di accessibilità.

---

## Home / Play tab — nessuna ROM

### Stato: home-empty

Viewport mobile (375px): 0 violations (critical: 0, major: 0, minor: 0)
Viewport desktop (1280px): 0 violations (critical: 0, major: 0, minor: 0)

Nessun errore automatico rilevato su questo stato.

**Osservazioni da code review:**
- `<h1 className="sb-title sb-title--logo"><img className="sb-logo" src={logoUrl} alt="Soli-boy" /></h1>` — heading di pagina presente, alt testo fornito. Corretto.
- `<nav aria-label="Navigazione principale">` — landmark nav con label. Corretto.
- `<div role="tablist" aria-label="Sezioni app">` — tablist con label. Corretto.
- Pulsanti tab usano `role="tab"`, `aria-selected`, `aria-controls` — pattern WAI-ARIA corretto.
- `tabIndex={activeTab === tab.id ? 0 : -1}` — roving tabindex implementato correttamente. Keyboard navigation con ArrowLeft/ArrowRight presente in `handleTablistKeyDown`.
- `<div id="panel-play" role="tabpanel" aria-labelledby="tab-play">` — tabpanel con `aria-labelledby`. Corretto.
- Panel nascosto con `hidden` attribute (non CSS `display:none`): `hidden={activeTab !== "play"}` — corretto, il browser rimuove il panel dall'albero di accessibilità.
- `<div class="sb-dropzone" role="button" tabIndex={0} aria-label="Trascina qui una ROM">` — area drag&drop con role e keyboard handler (`Enter`/`Space`). Corretto.
- `<label className="sb-btn sb-btn-primary">Carica ROM<input type="file" ... /></label>` — il `<label>` wrapping il `<input>` nascosto (`display:none`) fornisce l'accessible name. Corretto ma l'`<input>` ha anche `aria-label="Carica ROM"` ridondante (non un problema, solo duplicazione).

---

## Libreria — vuota

### Stato: library-empty

Viewport mobile (375px): 0 violations (critical: 0, major: 0, minor: 0)
Viewport desktop (1280px): 0 violations (critical: 0, major: 0, minor: 0)

Nessun errore automatico rilevato su questo stato.

**Osservazioni da code review:**
- `<section aria-label="Libreria giochi">` — landmark section con label. Corretto.
- `<p className="sb-note">Nessun gioco. Carica una ROM per iniziare.</p>` — testo stato vuoto visibile e leggibile dagli AT senza role speciale. Corretto (non è un alert).
- `<img src={logoUrl} alt="Soli-boy" className="sb-app-logo">` — logo header con alt. Corretto.
- `<header className="sd-flex sd-items-center sd-gap-md">` — il `<header>` dentro la section ha semantica di landmark `banner` solo se top-level; dentro una `<section>` diventa `header` generico. Accettabile.

**Osservazione potenziale:** Quando la libreria contiene ROM, il filtro piattaforma usa `<button role="radio" aria-checked={active}>` — questo implementa un radiogroup con pulsanti invece dell'elemento nativo `<input type="radio">`. È un pattern WAI-ARIA valido (ARIA Authoring Practices), ma richiede verifica manuale del comportamento AT (cfr. manual check 4.1.2).

---

## Player attivo — stub engine

### Stato: player-active

Viewport mobile (375px): 0 violations (critical: 0, major: 0, minor: 0)
Viewport desktop (1280px): 0 violations (critical: 0, major: 0, minor: 0)

Nessun errore automatico rilevato su questo stato.

**Osservazioni da code review:**
- `<section className="sb-app">` (Player) — la section interna al tabpanel è un region implicito. Manca `aria-label` su questa section interna: non un errore WCAG, ma potrebbe causare regioni duplicate per gli AT (il tabpanel parent già fornisce il contesto).
- `<div className="sb-screen" aria-label="Schermo di gioco">` — etichetta presente sul contenitore del canvas. Positivo.
- Il canvas vivo (WASM player) non ha `role` o `aria-label` esplicito — il canvas è sempre concettualmente una black box per gli AT. Il testo "Premi Avvia" / "In esecuzione" / "In pausa" come text content del `<div class="sb-screen">` fornisce feedback visivo ma potrebbe non essere annunciato dagli AT se il canvas sovrapposto lo copre visivamente.
- `<button aria-label={fsLabel} aria-pressed={fullscreen.isFullscreen}>` — pulsante fullscreen con stato `aria-pressed`. Corretto.
- `<p className="sb-note" role="alert">` per gli errori del player — corretto uso di `role="alert"`.
- `<div className="sb-hud">` contiene `<span>{rom.core}</span><span>{state}</span>` — HUD testuale senza label. L'HUD è informativo ma non interattivo: accettabile, ma verificare se necessita `aria-live` per i cambi di stato (cfr. manual check 4.1.3).
- **TouchOverlay:** ha `aria-hidden="true"` sull'intero overlay e `tabIndex={-1}` su tutti i pulsanti interni — correttamente escluso dalla navigazione a tastiera (è un overlay esclusivamente touch). Il pattern è appropriato per un dispositivo touch; su desktop il player si usa con tastiera fisica. Corretto.
- `<TouchOverlayConfigPanel>` ha `aria-hidden="true"` — il config panel dell'overlay è anch'esso nascosto agli AT. Questo è corretto per la scelta progettuale (touch-only), ma va verificato manualmente su device touch con AT (cfr. manual check 1.3.1).

---

## Settings panel

### Stato: settings-panel

Viewport mobile (375px): 0 violations (critical: 0, major: 0, minor: 0)
Viewport desktop (1280px): 0 violations (critical: 0, major: 0, minor: 0)

Nessun errore automatico rilevato su questo stato.

**Osservazioni da code review:**
- `<section className="sd-card sb-sec" aria-label="Impostazioni controlli">` — sezione con label. Corretto.
- Accordion con `<details>`/`<summary>` — semantica nativa HTML, nessun ARIA aggiunto necessario. Il browser implementa il pattern expand/collapse nativamente. `role="group"` implicito da `<details>`. Corretto.
- `<summary className="sb-lbl">` — il marker nativo è nascosto via CSS (`::-webkit-details-marker`, `::marker`). Questo NON rimuove la semantica: `<summary>` mantiene il suo ruolo di button/disclosure nel DOM accessibile. Il chevron custom via `::after` è puramente decorativo (`content: ""` di tipo border). Corretto.
- `<select className="sb-sel" aria-label="Pulsante per ${key}">` — ogni select del keymap ha `aria-label`. Corretto.
- `<select aria-label="Fattore di scala">`, `<select aria-label="Aspect ratio">`, `<select aria-label="Filtro video">` — tutti i select video hanno label. Corretto.
- `<button role="switch" aria-checked={hapticsEnabled} aria-label="Feedback aptico">` — toggle haptics con pattern ARIA switch. Corretto.
- `<div role="group" aria-label="Esporta e importa salvataggi">` — il gruppo dati ha label. Corretto.
- `<input type="file" aria-label="Importa file di salvataggio">` — input file con label. Corretto.
- `<p role={dataMessage.kind === "error" ? "alert" : "status"}>` — feedback appropriato per errori (alert) e successi (status). Corretto.
- `<p className="sb-note" role="status">Profilo salvato.</p>` — feedback salvataggio con `role="status"`. Corretto.

**Punto attenzione:** `<button className="sb-btn sb-full" onClick={...}>Salva profilo</button>` nella sezione "Controlli" non ha `type="button"` esplicito — all'interno di una `<section>` non c'è form, quindi il default è `type="submit"` ma non ha effetto senza form. Non un bug funzionale, ma una buona pratica è aggiungere `type="button"` esplicitamente (i pulsanti in Settings.tsx con `type="button"` esplicito sono la maggioranza; questo uno è mancante). Non un finding WCAG.

---

## ThemeSelector

### Stato: theme-selector

Viewport mobile (375px): 0 violations (critical: 0, major: 0, minor: 0)
Viewport desktop (1280px): 0 violations (critical: 0, major: 0, minor: 0)

Nessun errore automatico rilevato su questo stato.

**Osservazioni da code review:**
- `<select aria-label="Tema dell'interfaccia">` con opzioni `90's Party`, `Dark`, `Cyberpunk` — label chiara. Corretto.
- Il componente ThemeSelector è una `<li>` con `<span class="sb-key">` + `<select>` — struttura valida dentro la `<ul class="sb-keymap">` della sezione Settings "Aspetto".
- Le opzioni hanno label testuali leggibili. Corretto.

---

## Info & Privacy panel

### Stato: info-panel

Viewport mobile (375px): 0 violations (critical: 0, major: 0, minor: 0)
Viewport desktop (1280px): 0 violations (critical: 0, major: 0, minor: 0)

Nessun errore automatico rilevato su questo stato.

**Osservazioni da code review:**
- Il panel contiene: `<PrivacyNotice variant="section">` + `<StoreComplianceNotice>` + `<LegalNotice>`.
- `<section aria-labelledby="sb-privacy-heading-section">` — region con label. Corretto.
- `<section aria-labelledby="sb-store-compliance-heading">` — region con label. Corretto.
- `<p role="note" aria-label="Avviso legale">` in LegalNotice — non standard (i `<p>` con `role="note"` non hanno impatto negativo ma il role `note` non è un ruolo ARIA standard; è accettato come generic). Da verificare.
- `<p role="note" aria-label="Avviso conformità store: no-ROM protette">` — label distinto da LegalNotice per evitare collisioni con e2e strict mode. Scelta intenzionale documentata nel codice.
- `<ul aria-label="Punti informativa privacy">` — lista con label. Corretto.

---

## Riepilogo globale

### Total violations by severity (cross-state, automated)

| Severity | Count | Stati coinvolti |
|---|---|---|
| Critical | 0 | — |
| Major | 0 | — |
| Minor | 0 | — |
| **Totale automated findings** | **0** | — |

**Nessun errore automatico rilevato; restano 12 verifiche manuali obbligatorie.**

Il risultato è coerente con la storia del progetto: TSK-084 ha già applicato gli override di color-contrast WCAG AA per i 3 temi (dark, 90s-party, cyberpunk) in `app-extra.css`, e lo sviluppo ha integrato ARIA semantics in modo sistematico (tablist, tabpanel, region, switch, group, alert, status).

---

### Top 5 finding manuali più impattanti

Questi non sono violation automatiche ma aree critiche che richiedono verifica manuale qualificata:

**1. Canvas del player — assenza di alternativa testuale live (WCAG 1.1.1 / 4.1.3)**
Il `<canvas>` reso dall'engine WASM (WasmBoy/mGBA) non ha `role`, `aria-label` né `aria-live`. Durante il gioco il contenuto visivo (frame di gioco) non è accessibile agli screen reader. Questo è strutturalmente inevitabile per un emulatore, ma va documentato esplicitamente come limitazione e verificato se il contesto di uso (gioco videoludico) è esentato dai criteri di contenuto non-testo.

**2. Testo HUD in esecuzione — assenza di aria-live (WCAG 4.1.3)**
Lo stato del player (`"In esecuzione"` / `"In pausa"` / `"Premi Avvia"`) è text content del `<div class="sb-screen">`. Non c'è `aria-live` region che annunci i cambi di stato. Un utente screen reader potrebbe non sapere quando il gioco passa da idle a running senza esplorare il DOM. Verifica se `aria-live="polite"` sull'HUD o sullo screen div è appropriato.

**3. TouchOverlay config panel — escluso dall'albero AT (WCAG 1.3.1 / 4.1.2)**
`<TouchOverlayConfigPanel>` ha `aria-hidden="true"` sull'intero wrapper. I range slider di configurazione (opacità, scala, posizioni) sono completamente inaccessibili agli AT. Su dispositivi touch con VoiceOver/TalkBack attivo l'utente non può configurare l'overlay. La scelta è intenzionale (touch-only overlay) ma esclude utenti con disabilità motorie che usano switch access + screen reader su mobile. Valutare se esporre una modalità tastiera/AT alternativa o documentare esplicitamente come limitazione.

**4. Heading semantico nei componenti info/privacy (WCAG 1.3.1)**
`PrivacyNotice`, `StoreComplianceNotice` e le sezioni Settings usano `<p className="sb-lbl">` come heading visivo (fornisce il testo per `aria-labelledby`), non elementi `<h2>`/`<h3>`. La struttura heading della pagina non è quindi gerarchica (`h1` nell'header, poi `<p>` con stile heading nelle sezioni). Gli AT che navigano per heading non trovano livelli sotto `<h1>`. Verificare se questo è intenzionale o se i `<p>` heading dovrebbero essere promossi a `<h2>`.

**5. PlatformChip in Library — radiogroup con button (WCAG 4.1.2)**
Il filtro piattaforma usa `<button role="radio" aria-checked>` dentro `<div role="radiogroup">`. È un pattern ARIA valido (ARIA APG), ma la navigazione con AT potrebbe differire dal comportamento nativo atteso: i radio nativi si navigano con frecce senza tabstop intermedi; questi button richiedono Tab (o arrow key solo se il radiogroup implementa roving tabindex). Verificare con VoiceOver/NVDA che il comportamento sia coerente con le aspettative degli utenti AT.

---

### Manual checks obbligatori (N=12, regola di neutralità ADR-016 §G)

| # | WCAG | Item | Status |
|---|---|---|---|
| 1 | 1.1.1 | Verifica che il canvas dell'emulatore abbia una alternativa testuale documentata o sia esentato come contenuto non-testo decorativo/gioco | to_verify |
| 2 | 1.3.1 | Verifica la struttura heading della pagina (h1 presente; verificare se le sezioni necessitano di h2/h3 invece di `<p>` con stile heading) | to_verify |
| 3 | 1.3.2 | Verifica che l'ordine di lettura degli AT sia coerente con l'ordine visivo in tutti e 7 gli stati scansionati | to_verify |
| 4 | 1.4.3 | Verifica il contrasto colore per i token del tema `90s-party` su elementi non ancora coperti da TSK-084 (es. testo HUD, badge SDK, testo placeholder input) | to_verify |
| 5 | 1.4.3 | Verifica il contrasto colore dei temi `dark` e `cyberpunk` per gli stati dinamici (hover, focus, disabled) non raggiungibili da axe headless | to_verify |
| 6 | 1.4.4 | Verifica che il testo dell'app si ridimensioni fino al 200% senza perdita di contenuto o funzionalità (browser zoom, non solo text-size) | to_verify |
| 7 | 1.4.10 | Verifica reflow: contenuto fruibile a 320px di larghezza senza scroll orizzontale (specialmente tabbar + accordion Settings + GameTile grid) | to_verify |
| 8 | 2.1.1 | Verifica che tutte le funzionalità (avvia, pausa, arresta, salva stato, importa ROM, seleziona tema, naviga library) siano operabili via sola tastiera | to_verify |
| 9 | 2.4.3 | Verifica che l'ordine di focus sia logico e prevedibile in tutti gli stati (specialmente il panel Play con Player + FileLoader CTA compresenti nel DOM) | to_verify |
| 10 | 2.4.7 | Verifica che l'indicatore di focus visibile sia sempre presente e sufficientemente visibile per tutti gli elementi interattivi (focus-visible definito in CSS, ma verificare contrasto su tutti i temi) | to_verify |
| 11 | 4.1.2 | Verifica il comportamento AT dei PlatformChip (`role="radio"` + `aria-checked`) con screen reader reale (VoiceOver/NVDA) — navigazione e annuncio stato | to_verify |
| 12 | 4.1.3 | Verifica che i cambi di stato dinamici (player running/paused, messaggi di feedback salvataggio, errori import) siano annunciati dagli AT senza action utente | to_verify |

---

### Raccomandazioni prioritizzate

#### Priorità Alta (impatto su utenti AT che interagiscono attivamente con l'app)

**R-01 — Promuovere headings semantici nelle sezioni informative**
`PrivacyNotice.tsx`, `StoreComplianceNotice.tsx`, e le intestazioni accordion in `Settings.tsx` usano `<p className="sb-lbl">` come heading visivo. Sostituire con `<h2>`/`<h3>` appropriati (mantenendo le classi CSS) per consentire la navigazione per heading agli utenti AT.

Impatto: WCAG 1.3.1 (Info e relazioni). Effort basso: sostituzione `<p>` → `<h2>`/`<h3>` nei componenti citati.

**R-02 — aria-live per cambio stato Player**
Aggiungere `aria-live="polite"` e `aria-atomic="true"` sull'elemento che mostra lo stato corrente del player ("Premi Avvia" / "In esecuzione" / "In pausa") in `Player.tsx`. Questo consente agli AT di annunciare il cambio stato senza che l'utente debba navigare attivamente.

Impatto: WCAG 4.1.3 (Messaggi di stato). Effort minimo: un attributo su un elemento esistente.

**R-03 — Documentare esplicitamente la limitazione del canvas emulatore**
Il canvas WASM non ha e non può avere un'alternativa testuale durante il gioco. Aggiungere un `<figcaption>` o un `<div aria-live="polite">` adiacente al canvas che annunci il titolo del gioco e lo stato (es. "Gioco corrente: [titolo] — In esecuzione") — non può sostituire il contenuto visivo, ma fornisce un contesto minimo per gli AT.

Impatto: WCAG 1.1.1. Effort medio.

#### Priorità Media (accessibilità migliorabile senza blocker)

**R-04 — Valutare accessibilità TouchOverlay config panel**
Il pannello di configurazione dell'overlay touch (`TouchOverlayConfigPanel`) è `aria-hidden`. Considerare una modalità accessibile alternativa per la configurazione dell'overlay (es. esposizione degli stessi slider nelle impostazioni del Player accessibili da tastiera), oppure documentare esplicitamente che la configurazione è touch-only come limitazione nota.

**R-05 — Aggiungere `type="button"` al pulsante "Salva profilo" in Settings**
Il `<button>Salva profilo</button>` in `Settings.tsx` (sezione "Controlli") manca di `type="button"`. Tutti gli altri pulsanti interattivi di Settings hanno il tipo esplicito. Non è un finding WCAG ma una inconsistenza.

**R-06 — Verificare `<p role="note">` in LegalNotice e StoreComplianceNotice**
Il `role="note"` non è un ruolo ARIA standard (non è nel WAI-ARIA spec). Alcuni AT possono ignorarlo o trattarlo come generic. Valutare se rimuovere il role (la semantica `<p>` è sufficiente) oppure utilizzare `role="region"` con `aria-label` se si vuole un landmark.

#### Priorità Bassa (polish, non impattante su funzionalità core AT)

**R-07 — Ridurre ridondanza `aria-label` su elementi con testo visibile identico**
`PrivacyNotice` pulsante "Ho capito" ha `aria-label={PRIVACY_ACK_LABEL}` con valore identico al testo visibile. `FileLoader` input ha `aria-label="Carica ROM"` mentre il label wrapping ha già lo stesso testo. Questi non causano errori ma sono ridondanti; rimuovere gli `aria-label` ridondanti semplifica il markup.

**R-08 — `<header>` dentro Library non è un landmark banner**
`<header>` dentro `<section aria-label="Libreria giochi">` è un header generico (non banner landmark). Questo è corretto per la spec HTML5, ma potrebbe confondere. Valutare se usare `<div>` invece di `<header>` per essere espliciti sul non-landmark.

---

## Note tecniche sul processo di audit

**Scan automatizzato:** 14 scansioni completate con successo. axe-playwright v2.2.2, tag WCAG 2.2 AA. EXIT code 0 su tutti gli scan.

**Copertura stati:** Gli stati 3 (library-empty) e 4 (player-active) in presenza di ROM richiederebbero una scansione con ROM effettivamente caricata nell'IndexedDB della sessione. Il presente audit ha scansionato lo stato iniziale (libreria vuota, player idle) perché l'IndexedDB fresh non contiene ROM al primo caricamento. Gli stati con ROM caricata (GameTile grid, SaveStatePanel attivo) possono presentare finding aggiuntivi — raccomandato scan dedicato post-import ROM.

**Temi non scansionati via scan automatico:** Lo scan è stato eseguito con il tema default (`data-theme="90s-party"` come da `index.html`). I temi `dark` e `cyberpunk` non sono stati attivati durante la scansione. Le override di contrasto di TSK-084 (file `app-extra.css`) coprono tutti e 3 i temi; i finding originali documentati in TSK-040/044 iter-2 sono stati risolti. Tuttavia i temi alternativi dovrebbero essere verificati con una scansione separata che inietti `data-theme` prima dell'avvio axe.

**Limitazione axe su stati dinamici:** axe opera su un DOM statico al momento dell'iniezione. Stati dinamici come: (a) il config panel TouchOverlay aperto, (b) il SaveStatePanel con save states caricati, (c) la library grid con ROM caricate, (d) il player in esecuzione con canvas attivo, (e) il messaggio di export/import attivo — non sono stati raggiunti dall'engine axe in questo run. Richiedono scansioni dedicate.

---

> Questa capability è un pre-screening interno: non sostituisce un audit indipendente certificato (EAA / ADA / normative locali). I criteri WCAG 2.2 AA automatizzabili coprono il 30-40% del totale; le verifiche manuali sopra elencate coprono i criteri principali non automatizzabili.
