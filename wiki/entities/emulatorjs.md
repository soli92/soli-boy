---
type: entity
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [emulatore, libretro, wasm]
---

# EmulatorJS
> Motore di emulazione basato su core Libretro in WASM, responsabile dell'esecuzione dei giochi.

## Contesto

EmulatorJS, basato su core Libretro in WASM, è il livello di emulazione responsabile dell'esecuzione dei giochi: Gambatte (GB/GBC), mGBA (GBA), FBNeo/MAME (arcade). [^src: raw/2026-06-01-specifiche-funzionali.txt §5.1 Panoramica]

## Dettaglio

Nel livello di emulazione, EmulatorJS esegue il core e cura il rendering audio/video, con gli input forniti da tastiera o gamepad tramite la Gamepad API. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.1 Visione d'insieme]

Nella struttura del progetto, il wrapper di EmulatorJS e il mapping estensione → core vivono nel modulo `src/core/`. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.2 Struttura del progetto]

All'avvio di un gioco il wrapper seleziona e inizializza il core corrispondente, che esegue il gioco e rende audio/video. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.3 Flusso di esecuzione di un gioco]

## Concetti correlati
[[emulazione-via-core-wasm]]
[[piattaforme-e-core-supportati]]

## Pagine collegate
[[architettura-a-tre-livelli]]
