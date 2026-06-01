---
type: synthesis
sources: ["raw/2026-06-01-integrazione-mobile.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [roadmap, mobile, pianificazione]
---

# Roadmap mobile di Soli-boy
> La roadmap di base è estesa con le fasi mobile, da affrontare dopo il consolidamento del nucleo condiviso.

## Contesto

La roadmap di base è estesa con le fasi mobile, da affrontare dopo il consolidamento del nucleo condiviso (MVP web). [^src: raw/2026-06-01-integrazione-mobile.txt §7. Roadmap aggiornata]

## Fasi

Le fasi 1-2 coprono proof of concept e MVP web (nucleo condiviso), la fase 3 la versione desktop Electron, la fase 4 l'integrazione Capacitor e i controlli touch (RFM-01/02), la fase 5 l'ottimizzazione e pubblicazione Android su Play Store, la fase 6 la validazione WebAssembly/JIT e la conformità App Store per iOS, la fase 7 le rifiniture comuni (controller, aptica, import/export salvataggi). [^src: raw/2026-06-01-integrazione-mobile.txt §7. Roadmap aggiornata]

## Impatti sull'architettura

L'aggiunta delle versioni mobile estende il modello di distribuzione condiviso: logica applicativa, interfaccia React e componenti solids restano condivisi, mentre cambiano i contenitori di confezionamento per ciascun target. [^src: raw/2026-06-01-integrazione-mobile.txt §6. Impatti sull'architettura]

I componenti condivisi tra tutti i target sono l'interfaccia React e solids, i servizi di dominio, il motore EmulatorJS/WASM e una logica di persistenza astratta su un'interfaccia di storage adattata a IndexedDB/web e filesystem/nativo. [^src: raw/2026-06-01-integrazione-mobile.txt §6. Impatti sull'architettura]

> Nota: la pianificazione operativa (epiche, user story, sprint) derivata da questa roadmap è competenza del product-manager (L3).

## Pagine collegate
[[confezionamento-mobile-capacitor]]
[[distribuzione-web-e-desktop]]
[[2026-06-01-integrazione-mobile]]
