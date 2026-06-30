---
type: concept
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [piattaforme, core, game-boy, gba, arcade]
---

# Piattaforme e core supportati
> Le piattaforme al lancio sono Game Boy/GBC, GBA e arcade, ciascuna servita dal core appropriato.

## Contesto

Le piattaforme supportate al lancio sono Nintendo Game Boy (GB) e Game Boy Color (GBC), Nintendo Game Boy Advance (GBA) e giochi arcade tramite i core FBNeo e MAME. [^src: raw/2026-06-01-specifiche-funzionali.txt §1.3 Obiettivi e ambito]

## Dettaglio

L'emulazione associa a ciascuna piattaforma un core Libretro: Gambatte per GB/GBC, mGBA per GBA, FBNeo/MAME per arcade. [^src: raw/2026-06-01-specifiche-funzionali.txt §5.1 Panoramica]

Il sistema riconosce automaticamente la piattaforma dall'estensione e dal contenuto del file, e avvia l'emulazione del gioco selezionato con il core appropriato. [^src: raw/2026-06-01-specifiche-funzionali.txt §3.1 Gestione dei file di gioco]

Sono fuori ambito per la prima release il multiplayer online, lo store integrato, le funzionalità social e il supporto a console domestiche (NES/SNES/Sega), previsti come possibili estensioni future. [^src: raw/2026-06-01-specifiche-funzionali.txt §1.3 Obiettivi e ambito]

## Aggiornamenti (v2026-06-30)

### RTC per piattaforma — presenza e detection (ADR-009, Sprint 16)

Non tutte le piattaforme supportate espongono un orologio interno (RTC). La presenza è **per-cartuccia**, non per-piattaforma: lo stesso core (es. Gambatte/WasmBoy) serve sia ROM senza RTC sia ROM MBC3+RTC.

| Piattaforma | Adapter engine | RTC possibile | Condizione |
|---|---|---|---|
| GB (DMG) | `WasmBoyEngine` | NO | Mapper MBC1/MBC2/MBC5 — nessun orologio |
| GBC | `WasmBoyEngine` | SÌ, **solo MBC3+RTC** | Byte ROM `0x0147 ∈ {0x0F, 0x10}` — bridge `WasmBoyRtcBridge` |
| GBA | `MgbaEngine` | SÌ, **solo chip S-3511A** | Game Code ROM `0xAC..0xAF` in lista 16 titoli — bridge `MgbaRtcBridge` |
| Arcade | — | fuori scope | Rinviato EP-009 |

La detection è runtime (a ROM caricata) via `RtcBridge.hasRtc()`. L'UI Settings (`RtcSection`) è visibile solo se `hasRtc()` restituisce `true`. Per la documentazione completa dell'architettura bridge vedi [[rtc-orologio-interno]]. [^src: design_&_architecture/decisions/ADR-009.md §Decisione]

## Concetti correlati
[[emulazione-via-core-wasm]]
[[vincoli-legali-rom-bios]]
[[rtc-orologio-interno]]

## Pagine collegate
[[emulatorjs]]

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
- EP-019 Modifica data e ora dell'orologio interno dell'emulatore (RTC) — `management/kanban/EP-019-rtc-orologio-interno/`
  - US-065 Impostare data e ora dell'orologio interno dal Settings
  - US-066 Persistenza locale dello stato dell'orologio interno
  - US-067 Stato dell'orologio interno incluso nei save state
  - US-068 Riallineamento dell'orologio interno all'orologio del dispositivo
