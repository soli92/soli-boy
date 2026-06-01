---
type: entity
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [electron, desktop, packaging]
---

# Electron
> Shell di confezionamento dell'app desktop nativa multipiattaforma.

## Contesto

Electron è la shell desktop usata per confezionare l'app nativa multipiattaforma. [^src: raw/2026-06-01-specifiche-funzionali.txt §5.1 Panoramica]

## Dettaglio

Nel livello di distribuzione desktop, Electron è responsabile di filesystem nativo, IPC, packaging e aggiornamenti. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.1 Visione d'insieme]

IPC indica la Inter-Process Communication, ovvero la comunicazione tra processi in Electron. [^src: raw/2026-06-01-specifiche-funzionali.txt §1.4 Definizioni e acronimi]

Nella struttura del progetto, `electron/main.ts` gestisce la finestra principale e l'IPC del filesystem, mentre `electron/preload.ts` fornisce il bridge sicuro verso il renderer. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.2 Struttura del progetto]

Nella versione Electron i core devono essere inclusi localmente per garantire il funzionamento offline. [^src: raw/2026-06-01-specifiche-funzionali.txt §7.2 Vincoli tecnici]

## Concetti correlati
[[distribuzione-web-e-desktop]]

## Pagine collegate
[[architettura-a-tre-livelli]]
