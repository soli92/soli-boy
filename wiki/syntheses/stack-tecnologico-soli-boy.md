---
type: synthesis
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [stack, architettura, tecnologie]
---

# Stack tecnologico di Soli-boy
> Stack selezionato per massimizzare la velocità di sviluppo, riusando motori consolidati e una codebase condivisa web/desktop.

## Contesto

Lo stack è stato selezionato per massimizzare la velocità di sviluppo, riusando motori di emulazione consolidati e una base di codice condivisa tra web e desktop. [^src: raw/2026-06-01-specifiche-funzionali.txt §5.1 Panoramica]

## Panoramica dello stack

| Livello | Tecnologia | Ruolo |
|---|---|---|
| Linguaggio | TypeScript | Tipizzazione statica su tutta la codebase |
| Framework UI | React | Interfaccia a componenti |
| Design system | [[solids]] (soli92/solids) v1.14.1 | Componenti, token, icone, linee guida visive |
| Build tool | Vite | Bundling, dev server, build di produzione |
| Emulazione | [[emulatorjs]] (core Libretro WASM) | Gambatte (GB/GBC), mGBA (GBA), FBNeo/MAME (arcade) |
| Persistenza | [[indexeddb]] (via idb) | ROM, salvataggi, configurazioni locali |
| Input | Gamepad API | Controller, identico su web e desktop |
| Shell desktop | [[electron]] | Confezionamento app nativa multipiattaforma |

Tutte le righe della tabella sono tratte dalla panoramica dello stack del documento. [^src: raw/2026-06-01-specifiche-funzionali.txt §5.1 Panoramica]

## Linee guida di integrazione del design system

L'integrazione di solids prevede installazione come dipendenza, importazione di token/stili all'entry point, definizione del tema applicativo, wrapping dell'albero React con il provider di tema e uso esclusivo di componenti e token del sistema, estendibili solo via componenti compositi. [^src: raw/2026-06-01-specifiche-funzionali.txt §5.3 Linee guida di integrazione del design system]

## Note per lo stack-detector

Lo stack è esplicitato nel documento di specifica; con `stack_mode: guided` questa sintesi è la base di partenza per la conferma dello stack in `raw/tech_stack.md`.

## Concetti correlati
[[architettura-a-tre-livelli]]

## Pagine collegate
[[2026-06-01-specifiche-funzionali]]
