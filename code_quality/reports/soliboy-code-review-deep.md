# Code Review Profonda — soliboy — Tutti i componenti FE critici

## Stack rilevato

TypeScript / React 18 (confidence 0.98) — Vite, IndexedDB (idb), Electron/Capacitor
target multiplo. Regole applicabili: TS-IDIOM-001, TS-IDIOM-002, TS-DESIGN-001,
TS-DESIGN-002, TS-ROBUST-001, REACT-IDIOM-001, REACT-A11Y-001,
design-complexity (cyclomatic/cognitive/nesting).

Nota: metriche deterministiche (lizard/radon) non disponibili in ambiente — stima
manuale delle complessità; segnalata modalità best-effort per le metriche numeriche.

---

## Verdict

**conditional**

Il codebase è generalmente solido, ben commentato e segue principi di design
corretti (port/adapter, interface segregation, separation of concerns). I finding
non rivelano difetti critici di produzione, ma emergono quattro aree di miglioramento
actionable: (1) effetti non cleanup in `FileLoader`/`App.tsx` con stale-closure sul
URI handler; (2) `useMemo` con deps array vuoto che cattura `selectedConfig` come
stale reference; (3) non-null assertion non commentata in `SaveStatePanel`; (4)
complessità dei metodi di `NativeFsAdapter` che supera la soglia di attenzione.
Il resto dei finding è `minor` con confidence alta, ma non bloccante.

---

## Passata 1 — Idiomaticità

### `packages/app/src/App.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P1-01 | minor | App.tsx:102–105 | TS-IDIOM-001 | `videoPort` è creato con `useMemo(() => makeVideoSettingsPort(selectedConfig), [])`. L'array di deps è intenzionalmente vuoto (il commento lo giustifica), ma `selectedConfig` è una dipendenza effettiva catturata dalla closure. React eslint-hooks lo segnalerebbe come exhaustive-deps warning. Il pattern è difensivo (stabilità della porta) ma bypassa il contratto idiomatico di `useMemo`. | 0.85 |
| P1-02 | minor | App.tsx:114 | TS-IDIOM-001 | `themePort` usa lo stesso pattern `useMemo(..., [])` con `selectedConfig` come stale capture. Stesso razionale di P1-01. | 0.85 |
| P1-03 | minor | App.tsx:193–198 | REACT-IDIOM-001 | `engineRef` viene aggiornato in un `useEffect` separato solo per tenere traccia dell'`engine`. Pattern corretto per mantenere la ref fresca, ma la logica del `prevTabRef` e il commento di 20+ righe che la precede (ll.167–191) indica che il design della pausa su tab-change è stato complicato nel tempo. La soluzione sarebbe esporre una callback `onLifecycleReady` dal Player (come il commento stesso indica), ma è stata posticipata per "pragmatismo". Il debito è documentato ma non risolto. | 0.70 |

### `packages/app/src/components/FileLoader/FileLoader.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P1-04 | major | FileLoader.tsx:93–104 | REACT-IDIOM-001 | L'`useEffect` di registrazione URI handler ha deps array `[]` e cattura `handleCapacitorUri` come stale closure. Se `storage`, `onImported` o `_filesystemApi` cambiano dopo il mount (es. hot-reload, test con prop diverse), il handler registrato è obsoleto. Il commento giustifica la scelta con "pattern analogo a ref-setter", ma `handleCapacitorUri` è una funzione inline ricreata ad ogni render, non una ref. Il fix corretto è estrarre `handleCapacitorUri` in una ref (`useRef`) o usare `useCallback` + includerla nelle deps. | 0.90 |

### `packages/app/src/components/Player/Player.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P1-05 | minor | Player.tsx:153–165 | REACT-IDIOM-001 | Il `lifecycleTarget` è un oggetto creato con `useMemo` che chiude su `wrapper` e `setState`. Il getter `get currentState()` richiede che l'oggetto `lifecycleTarget` non sia "plain data" — `useMemo` non memoizza getter ES2015 correttamente in tutti i runtime (il getter è definito sull'oggetto inline ma memoizzato come valore). Il pattern funziona ma è non-standard; preferibile una classe o un object con metodi ordinari. | 0.65 |
| P1-06 | minor | Player.tsx:312 | TS-IDIOM-001 | `scopeId = screenId.replace(/[^a-zA-Z0-9_-]/g, "")` rimuove i `:` dall'ID React per usarlo come valore di data-attribute. Il commento spiega correttamente il perché, ma la regex rimuove anche caratteri non `:` (qualsiasi non-alnum+underscore+dash), che è più ampio del necessario. Potrebbe produrre string vuote per id insoliti. Impatto reale basso (useId genera id predicibili), confidence media. | 0.65 |

### `packages/app/src/components/Library/Library.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P1-07 | minor | Library.tsx:62–68 | TS-IDIOM-001 | `PLATFORM_LABELS` è tipizzato come `Record<PlatformFilter, string>`. Il tipo `PlatformFilter = "ALL" \| Platform` include `"ARCADE"` ma il label corrispondente è corretto. Tuttavia nessun guard impedisce che `Platform` venga esteso senza aggiornare `PLATFORM_LABELS`: una nuova piattaforma darebbe `undefined` silenziosa nella label. Pattern robusto sarebbe usare una funzione con switch exhaustiveness check. Confidence media perché lo switch-to-lookup è una scelta di design accettabile. | 0.60 |

### `packages/app/src/components/TouchOverlay/TouchOverlay.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P1-08 | minor | TouchOverlay.tsx:147–152 | REACT-IDIOM-001 | `TouchOverlay` esegue early-return (`if (!isTouchDevice()) return null`) prima degli hook, il che viola la regola degli hook di React (Rules of Hooks §1). Il pattern è risolto delegando agli hook a `TouchOverlayInner`, come documentato nel commento. Il componente pubblico `TouchOverlay` non ha hook, quindi la violazione è apparente. Tuttavia la funzione `isTouchDevice()` è chiamata nel corpo del componente (non in un hook), che è una side-effect durante il render. Confidence: 0.75 — il pattern è corretto, ma vale segnalarlo per chiarezza. | 0.75 |

---

## Passata 2 — Design

### `packages/app/src/App.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P2-01 | major | App.tsx:73–441 | *.design.complexity.cognitive_violation | `App()` è un unico componente di ~370 LOC che gestisce: selezione adapter, 5+ useMemo per porte, 3 `useEffect` (keyboard, engineRef, tab-pause), navigazione a tab, rendering condizionale di 4 panel, CTA idle, footer. Complessità cognitiva stimata >20 (6+ blocchi condizionali annidati, 3 useEffect, gestione refs). La regola `*.design.complexity.cognitive_violation` soglia medium >15. Il componente funziona, ma tutta la logica di "pausa su cambio tab" (ll.167–218) è logica di dominio/coordinamento che potrebbe stare in un custom hook `useTabPause(engine, activeTab, selected)`. | 0.85 |
| P2-02 | minor | App.tsx:411–415 | TS-DESIGN-001 | La callback `onHapticsChange` in App.tsx (riga 413) è definita inline come arrow async: `async (value) => { setHapticsEnabled(value); await saveHapticsEnabled(value); }`. L'async inline nei JSX prop produce una funzione non-stabile (ricreata ad ogni render) che verrà confrontata da memo shallow come diversa. In questo caso Settings non è memoizzato, quindi non è un bug, ma è un anti-pattern: la callback dovrebbe essere `useCallback`. | 0.75 |

### `packages/app/src/components/Player/Player.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P2-03 | minor | Player.tsx:207–215 | TS-DESIGN-001 | `persistSram()` è definita come funzione `async` non-hook nel corpo del componente. È invocata con `void persistSram()` da `handlePause` e `handleStop`. Questo pattern — funzione async dichiarata inline nel componente — funziona ma viola la leggibilità: la funzione cattura `saveService`, `romId`, `engine` dalla closure e non è memoizzata. Se chiamata più volte in rapida successione (doppio click su Pausa) produce N concurrent calls al `saveService.autosaveSram`. Un flag `isSaving` o un `useRef` sarebbe più robusto. Severity minor perché `autosaveSram` è best-effort e idempotente. | 0.80 |
| P2-04 | minor | Player.tsx:127–515 | *.design.complexity.cognitive_violation | `Player()` è ~390 LOC con 2 async functions inline (`handlePlay`, `handleFullscreenToggle`), 1 async `persistSram`, 3 useEffect (SRAM flush, canvas host, inline-style), rendering condizionale multi-ramo per fullscreen/non-fullscreen TouchOverlay. LOC > 100 per funzione (soglia attenzione), nesting massimo stimato 4+. | 0.80 |

### `packages/app/src/components/Settings/Settings.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P2-05 | minor | Settings.tsx:165–669 | *.design.complexity.cognitive_violation | `Settings()` è ~500 LOC che combina: stato video (interno + controllato), stato haptics, logica export/import salvataggi, rendering di 7 accordion. La sezione dati (ll.230–376) contiene logica non-triviale (refreshSaveStates, handleExport, handleImportFile) che ben si separa in un hook `useSaveData(saveService, currentRomId)`. Complessità cognitiva stimata >20. | 0.85 |
| P2-06 | minor | Settings.tsx:260–264 | TS-ROBUST-001 | In `refreshSaveStates`, l'error handler cattura `e` e usa `(e as Error).message`. Il cast `as Error` è non sicuro: il `catch` può ricevere qualsiasi `unknown`. Dovrebbe usare `e instanceof Error ? e.message : String(e)`. | 0.90 |

### `packages/app/src/storage/native-fs-adapter.ts`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P2-07 | major | native-fs-adapter.ts:492–519 | *.design.complexity.cyclomatic_violation | `addRom()` esegue: hashBlob, ensureDir, writeFile blob, readManifest, check cover, writeFile cover, upsertById, writeManifest — 7+ operazioni sequenziali senza rollback. Non è transazionale: se `writeManifest` fallisce dopo `writeFile(blob)`, il file blob è orfano. Cyclomatic > 7 stimata per i branch condizionali. IDB aveva atomicità nativa; NativeFs no. Questo è un noto trade-off documentato nel commento (race condition nota MVP), ma la mancanza di rollback su fallimenti parziali è un finding di design. | 0.80 |
| P2-08 | minor | native-fs-adapter.ts:270–290 | TS-DESIGN-001 | `NativeFsAdapter` implementa 6 interfacce (`StoragePort, SaveStatePort, SramPort, CoverPort, ConfigPort, SaveStoragePort`). La classe è molto grande (~550 LOC di logica) e le responsabilità (ROM, SaveState, SRAM, Cover, Config) sono logicamente distinte. Un refactoring in classi composte o in facade delegates ridurrebbe il cognitive load. Severity minor — la struttura corrente funziona e le interfacce sono segregate. | 0.70 |

### `packages/app/src/domain/save-service.ts`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P2-09 | minor | save-service.ts:160–185 | TS-IDIOM-002 | `bytesToBase64()` usa `(globalThis as any).Buffer` per il fallback Node. Il cast `as any` è giustificato da un commento ma bypassa la type safety. Una soluzione più idiomatica sarebbe `declare const Buffer: ...` o un type-check esplicito prima del cast. | 0.80 |

---

## Passata 3 — Robustezza

### `packages/app/src/App.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P3-01 | major | App.tsx:55–60 | TS-ROBUST-001 | `selectAdapter()` è chiamato a module-load (ll.55–60), fuori da qualsiasi componente React. Se `selectAdapter()` lancia un'eccezione (es. `window.soliboyDesktop` corrotto, errore di runtime nell'init di `NativeFsAdapter`), non c'è Error Boundary né try/catch: l'intera applicazione si blocca con un errore non gestito. Sarebbe più robusto invocare `selectAdapter()` dentro `App()` o in un lazy initializer con fallback. | 0.85 |
| P3-02 | minor | App.tsx:328–348 | TS-ROBUST-001 | Il Player riceve `rom={{ rom: new Blob(), core: "gambatte" }}` in stato idle (nessuna ROM selezionata). `new Blob()` è chiamato ad ogni render di App in stato idle, generando oggetti Blob allocati e poi scartati. È un micro-leak di allocazioni, non critico, ma evitabile con una costante `EMPTY_ROM = { rom: new Blob(), core: "gambatte" }` definita fuori dal componente. | 0.70 |

### `packages/app/src/components/FileLoader/FileLoader.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P3-03 | major | FileLoader.tsx:67–73 | TS-ROBUST-001 | `handleFile(file: File)` è `async` ma non ha try/catch intorno a `importRom()`. Se `importRom()` lancia (es. errore non previsto in `recognizePlatform` o `storage.addRom` che rigetta in modo non strutturato), l'errore è un rejected Promise non gestita. La risposta strutturata di `ImportResult` garantisce i casi noti, ma eccezioni runtime inattese (TypeError in `Uint8Array`, errore IDB) non vengono intercettate. | 0.85 |
| P3-04 | minor | FileLoader.tsx:127–132 | TS-ROBUST-001 | L'handler `onChange` dell'input file chiama `void handleFile(f)`. Il `void` indica consapevolezza che la Promise non viene await-ata, ma non c'è gestione dell'errore: un reject non gestito in `handleFile` non aggiorna `error` state. Correlato a P3-03. | 0.80 |

### `packages/app/src/components/Player/Player.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P3-05 | major | Player.tsx:282–300 | TS-ROBUST-001 | L'`useEffect` per l'autosave SRAM su `visibilitychange`/`pagehide` (ll.282–300) usa `void saveService.autosaveSram?.(engine, romId)` — il `?.` è corretto per il guard, ma l'errore è swallowed dal `.catch(() => {})` che non loga nulla. In produzione un errore ricorrente nell'autosave passerebbe del tutto inosservato. Il pattern "best-effort + silenzio" è documentato nei commenti, ma almeno un `console.warn` in development sarebbe raccomandato per diagnostica. Confidence alta. | 0.80 |
| P3-06 | critical | Player.tsx:217–244 | TS-ROBUST-001 | `handlePlay()` chiama `wrapper.load()` e poi `saveService.restoreSram()` (ll.235–237) senza verificare l'esito di `restoreSram`: se `restoreSram` rigetta (ROM non trovata nel storage, errore IDB), l'eccezione si propaga fino al catch dell'handlePlay e imposta `error` state con un messaggio tecnico ("ROM non trovata (romId=...)"). L'utente vede un errore "play fallito" che in realtà è un errore di restore SRAM — confondente e non separato dal fallimento del load vero. Il fix è gestire separatamente `restoreSram` (best-effort, come `persistSram`). | 0.90 |
| P3-07 | minor | Player.tsx:282–300 | TS-ROBUST-001 | La dep array del `useEffect` SRAM flush include `engine` (riga 300). Se `engine` cambia (cambio ROM → nuovo `selectEngine`) l'effect viene reinstallato (remove + re-add listeners). Questo è corretto, ma nell'intervallo di reinstallazione (tra teardown e setup) un evento `visibilitychange` non verrebbe gestito. Su dispositivi lenti con cambio tab rapido potrebbe perdersi un flush SRAM. Edge case teorico a bassa probabilità; severity minor. | 0.65 |

### `packages/app/src/components/Player/SaveStatePanel.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P3-08 | minor | SaveStatePanel.tsx:264 | TS-IDIOM-002 | `rec!.createdAt` alla riga 264 usa non-null assertion. Il contesto è `occupied ? new Date(rec!.createdAt).toLocaleString() : "vuoto"`. La condizione `occupied = rec !== undefined` rende sicuro l'accesso, ma TypeScript non riesce a narroware il tipo dentro il ternario inline. Il `!` è tecnicamente sicuro qui ma potrebbe essere rimosso con una variabile di appoggio `rec && rec.createdAt ? ... : "vuoto"`. Basso rischio ma viola TS-IDIOM-002. | 0.75 |

### `packages/app/src/components/Library/Library.tsx`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P3-09 | minor | Library.tsx:88–109 | TS-ROBUST-001 | L'`useEffect` per `storage.listRomsMeta()` usa il pattern `active` flag correttamente (anti-race). Il catch cattura `err: unknown` e controlla correttamente `err instanceof Error`. Il finding è che l'errore viene mostrato all'utente ma la libreria non offre un bottone "Riprova": l'utente deve ricaricare la pagina. Severity minor (UX robustness, non correttezza). | 0.60 |

### `packages/app/src/core/wasmboy-engine.ts`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P3-10 | major | wasmboy-engine.ts:59–66 | TS-ROBUST-001 | `WasmBoyEngine.load()` chiama `new Uint8Array(await opts.rom.arrayBuffer())` (riga 64). Se `opts.rom` è un `Blob` vuoto (come quello passato dal Player in idle: `new Blob()`), `arrayBuffer()` ritornerà un ArrayBuffer di 0 byte e `loadROM` riceverà un Uint8Array vuoto. WasmBoy probabilmente fallirà silenziosamente o in modo imprevedibile. Il Player ha una guardia (`wrapper.currentState === "idle" → load`) che previene load multipli, ma non previene il load di un Blob vuoto. Sarebbe robusto aggiungere una validazione `if (opts.rom.size === 0) throw new Error(...)` all'inizio di `load()`. | 0.85 |
| P3-11 | minor | wasmboy-engine.ts:94–96 | TS-ROBUST-001 | `run(p, op)` cattura gli errori WasmBoy con `console.error`. Gli errori di `pause()`/`resume()`/`stop()` vengono loggati ma non propagati al chiamante (CoreWrapper → Player). Il Player non aggiorna `state` in caso di errore asincrono di WasmBoy, creando potenziale desync tra `state` React ("running") e stato reale del core (errore). Severity minor perché il desync è transitorio e WasmBoy raramente fallisce su pause/resume. | 0.70 |

### `packages/app/src/storage/native-fs-adapter.ts`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P3-12 | major | native-fs-adapter.ts:616–636 | TS-ROBUST-001 | `putSaveState()` scrive prima il blob (`writeFile`) e poi aggiorna il manifest. Se `writeSaveStatesManifest` fallisce dopo la scrittura del blob, il blob rimane su disco come orfano (nessun record nel manifest → inaccessibile, non eliminabile tramite UI). L'operazione non è atomica. Correlato a P2-07 (design) ma da prospettiva robustezza: un'interruzione (crash, disco pieno) tra le due scritture lascia lo storage in stato inconsistente. Severity major perché si può verificare in produzione su dispositivi con poco spazio. | 0.85 |
| P3-13 | minor | native-fs-adapter.ts:695–708 | TS-ROBUST-001 | `setConfig()` chiama `ensureDir(await this.resolveBaseDir())` per garantire l'esistenza della base dir, ma non chiama `ensureDir` sulla base dir prima di `getConfig`. Se `getConfig` viene chiamata prima di qualsiasi scrittura (es. primo avvio senza config salvata), `readFileIfExists` ritorna gracefully `undefined` (il file non esiste ancora), quindi non è un bug. Ma se il file è stato creato in una sessione precedente e la dir viene rimossa esternamente, `readFileIfExists` propagherà l'errore IO. Severity minor: scenario raro, documentato nel commento F-074-3. | 0.65 |

### `packages/app/src/domain/useAppLifecycle.ts`

| # | Severity | File:Lines | Rule | Rationale | Confidence |
|---|---|---|---|---|---|
| P3-14 | minor | useAppLifecycle.ts:87–115 | TS-ROBUST-001 | L'import dinamico `@capacitor/app` risolve il `listenerPromise` in modo asincrono, e il cleanup `capacitorCleanup` viene assegnato solo dopo che la Promise si risolve. Se il componente si smonta prima che `addListener` si risolva, il cleanup function non è ancora assegnata al momento del `return () => {...}`: il listener Capacitor NON viene rimosso, causando un leak. Lo scenario è raro (mount/unmount ultra-rapido), ma reale su React Strict Mode (double-mount in dev). | 0.80 |

---

## Riepilogo findings per file

### `packages/app/src/App.tsx`
| # | File | Line | Pass | Severity | Confidence | Finding | Suggestion |
|---|---|---|---|---|---|---|---|
| P1-01 | App.tsx | 102–105 | idiom | minor | 0.85 | `useMemo(() => makeVideoSettingsPort(selectedConfig), [])` — deps vuote ma `selectedConfig` catturato stale | Aggiungere `selectedConfig` alle deps OPPURE usare `useRef` per la porta (semantica di creazione-una-sola-volta documentata) |
| P1-02 | App.tsx | 114 | idiom | minor | 0.85 | `themePort useMemo(..., [])` stesso pattern | Stesso fix di P1-01 |
| P2-01 | App.tsx | 73–441 | design | major | 0.85 | Complessità cognitiva stimata >20 per `App()` | Estrarre `useTabPause(engine, activeTab, selected)` hook; separare la logica di pausa/ripresa tab dal rendering |
| P2-02 | App.tsx | 411–415 | design | minor | 0.75 | Arrow async inline in JSX prop `onHapticsChange` | Usare `useCallback` per la callback |
| P3-01 | App.tsx | 55–60 | robust | major | 0.85 | `selectAdapter()` a module-load senza try/catch | Wrappare in try/catch con fallback oppure spostare dentro `App()` |
| P3-02 | App.tsx | 328–348 | robust | minor | 0.70 | `new Blob()` ad ogni render in stato idle | Definire `IDLE_ROM` costante fuori dal componente |

### `packages/app/src/components/FileLoader/FileLoader.tsx`
| # | File | Line | Pass | Severity | Confidence | Finding | Suggestion |
|---|---|---|---|---|---|---|---|
| P1-04 | FileLoader.tsx | 93–104 | idiom | major | 0.90 | `useEffect` registra `handleCapacitorUri` stale (deps `[]` con closure su props mutabili) | Usare `useRef` per la funzione handler o `useCallback` + includerla nelle deps |
| P3-03 | FileLoader.tsx | 67–73 | robust | major | 0.85 | `handleFile` non ha try/catch: errori runtime inattesi da `importRom` sono Promise rejected non gestite | Aggiungere try/catch con `setError` nel catch |
| P3-04 | FileLoader.tsx | 127–132 | robust | minor | 0.80 | `void handleFile(f)` non gestisce i reject | Conseguenza di P3-03; risolto insieme |

### `packages/app/src/components/Player/Player.tsx`
| # | File | Line | Pass | Severity | Confidence | Finding | Suggestion |
|---|---|---|---|---|---|---|---|
| P1-05 | Player.tsx | 153–165 | idiom | minor | 0.65 | `lifecycleTarget` con getter ES2015 in `useMemo` | Usare un plain object con metodo o classe |
| P2-03 | Player.tsx | 207–215 | design | minor | 0.80 | `persistSram()` inline async senza protezione da concurrent calls | Aggiungere un ref `isSavingRef` o convertire in `useCallback` |
| P2-04 | Player.tsx | 127–515 | design | minor | 0.80 | `Player()` >390 LOC, complessità cognitiva stimata >15 | Estrarre `usePersistSram`, `usePlayerControls` hook |
| P3-05 | Player.tsx | 282–300 | robust | major | 0.80 | Autosave SRAM silenzioso, nessun log in development | Aggiungere `console.warn` nel catch per dev diagnostics |
| P3-06 | Player.tsx | 217–244 | robust | critical | 0.90 | `restoreSram` non è best-effort: un reject blocca il play e mostra errore fuorviante all'utente | Wrappare `restoreSram` in try/catch separato; loggarla come warning, non propagarla come errore play |
| P3-07 | Player.tsx | 282–300 | robust | minor | 0.65 | Reinstallazione SRAM flush effect su cambio engine crea finestra senza listener | Accettabile; documentare come known edge case |

### `packages/app/src/components/Library/Library.tsx`
| # | File | Line | Pass | Severity | Confidence | Finding | Suggestion |
|---|---|---|---|---|---|---|---|
| P1-07 | Library.tsx | 62–68 | idiom | minor | 0.60 | `PLATFORM_LABELS` lookup senza exhaustiveness check | Convertire in funzione con switch e caso default esplicito |
| P3-09 | Library.tsx | 88–109 | robust | minor | 0.60 | Nessun bottone "Riprova" su errore listRomsMeta | Aggiungere retry handler nell'error branch |

### `packages/app/src/components/Settings/Settings.tsx`
| # | File | Line | Pass | Severity | Confidence | Finding | Suggestion |
|---|---|---|---|---|---|---|---|
| P2-05 | Settings.tsx | 165–669 | design | minor | 0.85 | `Settings()` >500 LOC, logica salvataggi mescolata con UI | Estrarre `useSaveData(saveService, currentRomId)` hook con stato list/busy/message |
| P2-06 | Settings.tsx | 260–264 | design | minor | 0.90 | `(e as Error).message` in catch senza instanceof check | Usare `e instanceof Error ? e.message : String(e)` |

### `packages/app/src/components/Player/SaveStatePanel.tsx`
| # | File | Line | Pass | Severity | Confidence | Finding | Suggestion |
|---|---|---|---|---|---|---|---|
| P3-08 | SaveStatePanel.tsx | 264 | robust | minor | 0.75 | `rec!.createdAt` non-null assertion non necessaria | Usare variabile `rec` dopo check `occupied` o opzionale chaining |

### `packages/app/src/components/TouchOverlay/TouchOverlay.tsx`
| # | File | Line | Pass | Severity | Confidence | Finding | Suggestion |
|---|---|---|---|---|---|---|---|
| P1-08 | TouchOverlay.tsx | 147–152 | idiom | minor | 0.75 | `isTouchDevice()` chiamata nel render (side-effect minimo ma non idiomatico) | Memoizzare con `useMemo(() => isTouchDevice(), [])` in `TouchOverlay` oppure accettare come one-time read |

### `packages/app/src/core/wasmboy-engine.ts`
| # | File | Line | Pass | Severity | Confidence | Finding | Suggestion |
|---|---|---|---|---|---|---|---|
| P3-10 | wasmboy-engine.ts | 59–66 | robust | major | 0.85 | `load()` non valida `rom.size === 0`; Blob vuoto da idle Player arriva silenziosamente a WasmBoy | Aggiungere guard `if (opts.rom.size === 0) throw new Error("ROM vuota")` |
| P3-11 | wasmboy-engine.ts | 94–96 | robust | minor | 0.70 | `run()` logga errori WasmBoy senza propagarli → desync stato React | Documentare esplicitamente o aggiungere callback di errore al CoreWrapper |

### `packages/app/src/storage/native-fs-adapter.ts`
| # | File | Line | Pass | Severity | Confidence | Finding | Suggestion |
|---|---|---|---|---|---|---|---|
| P2-07 | native-fs-adapter.ts | 492–519 | design | major | 0.80 | `addRom()` non transazionale: blob orfano su fallimento manifest write | Documentare esplicitamente + aggiungere cleanup best-effort (tryUnlink blob su catch) |
| P2-08 | native-fs-adapter.ts | 270–290 | design | minor | 0.70 | Classe ~800 LOC che implementa 6 interfacce | Futura suddivisione in classi composte per area funzionale |
| P3-12 | native-fs-adapter.ts | 616–636 | robust | major | 0.85 | `putSaveState()` non atomica: blob orfano su manifest write failure | Aggiungere tryUnlink(snapshotPath) nel catch di `writeSaveStatesManifest` |
| P3-13 | native-fs-adapter.ts | 695–708 | robust | minor | 0.65 | `getConfig` vulnerabile a dir rimossa esternamente | Accettabile MVP; documentato; rimandato |

### `packages/app/src/domain/save-service.ts`
| # | File | Line | Pass | Severity | Confidence | Finding | Suggestion |
|---|---|---|---|---|---|---|---|
| P2-09 | save-service.ts | 160–185 | design | minor | 0.80 | `(globalThis as any).Buffer` cast non sicuro | Usare `declare const Buffer` o type-guard |

### `packages/app/src/domain/useAppLifecycle.ts`
| # | File | Line | Pass | Severity | Confidence | Finding | Suggestion |
|---|---|---|---|---|---|---|---|
| P3-14 | useAppLifecycle.ts | 87–115 | robust | minor | 0.80 | Listener Capacitor non rimosso se componente si smonta prima che `addListener` risolva | Usare un `cleanupRef.current` settato all'interno della `.then()`, e invocarlo nel cleanup anche se ancora `null` con una flag "cancelled" |

---

## Aggregazione finding per severità

| Severity | Count | Rule IDs coinvolti |
|---|---|---|
| critical | 1 | TS-ROBUST-001 |
| major | 9 | TS-ROBUST-001 (×6), *.design.complexity.cognitive_violation (×2), TS-DESIGN-001 (×1) |
| minor | 13 | TS-IDIOM-001 (×3), REACT-IDIOM-001 (×3), TS-DESIGN-001 (×3), TS-ROBUST-001 (×4) |

**Totale finding (confidence ≥ 0.60)**: 23

---

## Top 3 finding critici

### 1. P3-06 — `Player.tsx:217–244` — CRITICAL (confidence 0.90)
`restoreSram()` viene chiamato in `handlePlay` senza wrapping best-effort. Un fallimento di `restoreSram` (ROM non trovata, errore IDB) propaga come errore di play, mostrando all'utente un messaggio come "ROM non trovata (romId=...)" quando preme "Avvia" — fuorviante e interrompe il gioco per un errore di restore SRAM non fatale.
**Fix**: wrappare `restoreSram` in try/catch separato, loggare come warning, non propagare.
`[^src5: packages/app/src/components/Player/Player.tsx:235]`

### 2. P3-10 — `wasmboy-engine.ts:59–66` — MAJOR (confidence 0.85)
`WasmBoyEngine.load()` non valida `rom.size === 0`. Il Player sempre-montato passa `new Blob()` come ROM placeholder in stato idle. Se `handlePlay` venisse invocato con Blob vuoto (es. race condition tra `selected` ancora null e click su Avvia), WasmBoy riceve un Uint8Array di 0 byte con comportamento imprevedibile.
**Fix**: guard `if (opts.rom.size === 0) throw new Error("WasmBoyEngine.load: ROM vuota — Blob privo di contenuto.")`.
`[^src5: packages/app/src/core/wasmboy-engine.ts:59]`

### 3. P3-12 — `native-fs-adapter.ts:616–636` — MAJOR (confidence 0.85)
`putSaveState()` scrive blob su disco prima di aggiornare il manifest. Interruzione tra le due operazioni (crash, quota disco) lascia blob orfano permanente: inaccessibile dalla UI, non eliminabile. Non critico in sé, ma può accumularsi su dispositivi con spazio limitato.
**Fix**: nel catch di `writeSaveStatesManifest`, invocare `tryUnlink(await this.saveStateBlobPath(id))`.
`[^src5: packages/app/src/storage/native-fs-adapter.ts:616]`

---

## Prossimi passi

**Verdict: conditional** — i finding sono actionable e non bloccano la release attuale, ma i 3 finding top devono essere indirizzati nel prossimo ciclo di sviluppo.

Task package raccomandato per il dev-agent fe-dev (e be-dev per storage):

**Priority 1 (blocker UX)**:
- Fix P3-06: `Player.tsx` — wrappare `restoreSram` best-effort
- Fix P1-04: `FileLoader.tsx` — stale closure handler URI

**Priority 2 (robustezza storage)**:
- Fix P3-12: `native-fs-adapter.ts` — cleanup blob su manifest write failure
- Fix P3-10: `wasmboy-engine.ts` — guard Blob vuoto

**Priority 3 (qualità codice, non urgenti)**:
- Fix P2-01: `App.tsx` — estrarre `useTabPause` hook
- Fix P2-05: `Settings.tsx` — estrarre `useSaveData` hook
- Fix P2-06: `Settings.tsx` — safe cast in catch
- Fix P3-08: `SaveStatePanel.tsx` — rimuovere non-null assertion

---

## Loop status

Iter: 1/3. Nessun marker no_progress, regression, loop_exhausted, degraded.

Scope: best-effort su tutti i file listati (nessun TSK singolo — review trasversale per
richiesta esplicita). `scope_inferred: true` (non legato a un singolo commit/TSK).

Generated: 2026-06-15
Reviewer: code-reviewer@2.12.0 (claude-sonnet-4-6)
