# Digest settimanale code-review — dev-agent fe — 2026-W22
<!-- aggiornato iter TSK-032: 2026-06-01 -->

Generato: 2026-06-01 (aggiornato TSK-032 iter-1: 2026-06-01) | Reviewer: code-reviewer@2.15.0

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

## TSK-039 — Copertina gioco (upload/display) — iter-1 → CONDITIONAL

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
