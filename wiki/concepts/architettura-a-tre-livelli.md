---
type: concept
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [architettura, layering]
---

# Architettura a tre livelli
> L'applicazione è strutturata su interfaccia utente, motore di emulazione e persistenza locale.

## Contesto

L'applicazione è strutturata su tre livelli logici: interfaccia utente (React + solids), motore di emulazione (EmulatorJS/WASM) e persistenza locale (IndexedDB). [^src: raw/2026-06-01-specifiche-funzionali.txt §6.1 Visione d'insieme]

La stessa SPA viene servita come applicazione web e incapsulata nella shell Electron per la distribuzione desktop. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.1 Visione d'insieme]

## Dettaglio

Le responsabilità sono ripartite per livello: la presentazione (libreria, player, configurazione, temi) su React e solids; il dominio/servizi (riconoscimento piattaforma, gestione sessione di gioco, mapping comandi) in TypeScript; l'emulazione (esecuzione del core, rendering audio/video) su EmulatorJS/WASM e Gamepad API; la persistenza (ROM, save state, SRAM, configurazioni) su IndexedDB; la distribuzione desktop (filesystem nativo, IPC, packaging, aggiornamenti) su Electron. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.1 Visione d'insieme]

Il requisito non funzionale di manutenibilità impone un'architettura modulare con separazione tra UI, motore di emulazione e persistenza. [^src: raw/2026-06-01-specifiche-funzionali.txt §4. Requisiti non funzionali]

La struttura indicativa dei moduli prevede `src/core/` (wrapper EmulatorJS), `src/storage/` (IndexedDB), `src/components/`, `src/theme/`, più `electron/main.ts` e `electron/preload.ts`. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.2 Struttura del progetto]

## Concetti correlati
[[emulazione-via-core-wasm]]
[[persistenza-locale]]
[[distribuzione-web-e-desktop]]

## Pagine collegate
[[stack-tecnologico-soli-boy]]
