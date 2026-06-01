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
