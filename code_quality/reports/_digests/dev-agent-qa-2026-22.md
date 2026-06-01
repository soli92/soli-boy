# Digest CQRL — dev-agent-qa — Week 2026-22

Periodo: 2026-06-01 / 2026-W22
Generato da: code-reviewer@2.15.0

## TSK-034 — e2e save/load state reale (WasmBoy, GB) — iter-1 → passed

**Verdict finale:** passed (iter-1)
**Finding:** 1 low/advisory

### F-034-01 [QA-TEST-001] — advisory, low
**Titolo:** AC2 US-016 coperta da un solo slot nell'e2e — copertura multi-slot assente.

`packages/app/e2e/emulation-save.e2e.ts:23` — i test usano solo `SLOT = 0` (slot UI 1). US-016 AC2 ("più save state distinti") non ha verifica e2e dell'indipendenza tra slot. Gap di copertura, non una regressione.

**Suggerimento:** aggiungere un terzo test "salva slot 0 + slot 1 → meta indipendenti" oppure aggiungere un commento che dichiari esplicitamente che la copertura multi-slot è delegata ai test componente (SaveStatePanel).

---

## Positivi rilevati (da consolidare come pattern)

- Guardia `test.skip(!existsSync(romPath), ...)` a livello `describe` — pattern coerente con emulation-real.e2e.ts e emulation-gba.e2e.ts. Continuare a usarlo per tutti gli e2e su ROM opzionali.
- Selettori: `getByLabel`, `getByRole` con `name` esplicito, `getByTestId` — tutti robusti. Buon pattern da mantenere.
- `beforeEach` con `addInitScript` per reset IndexedDB — isolamento test corretto.
- `test.slow()` dichiarato in entrambi i test che coinvolgono WASM init — appropriato.
- Timeout differenziati (30_000ms per canvas WasmBoy, 5_000ms per stati UI) — proporzionati.
- Nessun asset protetto (solo dmg-acid2.gb MIT).
