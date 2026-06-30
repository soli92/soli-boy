# Digest code-review — dev-agent-be — 2026-W26

Generato: 2026-06-30 | Reviewer: code-reviewer@2.12.0

---

## TSK-125 + TSK-130 iter-1 — conditional (2026-06-30)

**Scope:** RtcService dominio (TSK-125: tipi RtcState/RtcCapability/RtcBridge + getRtcState/setRtcState/validateRtcState/hasRtc; TSK-130: syncToDevice) — EP-019 Sprint 15.
**File toccati:** `packages/app/src/domain/rtc-service.ts`, `packages/app/src/domain/rtc-service.test.ts`.
**ADR di riferimento:** ADR-009.

### Punti di forza

- Documentazione inline eccellente: ogni scelta non-ovvia (range-based validation, soglia year>=2000, UTC-by-spec, guard null bridge) ha commento con riferimento ADR e contesto storico.
- Copertura test ampia: boundary-value su tutti i campi di `validateRtcState` (lower e upper bound), mock clock `vi.setSystemTime`, edge-case null/undefined su `syncToDevice`, test no-network dedicato.
- Complessita' ciclomatica sotto soglia (max CC=7 in `validateRtcState`, CC=2 in `syncToDevice`).
- Separazione dominio/bridge rispettata; `import type` usato correttamente nel test file.

### Finding F-01 (low) — QA-TEST-001

`makeBridge` helper definito identicamente in due `describe` block separati (righe 109-119 e 164-175). Estrarre a scope-file per evitare divergenza su futuri aggiornamenti del mock. Collegato a F-02: l'aggiunta di `hasRtc()` all'interfaccia richiederebbe due aggiornamenti invece di uno.

### Finding F-02 (medium) — TS-DESIGN-001 [BLOCCO PER ITER-2]

`RtcBridge` interface in `rtc-service.ts` omette `hasRtc(): boolean` definito dal contratto TypeScript vincolante in ADR-009 §4. I bridge concreti Sprint 16 non soddisferanno staticamente il tipo `RtcBridge` come dichiarato. Aggiungere il metodo all'interfaccia con commento ADR-009 §4 e aggiornare lo stub nel test (`hasRtc: vi.fn(() => true)`).

### Finding F-03 (low) — TS-DESIGN-001

`syncToDevice` ritorna `void` con commento che cita ADR-009 §5, ma ADR-009 §5 non disciplina il tipo di ritorno (tratta policy UTC e vincolo no-network). La scelta e' legittima ma il razionale e' impreciso. Aggiornare il commento con la vera motivazione, o valutare il ritorno `RtcState` come da spec TSK-130.

### Finding F-04 (medium) — TS-ROBUST-001 [BLOCCO PER ITER-2]

Il test "no-network" (riga 247) assegna `globalThis.fetch` e `globalThis.XMLHttpRequest` direttamente senza restore. `vi.restoreAllMocks()` in `afterEach` non ripristina assegnazioni dirette su proprieta' globali: i valori spy restano attivi per i test successivi nel worker Vitest. Usare restore manuale nell'`afterEach` o `vi.spyOn`.

### Finding F-05 (low) — TS-ROBUST-001

`setRtcState` non ha guard interno su stato non validato: il caller-contract (documentato nel JSDoc) non e' enforced. Pattern legittimo per un domain service, ma un `console.warn` in dev mode aumenterebbe la visibilita' delle violazioni del contratto.

### Azione richiesta

Risolvere F-02 e F-04 (entrambi medium) prima di iter-2. Report completo: `code_quality/reports/TSK-125-130-iter-1.json`.
