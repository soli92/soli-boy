---
type: concept
sources: ["raw/2026-06-01-specifiche-funzionali.txt", "design_&_architecture/decisions/ADR-009.md"]
status: draft
created: 2026-06-30
updated: 2026-06-30
tags: [rtc, orologio, salvataggi, gbc, gba, mbc3, bridge, wasmboyrtcbridge, mgbartcbridge, sprint16]
---

# RTC — orologio interno dell'emulatore
> L'orologio interno (Real Time Clock) presente in alcune cartucce/console emulate misura il tempo reale per attivare eventi temporali nei giochi che ne fanno uso.

## Contesto

Alcune piattaforme supportate al lancio prevedono un orologio interno all'interno della cartuccia o della console emulata. I giochi che ne fanno uso leggono data e ora correnti per attivare eventi temporali (cicli giorno/notte, eventi periodici, salvataggi su base oraria). [^src: management/kanban/EP-019-rtc-orologio-interno/EP-019.md §Obiettivo]

L'epica EP-019 introduce il controllo utente sull'orologio interno: impostazione manuale di data/ora dal Settings, persistenza locale dello stato fra sessioni, inclusione nei save state, riallineamento all'orologio del dispositivo. [^src: management/kanban/EP-019-rtc-orologio-interno/EP-019.md §Storie incluse]

Le decisioni architetturali (mappa piattaforma↔RTC, formato del payload, schema di persistenza IndexedDB, interfaccia bridge engine↔dominio, policy drift/timezone) sono fissate da ADR-009. [^src: design_&_architecture/decisions/ADR-009.md §Decisione]

## Dettaglio

### Definizione

RTC = chip o registro hardware (presente in alcune cartucce Game Boy Color con mapper MBC3 e in alcune cartucce Game Boy Advance con chip Seiko S-3511A) che misura il passare del tempo reale anche quando la console è spenta, alimentato da una batteria interna alla cartuccia. Nel contesto dell'emulazione web, l'RTC è uno stato che il core di emulazione (Gambatte per GB/GBC, mGBA per GBA) tiene aggiornato durante l'esecuzione e che può essere letto, modificato e persistito separatamente dalla SRAM e dal save state. [^src: design_&_architecture/decisions/ADR-009.md §Contesto]

### Mappa piattaforma ↔ presenza RTC

| Piattaforma | Core / Adapter | RTC nativo | Detection runtime | Titoli noti RTC-dependent |
|---|---|---|---|---|
| **Game Boy (DMG)** | Gambatte via `WasmBoyEngine` | NO | — | — |
| **Game Boy Color (GBC)** | Gambatte via `WasmBoyEngine` | SÌ, solo su cartucce **MBC3+RTC** | Header ROM `0x0147 ∈ {0x0F, 0x10}` | Pokémon Oro / Argento / Cristallo, Harvest Moon GBC |
| **Game Boy Advance (GBA)** | mGBA via `MgbaEngine` | SÌ, solo su cartucce con chip **Seiko S-3511A** | Database override mGBA / pattern match | Pokémon Rubino / Zaffiro / Smeraldo, Boktai |
| **Arcade** (FBNeo/MAME) | — | fuori scope EP-019 | — | — (rinviato a EP-009) |

La detection è **per-cartuccia, non per-piattaforma**: anche su GBC, solo le cartucce con MBC3+RTC esibiscono un orologio interno. [^src: design_&_architecture/decisions/ADR-009.md §Decisione]

### Formato `RtcState` (modello canonico)

Il dominio lavora su una struttura wall-clock unica, indipendente dal core sottostante:

```
RtcState = {
  year:   number  // ≥ 2000
  month:  number  // 1..12
  day:    number  // 1..31
  hour:   number  // 0..23
  minute: number  // 0..59
  second: number  // 0..59
}
```

Semantica: wall-clock UTC, senza timezone (l'hardware RTC reale non ha concetto di fuso). La conversione locale ⇄ UTC avviene solo nel form UI Settings ed è stateless. [^src: design_&_architecture/decisions/ADR-009.md §Decisione]

I formati raw engine-specifici (5 registri MBC3 per Gambatte, sequenza 7-byte BCD per mGBA/S-3511A) sono confinati negli adapter `RtcBridge` e NON sono esposti al dominio.

### Persistenza IndexedDB

Lo stato RTC è il **quinto** object store IndexedDB (accanto a `roms`, `saveStates`, `sram`, `config`):

- **Store**: `rtcState`
- **keyPath**: `romId` (FK logica → `roms.id`)
- **Campi**: `romId`, `state: RtcState`, `updatedAt` (ISO 8601 UTC), `schemaVersion` (= 1)
- **Cascade delete**: la rimozione della ROM elimina anche lo stato RTC associato.

Inoltre, la entry `saveStates` espone un campo opzionale `rtcState?: RtcState`: il ripristino di un save state riporta esattamente lo stato temporale del momento in cui è stato creato. La compatibilità all'indietro è garantita by-design (entry pregresse senza il campo si caricano senza modifiche all'orologio corrente). [^src: design_&_architecture/decisions/ADR-009.md §Decisione]

### Policy drift, timezone, riallineamento

- **Pausa = freeze** (no tick durante la pausa).
- **Drift fra sessioni**: alla riapertura il gioco riparte dall'esatto stato persistito (no catch-up automatico al wall-clock corrente).
- **Sync to device (US-068)**: azione esplicita dell'utente; legge l'orologio del dispositivo localmente; nessuna chiamata di rete (vincolo privacy on-device RNF-06).
- **Sync automatico**: mai. L'apertura del Settings, l'avvio del gioco, il caricamento della ROM e la ripresa da pausa non riallineano l'orologio interno.

## Aggiornamenti (v2026-06-30)

### Sprint 16 — Bridge concreti implementati (TSK-133, TSK-134, TSK-135)

Sprint 15 (EP-019) aveva completato il dominio (`RtcService`, `GameSession`, `SaveService`, `RtcSection` Settings UI) con stub `rtcBridge = null`. Sprint 16 ha consegnato i bridge concreti e la relativa copertura e2e, chiudendo il pendente ADR-009 §Pending.

#### `RtcBridge` — interfaccia e wiring

L'interfaccia `RtcBridge` (ADR-009 §4), intatta, è implementata da due bridge concreti e da `StubRtcBridge` (test):

```ts
interface RtcBridge {
  hasRtc(): boolean;
  getRtcState(): RtcState | null;
  setRtcState(state: RtcState): void;
}
```

Dopo `load()`, sia `WasmBoyEngine.rtcBridge` sia `MgbaEngine.rtcBridge` puntano alle istanze reali, non più a `null`. Il dominio non è cambiato: il flusso `GameSession`/`SaveService` che ruota su `rtcBridge` funziona invariato.

#### `WasmBoyRtcBridge` (TSK-133) — GBC / MBC3+RTC

File: `packages/app/src/core/wasmboy-rtc-bridge.ts`

**Detection** (`hasRtc()`): legge il byte `0x0147` dell'header ROM. Restituisce `true` solo se il valore è `0x0F` (MBC3+TIMER+BATTERY) o `0x10` (MBC3+TIMER+RAM+BATTERY). Tutti gli altri mapper (MBC1, MBC2, MBC5) restituiscono `false`.

**Accesso allo stato** (`getRtcState()` / `setRtcState()`): via `WasmBoy.saveState()` → patch del blob `wasmboyMemory.wasmBoyInternalState` agli offset MBC3 dedicati. Il bridge applica una **strategia "latch a mezzanotte / day=0"**: garantisce il round-trip esatto (`setRtcState` → `getRtcState` = stato identico) senza dipendere dal campo day counter a 9 bit di MBC3, il cui valore assoluto non è canonico.

**Limitazione nota**: gli offset interni di `wasmBoyInternalState` per i registri MBC3 sono **placeholder** (TODO inline); la validazione E2E completa con una ROM Pokémon proprietaria è gate umano (fixture non inclusa per copyright). I test con ROM sintetiche (TSK-135) verificano detection e round-trip a livello di header.

**Giochi GBC supportati** (MBC3+RTC): Pokémon Oro, Pokémon Argento, Pokémon Cristallo.

#### `MgbaRtcBridge` (TSK-134) — GBA / Seiko S-3511A

File: `packages/app/src/core/mgba-rtc-bridge.ts`

**Detection** (`hasRtc()`): lookup del **Game Code** dai byte ROM `0xAC..0xAF` contro una lista statica di 16 titoli GBA noti per montare il chip S-3511A. Non richiede caricamento completo della ROM.

**Titoli inclusi nella lista** (16 Game Code): Pokémon Rubino, Pokémon Zaffiro, Pokémon Smeraldo, Boktai 1, Boktai 2, Boktai 3, Sennen Kazoku (e varianti regionali di ciascuno).

**Accesso allo stato** (`getRtcState()` / `setRtcState()`): accede al save state mGBA → scansiona il blob cercando il marker ASCII `"RTC "` (4 byte) → decodifica il payload da 7 byte in formato **BCD S-3511A**: `[year, month, day, dayOfWeek, hour, minute, second]`.

**`zellerCongruence()`**: calcolo deterministico del `dayOfWeek` richiesto da S-3511A: dipende solo da `(year, month, day)` del modello canonico, mai da lookup esterna o `Date()`.

**Limitazione nota**: la scansione del marker `"RTC "` nel blob save state è dipendente dal layout interno di mGBA e può rompere su versioni future del core. I test con ROM sintetiche (TSK-135) coprono la path di detection; i casi GBA reali (Pokémon Rubino/Zaffiro/Smeraldo) sono `test.fixme` (gate umano — ROM proprietarie). [^src: management/kanban/EP-019-rtc-orologio-interno/US-065-impostare-data-ora-rtc/TSK-134.md §Technical Specs]

#### `TSK-135` — e2e detection con ROM sintetiche

Suite Playwright `ep019-rtc-bridge.e2e.ts` in `packages/app/e2e/`. Copre:

- `hasRtc()` GBC: ROM sintetica con byte `0x0147 = 0x0F` → `true`; ROM sintetica con `0x0147 = 0x00` (ROM Only) → `false`.
- `hasRtc()` GBA: ROM sintetica con Game Code Pokémon Rubino → `true`; ROM sintetica con Game Code non-RTC → `false`.
- 2 test `test.fixme` documentati per round-trip completo (set/get) con ROM Pokémon reali — sbloccati solo con fixture proprietarie (human gate).

Risultato: 4 test attivi verdi, 2 `test.fixme`, 0 regressioni suite esistente.

#### Mappa piattaforma aggiornata (dettaglio detection)

| Piattaforma | Bridge | Detection | Accesso stato | Limitazioni |
|---|---|---|---|---|
| GBC (MBC3+RTC) | `WasmBoyRtcBridge` | Byte ROM `0x0147 ∈ {0x0F, 0x10}` | `WasmBoy.saveState()` + patch offset MBC3 | Offset placeholder; e2e ROM reale = gate umano |
| GBA (S-3511A) | `MgbaRtcBridge` | Lookup Game Code `0xAC..0xAF` (16 titoli) | Save state mGBA + marker `"RTC "` + BCD 7-byte | Scansione marker fragile su versioni core future; e2e ROM reale = gate umano |
| GB (DMG) | nessuno (`rtcBridge = null`) | — | — | Nessun RTC (mapper MBC1/MBC2/MBC5) |
| Arcade | fuori scope | — | — | Rinviato EP-009 |

## Concetti correlati

[[piattaforme-e-core-supportati]]
[[save-state-e-sram]]
[[persistenza-locale]]
[[emulazione-via-core-wasm]]

## Pagine collegate

[[indexeddb]]
[[requisiti-funzionali-soli-boy]]

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
- EP-019 Modifica data e ora dell'orologio interno dell'emulatore (RTC) — `management/kanban/EP-019-rtc-orologio-interno/`
  - US-065 Impostare data e ora dell'orologio interno dal Settings
  - US-066 Persistenza locale dello stato dell'orologio interno
  - US-067 Stato dell'orologio interno incluso nei save state
  - US-068 Riallineamento dell'orologio interno all'orologio del dispositivo
