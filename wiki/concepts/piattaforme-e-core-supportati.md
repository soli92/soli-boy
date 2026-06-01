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

## Concetti correlati
[[emulazione-via-core-wasm]]
[[vincoli-legali-rom-bios]]

## Pagine collegate
[[emulatorjs]]
