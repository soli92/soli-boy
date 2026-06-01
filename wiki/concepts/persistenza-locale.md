---
type: concept
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [persistenza, privacy, indexeddb]
---

# Persistenza locale
> ROM, salvataggi e configurazioni restano sul dispositivo dell'utente, archiviati in IndexedDB.

## Contesto

La persistenza locale conserva ROM, save state, SRAM e configurazioni tramite IndexedDB. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.1 Visione d'insieme]

## Dettaglio

Le ROM caricate sono memorizzate localmente e ripresentate nella libreria agli avvii successivi. [^src: raw/2026-06-01-specifiche-funzionali.txt §3.1 Gestione dei file di gioco]

I salvataggi sono conservati localmente e associati al gioco corretto, e possono essere esportati e importati come file. [^src: raw/2026-06-01-specifiche-funzionali.txt §3.4 Salvataggi]

Il requisito di privacy impone che tutti i dati di gioco e i salvataggi restino sul dispositivo dell'utente. [^src: raw/2026-06-01-specifiche-funzionali.txt §4. Requisiti non funzionali]

Il requisito di sicurezza prescrive l'esecuzione del core in contesto isolato e nessun invio dei file dell'utente a server esterni. [^src: raw/2026-06-01-specifiche-funzionali.txt §4. Requisiti non funzionali]

## Concetti correlati
[[save-state-e-sram]]
[[architettura-a-tre-livelli]]

## Pagine collegate
[[indexeddb]]
