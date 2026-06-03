# Digest code-review — dev-agent-be — 2026-W22

Generato: 2026-06-01 | Reviewer: code-reviewer@2.12.0

## TSK-030 iter-1 — pass (2026-06-01)

**Scope:** EmulatorEngine snapshot/restore + getSram/loadSram (ADR-006).
**File toccati (core):** core-wrapper.ts, stub-engine.ts, wasmboy-engine.ts, mgba-engine.ts, engine-registry.ts, wasmboy.d.ts, stub-engine.test.ts.

### Finding F-030-1-R1 (medium) — TS-ROBUST-001

`MgbaEngine.restore()` non esegue una pre-flight magic check del formato blob prima di scriverlo sul FS virtuale Emscripten. Un blob cross-engine verrebbe scritto, poi rifiutato da `loadState()`, ma il file stale resterebbe sull'IDBFS. La prevenzione cross-engine è demandata ad ADR-006 al livello dominio (SaveService con campo `core`/`engine`), ma la defense-in-depth è assente a livello adapter.

Azione consigliata per TSK-032 o follow-up: valutare magic header o pre-check dimensione per fail-fast prima della scrittura.

### Finding F-030-1-R2 (low) — TS-ROBUST-001

`WasmBoyEngine.getSram()` ritorna `null` quando `configured=false` (nessuna ROM), mentre `snapshot()` e `loadSram()` lanciano esplicitamente. L'interfaccia permette null per "no SRAM", ma l'asimmetria può rendere ambiguo il segnale per il SaveService (null = no ROM o null = no battery RAM?). Documentare o uniformare.

### Finding F-030-1-D1 (low) — TS-DESIGN-001

`StubEngine` espone `loaded`, `audio`, `lastInput` come campi pubblici mutabili, usati per introspezione da test ma non richiesti dal contratto `EmulatorEngine`. Superficie pubblica allargata non necessaria al contratto. Considerare `readonly` o getter con JSDoc `@visibleForTesting`.

### Pattern positivi rilevati (non finding)

- Reject onesti corretti: WasmBoy, StubEngine, UnsupportedEngine e mGBA rifiutano con messaggi chiari quando l'API non è disponibile o il modulo non è inizializzato.
- Copie difensive SRAM: StubEngine.getSram() e loadSram() copiano correttamente i buffer in ingresso e in uscita.
- Magic header: WasmBoy (WBSV1) e Stub (SOLISTUB1) validano il magic prima di deserializzare, respingendo cross-engine blob.
- StubEngine deterministico: tick monotono rende ogni snapshot distinguibile; round-trip restore(snapshot()) completamente verificabile senza WASM.
- Test suite: 11 nuovi unit su StubEngine coprono round-trip, copie difensive, reject magic, tick, SRAM indipendente dallo snapshot.

---

## TSK-077 iter-1 — conditional (2026-06-03)

**Scope:** Bridge IPC `fs:getBaseDir` + risoluzione base dir assoluta lazy+memoizzata in `NativeFsAdapter` (EP-006/US-023).
**File toccati (core):** main.ts, preload.ts, native-fs-adapter.ts, native-fs-adapter.test.ts, select-adapter.ts.

### Finding F-077-1-R1 (medium) — TS-ROBUST-001

`resolveBaseDir()` in `native-fs-adapter.ts` non valida il tipo o la vacuità del valore restituito da `bridge.getBaseDir()` nel then-handler. Se il bridge restituisce `undefined`, `null` o `''` (bug lato main o stub di test malformato), `normalizeToPosix(abs)` lo riceve senza lanciare, producendo path degeneri (`'undefined/roms/index.json'`) che il `guardPath` del main potrebbe non rilevare se il renderer usa un baseDir convenzionale per fallback.

Azione consigliata: aggiungere `typeof abs === 'string' && abs.length > 0` come guard prima di `normalizeToPosix(abs)`; in caso contrario ricadere sul `fallback` (stesso behavior del rejection handler). Max 3 righe di differenza.

### Finding F-077-2-I1 (low) — TS-IDIOM-002

In `select-adapter.ts:137`, `winRef!.soliboyDesktop as NativeFsBridge` usa una non-null assertion senza commento giustificativo inline (il commento esplicativo si trova 3 righe sopra, non adiacente all'assertion). Formalmente non conforme a TS-IDIOM-002.

Azione consigliata: spostare il commento inline (`// safe: isDesktopRuntime ha già verificato non-null`) oppure riscrivere con un narrow esplicito senza `!`.

### Finding F-077-3-Q1 (low) — QA-TEST-001

La suite di test TSK-077 (`describe('bridge.getBaseDir')`) testa solo path POSIX. Non copre il caso `bridge.getBaseDir() → C:\Users\foo\.soli-boy` (path NT-style da main Windows), che è proprio il ramo che `normalizeToPosix(abs)` in `resolveBaseDir` deve gestire. Il test F-5 della suite TSK-054 copre solo `baseDir` del costruttore in NT-style, non il valore risolto via bridge.

Azione consigliata: aggiungere 1 test nella suite `bridge.getBaseDir` con NT-style path e verifica assenza di `\\` nei path IPC.

### Pattern positivi (non finding)

- Memoizzazione su Promise (non su string): corretta e verificata con test di concorrenza (`Promise.all` tri-parallelo, `getBaseDirCalls === 1`).
- Lazyness reale: costruttore non invoca il bridge; test cardine (`getBaseDirCalls === 0` post-costruzione) garantisce la sincronia della factory.
- Fallback su rejection IPC corretto e cacheato: nessun retry-storm.
- Single source of truth `FS_BASE_DIR` rispettato: handler `fs:getBaseDir` riusa la costante di `guardPath`, nessuna ricalcolazione.
- Compatibilità retro-bridge documentata e testata (bridge senza `getBaseDir?` → fallback convenzionale).
