---
type: entity
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [indexeddb, persistenza, storage]
---

# IndexedDB
> Archivio locale del browser, usato (via idb) per ROM, salvataggi e configurazioni.

## Contesto

IndexedDB, utilizzato tramite la libreria idb, è il livello di archiviazione locale di ROM, salvataggi e configurazioni. [^src: raw/2026-06-01-specifiche-funzionali.txt §5.1 Panoramica]

## Dettaglio

Nel livello di persistenza, IndexedDB conserva ROM, save state, SRAM e configurazioni. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.1 Visione d'insieme]

L'accesso a IndexedDB è incapsulato nel modulo `src/storage/`. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.2 Struttura del progetto]

Nel flusso di esecuzione di un gioco, la ROM viene salvata in IndexedDB e aggiunta alla libreria, e save state e SRAM vengono persistiti in IndexedDB e ripristinabili. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.3 Flusso di esecuzione di un gioco]

## Concetti correlati
[[persistenza-locale]]
[[save-state-e-sram]]

## Pagine collegate
[[architettura-a-tre-livelli]]
