---
type: concept
sources: ["raw/2026-06-01-specifiche-funzionali.txt", "design_&_architecture/decisions/ADR-009.md"]
status: draft
created: 2026-06-30
updated: 2026-06-30
tags: [rtc, orologio, salvataggi, gbc, gba, mbc3]
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
