# Digest settimanale code-review — dev-agent fe — 2026-W22
<!-- aggiornato iter TSK-033: 2026-06-01 -->

Generato: 2026-06-01 (aggiornato TSK-033 iter-1: 2026-06-01) | Reviewer: code-reviewer@2.15.0

## TSK-033 — Export/Import salvataggi (Settings 'Dati', US-019) — iter-1 → PASS

**Verdict iter-1:** pass (0 finding blocking; 1 medium advisory + 1 low advisory)
**Stack:** typescript/react/vite (conf 0.97)
**Files toccati:** save-service.ts, Settings.tsx, Settings.data.test.tsx, save-service.test.ts, App.tsx

### Finding (non-bloccanti)

**F-033-01 [low, advisory] — Handler async senza useCallback — incoerenza con refreshSaveStates (REACT-IDIOM-001)**
`Settings.tsx` — `handleExport`, `handleImportFile`, `handleImportChange` sono plain function nel corpo del componente (ricreate a ogni render). `refreshSaveStates` usa correttamente `useCallback`. Stesso pattern segnalato come F-032-1-I2 su SaveStatePanel. Nessun bug funzionale (gli handler non sono dependency di hook), ma incoerente e potenzialmente fragile su refactoring futura.
Suggerimento: avvolgere `handleExport` e `handleImportFile` in `useCallback`; `saveStateLabel` estrarre fuori dal componente (pura, senza closure).

**F-033-02 [medium, advisory] — Core-mismatch non bloccato all'import — entry zombie nel DB (TS-ROBUST-001)**
`save-service.ts` — `importSave` persiste il saveState anche quando il `core` del file non corrisponde al core della ROM (il confronto `rom.core === envelope.core` non è effettuato). Il rifiuto è differito al `loadState`. ADR-006 §Conseguenze indica che "l'import valida la compatibilità". Il commento inline riconosce la scelta ma non è formalizzata come deroga deliberata. Conseguenza: file mGBA su libreria GB produce un'entry non caricabile nel DB (storage cruft, non cancellabile da UI Settings).
Suggerimento: aggiungere `if (rom.core !== envelope.core) return { ok: false, reason: 'format-mismatch', detail: '...' }` dopo `getRom`, oppure formalizzare la deroga in ADR-006 e aggiornare US-019 AC3.

### Cosa ha funzionato bene (da replicare)

- Nessuna rete: export/import 100% on-device (File API + ObjectURL). Conforme ADR-006 Invariante e raw/tech_stack.md §Privacy.
- Formato versionato con magic string `"soliboy-save"` + version: riconoscimento deterministico, rifiuto onesto di file di altri prodotti.
- Validazione strutturale completa in `parseEnvelope`: ogni campo obbligatorio verificato per tipo; ogni fallimento mappato a reason distinto per UX comprensibile (US-019 AC3).
- Nessuna entry orfana su import KO: persistenza avviene solo dopo verifica ROM (Business Rule US-019).
- Revoke ObjectURL immediato dopo `click()`: pattern coerente con Library.tsx (approvato in TSK-039), no memory leak.
- A11y completa: `aria-label` su select/button/input, `role="group"` sulla sezione, `role="status"` per OK e `role="alert"` per KO.
- `SaveDataPort` ben segregata: Settings testabile con fake minimali, zero coupling a engine/SRAM.
- Backward-compat Props: `saveService` e `currentRom` opzionali; sezione "Dati" disabilitata con nota onesta senza nascondere feature.
- Round-trip export→import con verifica `loadState` post-import: blob non corrotto dal base64.
- Helper `bytesToBase64`/`base64ToBytes` cross-runtime documentati (chunking, fallback Node Buffer giustificato con eslint-disable).
- `currentRomSummary` con `useMemo([selected])` in App.tsx: nessuna istanza spurie, projection leggera (id+title, no Blob).

### Prossimo step

Nessuna azione bloccante. F-033-02 richiede decisione di design: aggiungere guard core-mismatch all'import **oppure** formalizzare deroga in ADR-006 + US-019 AC3. Delegare a dev-agent fe / lead-architect nel prossimo TSK. F-033-01 risolvibile opportunisticamente nel prossimo TSK fe (max_diff_lines: 80).

---

## TSK-035 — Schermo intero (Fullscreen API) — iter-2 → PASS

**Verdict iter-2:** pass (0 finding — tutti i 4 finding iter-1 risolti in commit 139dba7)
**Verdict iter-1:** conditional (1 medium blocking + 3 low advisory) — superato

---

## TSK-035 — iter-1 — archivio finding (tutti risolti)

**Verdict:** conditional (1 medium blocking + 3 low advisory)
**Stack:** typescript/react/vite (conf 0.97)
**Files toccati:** useFullscreen.ts, Player.tsx, Player.fullscreen.test.tsx, Player.test.tsx

**Verdict:** conditional (1 medium blocking + 3 low advisory)
**Stack:** typescript/react/vite (conf 0.97)
**Files toccati:** useFullscreen.ts, Player.tsx, Player.fullscreen.test.tsx, Player.test.tsx

### Pattern ricorrenti da tenere a mente

**F-035-01 [medium, blocking] — Guard null in toggle() mancante (TS-ROBUST-001)**
In `useFullscreen.ts:91-97`, `toggle()` confronta `document.fullscreenElement === ref.current`
senza guard quando `ref.current` è null. Il path `null===null` entra nel ramo exit()
che poi esce onestamente, ma la semantica e' fuorviante e il caso non e' testato.
Correzione: aggiungere `if (!ref.current) return;` all'inizio di toggle().

**F-035-03 [low, advisory] — Dissonanza aria-label / testo visibile bottone (REACT-A11Y-001)**
In `Player.tsx:119,127`, `aria-label="Esci da schermo intero"` ma testo visibile
"Esci schermo intero" (manca "da"). Viola WCAG 2.5.3 Label in Name.
Correzione: usare `{fsLabel}` come children del bottone per allineamento completo.

**F-035-02 [low, advisory] — Cast `as HTMLElement | null` non giustificato (TS-IDIOM-002)**
Firma hook dovrebbe essere `RefObject<HTMLElement | null>` invece di `RefObject<Element | null>`
per eliminare il cast a riga 75 senza perdere precisione.

**F-035-04 [low, advisory] — Commento mancante su limite `[ref]` dipendenza useEffect (TS-ROBUST-001)**
L'effetto con `[ref]` gira solo al mount perche' ref identity e' stabile — corretto per l'uso
corrente, ma non documentato come vincolo esplicito (mono-target by design).

### Cosa ha funzionato bene (da replicare)

- Cleanup listener fullscreenchange su unmount: pattern corretto con return cleanup nell'effetto.
- Fallback onesto: `isApiSupported()` + bottone disabled + title — nessun fallback custom inventato.
- a11y di base: aria-label dinamico + aria-pressed sincronizzati.
- Scope engine-agnostico rispettato: nessuna modifica a EmulatorEngine.
- Test set completo: 6 casi inclusi cleanup su unmount e fallback API assente.

### Prossimo step

~~Risolvere F-035-01 e F-035-03 (bloccanti al conditional). max_diff_lines: 80.~~
**CHIUSO iter-2 — tutti i finding risolti. TSK-035 review_status: passed.**

### Risoluzione iter-2 (commit 139dba7)

- F-035-01: guard `if (!ref.current) return;` in toggle() — no-op esplicito, +1 test null-ref.
- F-035-02: firma hook `RefObject<HTMLElement | null>`, cast rimosso da enter().
- F-035-03: `{fsLabel}` come children del bottone — aria-label e testo visibile coincidono (WCAG 2.5.3).
- F-035-04: commento `// ref identity è stabile (mono-target by design)` aggiunto.
Verde: 73 unit, 6 e2e, typecheck, build.

---

## TSK-032 — Pannello save state Player (EP-004) — iter-1 → PASS

**Verdict iter-1:** pass (0 finding blocking; 2 finding low/advisory)
**Stack:** typescript/react/vite (conf 0.97)
**Files toccati:** SaveStatePanel.tsx (nuovo), SaveStatePanel.test.tsx (nuovo), Player.tsx (+3 prop opzionali), Player.test.tsx (+2 test), App.tsx (wiring SaveService)

### Finding (non-bloccanti, risolvibili opportunisticamente)

**F-032-1-I1 [low, advisory] — Non-null assertion `rec!` senza commento (TS-IDIOM-002)**
`SaveStatePanel.tsx:266` — `new Date(rec!.createdAt)` è funzionalmente sicuro (il ramo ternario `occupied ?` garantisce rec !== undefined), ma TypeScript non restringe `rec` attraverso la variabile booleana `occupied`. La regola TS-IDIOM-002 richiede un commento giustificativo o un accesso null-safe (`rec?.createdAt ?? 0`).

**F-032-1-I2 [low, advisory] — Handler async inline non documentati come scelta di design (REACT-IDIOM-001)**
`SaveStatePanel.tsx:141-207` — `handleSave`, `handleLoad`, `handleDelete` sono plain `async function` nel corpo del componente (ricostruiti a ogni render). Non causano problemi perché non sono dependency di hook, ma per coerenza con `refresh` (che usa `useCallback`) andrebbero o documentati inline come 'non serve stable ref' oppure wrappati in `useCallback`.

### Cosa ha funzionato bene (da replicare)

- Capability check onesto via `engine.capabilities.saveStates === true` (non falsy): nessun claim falso, nota esplicita in UI.
- Doppio filtro difensivo per US-018: `listSaveStates(romId)` + `.filter(r => r.romId === romId)` nel componente. Nessun "fantasma" da altra ROM.
- Engine-mismatch senza crash (ADR-006): `role="alert"` + messaggio, region resta nel DOM. Gestione esaustiva del type union `LoadStateResult`.
- Gate running coerente su tutti e tre gli handler (Salva/Carica/Elimina).
- A11y: region etichettata, aria-label per slot su ogni bottone, disabled HTML nativo.
- Backward-compat Player: prop opzionali, pannello reso solo se saveService iniettato, test legacy invariati.
- SaveService tramite useMemo con dep [storage] stabile in App.tsx: no istanze spurie.
- Interface segregation SaveServicePort: componente testabile con fake minimali, nessun accoppiamento a SRAM (US-017).

### Prossimo step

Nessuna azione richiesta. I 2 finding low/advisory possono essere risolti nel prossimo TSK fe in modo opportunistico. TSK-032 review_status: passed.

---

## TSK-039 — Copertina gioco (upload/display) — iter-2 → PASS

**Verdict iter-2:** pass (0 finding — F-039-01 e F-039-02 risolti in commit 17b190a)
**Verdict iter-1:** conditional (1 medium blocking + 1 low advisory) — superato

### Risoluzione iter-2 (commit 17b190a)

- F-039-01: `coverError` separato da `error`; `handleCoverChange` chiama `setCoverError` (non `setError`); guard globale `if (error !== null)` riservato esclusivamente a `listRoms`; `<p role="alert">` sopra la `<ul>` — la griglia non viene smontata; `setCoverError(null)` nel reset al cambio storage. Test aggiornato: `ul[aria-label='Risultati libreria']` e tile 'Tetris' verificati presenti nel DOM dopo reject di `setCover`.
- F-039-02: `handleCoverChange` in `useCallback([storage])` — referenza stabile verso `GameTile`.
Verde: 130 unit + 6 e2e, typecheck, build.

---

## TSK-039 — iter-1 — archivio finding (tutti risolti) — CONDITIONAL

**Verdict iter-1:** conditional (1 medium blocking + 1 low advisory)
**Stack:** typescript/react/vite (conf 0.97)
**Files toccati:** Library.tsx, Library.test.tsx, db.ts, db.test.ts, port.ts, indexeddb-adapter.ts

### Cosa ha funzionato bene (da replicare)

- Privacy on-device: nessun fetch esterno; source cover esclusivamente da file utente (US-033 + architecture-overview §EP-002 "Fonte cover: caricata dall'utente").
- Revoke ObjectURL nel cleanup useEffect: pattern corretto, nessun memory leak.
- setCover update-only con transazione readwrite atomica: guard su existing, errore esplicito su ROM inesistente — no record orfani.
- CoverPort segregata da StoragePort: i consumer ROM-only non vedono setCover. SaveStoragePort extends CoverPort: invariante adattatore completo senza rompere i consumer esistenti.
- A11y completa: img alt={rom.title}, placeholder aria-hidden, input aria-label dinamico, accessible name del button invariato (compat e2e TSK-011/TSK-019).
- Test set coerente: 3 test diretti su db.test.ts; 5 test Library.test.tsx (img presenza/assenza, accessible name button, upload→setCover, errore→alert).

### Finding da correggere

**F-039-01 [medium, blocking] — Errore setCover smonta l'intera griglia (TS-ROBUST-001)**
In `Library.tsx:104-107`, il guard `if (error !== null) return <p role="alert">` e' condiviso fra errori di listRoms e errori di upload cover. handleCoverChange chiama setError (riga ~110) in caso di reject di setCover — il guard smonta l'intera griglia <ul> per un'operazione secondaria. L'utente perde scroll, filtri e lista.
Correzione: introdurre uno stato coverError separato (es. `string|null` o `Record<romId, string>`) che non sia connesso al guard globale. Il guard globale resta riservato esclusivamente agli errori di listRoms. Il role=alert per l'errore cover va mostrato in una regione non distruttiva. Aggiornare il test "setCover fallisce" per verificare che `ul[aria-label='Risultati libreria']` rimanga nel DOM dopo il reject.

**F-039-02 [low, advisory] — handleCoverChange non memoizzata (REACT-IDIOM-001)**
handleCoverChange viene ricreata ad ogni render di Library. Avvolgere in useCallback([storage]) per stabilizzare la referenza verso GameTile.

### Prossimo step

Risolvere F-039-01 (bloccante). max_diff_lines: 80. F-039-02 advisory (opzionale stesso commit).

---

## TSK-037 — Filtri base nearest/smoothing/scanline (EP-005 / US-022) — iter-2 → PASS

**Verdict iter-2:** pass (0 finding — F-037-01, F-037-02, F-037-03 tutti risolti in commit 25f3bec)
**Verdict iter-1:** conditional (1 medium advisory + 2 low advisory) — superato

### Risoluzione iter-2 (commit 25f3bec)

- F-037-01 [medium, TS-ROBUST-001]: `parseVideoFilter(raw: string): VideoFilter` aggiunta a `useVideoSettings.ts` (export). Valida `raw` contro `VIDEO_FILTERS` tramite `(VIDEO_FILTERS as readonly string[]).includes(raw)` — cast necessario per soddisfare la firma `.includes()` su tuple `readonly`. Fallback su `DEFAULT_VIDEO_SETTINGS.filter`. Usata in `Settings.handleFilterChange` al posto del cast diretto `raw as VideoFilter`.
- F-037-02 [low, REACT-A11Y-001]: `aria-label="Filtro video"` in `Settings.tsx:204`. Test aggiornati a `/filtro video/i` in `Settings.filter.test.tsx` (5 occorrenze). Coerente con pattern degli altri select della sezione Resa Video.
- F-037-03 [low, REACT-IDIOM-001]: regola CSS `.sb-scanline` nel template literal di `Player.tsx` interpolata condizionalmente via operatore ternario `showScanlineOverlay ? ... : ""`. Regole base (`.sb-screen`, `.sb-canvas-host`, `canvas`) sempre presenti. Commento esplicativo nel diff.

Verde: 145 unit + 8 e2e, typecheck, build.

### Cosa ha funzionato bene (da replicare)

- Centralizzazione del parser vicino alla costante `VIDEO_FILTERS`: riduce drift tra consumatori.
- Il commit include anche la fix TSK-041 (canvas-host React-vuoto) senza interferire con le fix TSK-037: scope separati, nessuna regressione.
- Backward-compat invariato: `mergeWithDefaults` già presente da TSK-037 iter-0; `parseVideoFilter` non modifica la firma del hook né delle prop.

### Prossimo step

Nessuna azione richiesta. TSK-037 review_status: passed.

---

## TSK-041 — Bugfix canvas perso dopo WasmBoy.loadState (US-016 AC3) — iter-1 → PASS

**Verdict iter-1:** pass (1 finding low advisory; 0 blocking)
**Stack:** typescript/react/vite (conf 0.97)
**Files toccati:** packages/app/src/components/Player/Player.tsx, packages/app/e2e/emulation-save.e2e.ts

### Finding (non-bloccante)

**F-041-1 [low, advisory] — Fallback screenRef in handlePlay silenzioso (TS-ROBUST-001)**
`Player.tsx` righe 138-139 — `const container = canvasHostRef.current ?? screenRef.current ?? undefined`. Il ramo `screenRef.current` e' documentato come "test legacy" ma non emette alcun warning se attivato in produzione. Una race condition sottile (es. nuovo engine che chiama handlePlay prima del mount completo) porterebbe l'engine a ricevere `.sb-screen` come container, reintroducendo silenziosamente l'anti-pattern eliminato da TSK-041. Non bloccante: il bottone Avvia e' reso solo dopo il mount del componente (canvasHostRef gia' assegnato al click). Suggerimento: guard `if (import.meta.env.DEV && !canvasHostRef.current) console.warn(...)` in handlePlay, oppure commento JSDoc che escluda formalmente la race condition.

### Verifiche positive rilevanti

- Isolamento canvas host React-vuoto corretto e engine-agnostico: `core/wasmboy-engine.ts` non toccato.
- Nessuna regressione fullscreen (TSK-035): `useFullscreen(screenRef)` invariato.
- Nessuna regressione CSS scala/aspect/filtri (TSK-036/037): selettori `.sb-screen canvas` e `.sb-screen .sb-scanline` (discendenti) matchano invariati con l'host intermedio.
- Selettore e2e `.sb-screen canvas` valido e verde su engine reale (dmg-acid2.gb, MIT): 8/8 e2e.
- Documentazione inline di qualita' superiore alla norma: riduce rischio di reintroduzione dell'anti-pattern.
- Gap `wasmboy-loadstate-canvas-lost` chiuso correttamente in wiki/gaps.md.

### Prossimo step

Nessuna azione bloccante. Finding F-041-1 advisory low: il dev-agent puo' aggiungere il guard DEV o il commento JSDoc inline al prossimo tocco del file. TSK-041 review_status: passed.