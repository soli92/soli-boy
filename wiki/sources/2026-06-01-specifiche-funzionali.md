---
type: source
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [specifiche, soli-boy, emulatore, requisiti]
---

# Specifiche Funzionali Soli-boy v1.0
> Documento sorgente che definisce ambito, requisiti, stack e architettura dell'emulatore multipiattaforma Soli-boy.

## Contesto

Soli-boy è un emulatore di giochi per piattaforme arcade e console portatili, distribuito sia come web application sia come applicazione desktop nativa; il documento è rivolto a sviluppo, design, prodotto e stakeholder. [^src: raw/2026-06-01-specifiche-funzionali.txt §1.1 Scopo del documento]

Il documento è alla versione 1.0, in stato di bozza/revisione, datato 1 giugno 2026. [^src: raw/2026-06-01-specifiche-funzionali.txt §Documento di Specifiche Funzionali]

## Dettaglio

L'obiettivo primario del progetto è la velocità di realizzazione: si predilige il riuso di motori di emulazione consolidati rispetto allo sviluppo di core proprietari. [^src: raw/2026-06-01-specifiche-funzionali.txt §1.2 Descrizione generale]

## Oggetti estratti (indice)

Concetti:
- [[emulazione-via-core-wasm]] — riuso di core Libretro maturi in WebAssembly.
- [[architettura-a-tre-livelli]] — UI / emulazione / persistenza.
- [[persistenza-locale]] — dati di gioco on-device.
- [[save-state-e-sram]] — snapshot vs salvataggio in-game.
- [[libreria-di-gioco]] — griglia, filtri e ricerca.
- [[distribuzione-web-e-desktop]] — SPA web + shell Electron.
- [[vincoli-legali-rom-bios]] — nessun contenuto protetto distribuito.
- [[piattaforme-e-core-supportati]] — GB/GBC/GBA + arcade.

Entità:
- [[solids]] — design system aziendale.
- [[emulatorjs]] — motore di emulazione.
- [[electron]] — shell desktop.
- [[indexeddb]] — persistenza locale.

Sintesi:
- [[requisiti-funzionali-soli-boy]] — RF/RNF consolidati.
- [[stack-tecnologico-soli-boy]] — stack + linee guida.

## Roadmap dichiarata

Il documento dichiara una roadmap indicativa in 4 fasi: proof of concept (ROM GB nel browser), MVP web (libreria/player/salvataggi + GB/GBC/GBA/arcade su solids), versione desktop (Electron, core offline, filesystem nativo), rifinitura (rimappatura comandi, shader, import/export salvataggi, aggiornamenti automatici). [^src: raw/2026-06-01-specifiche-funzionali.txt §8. Roadmap indicativa]

> Nota: la derivazione di epiche e user story dalla roadmap e dai requisiti è competenza del product-manager (L3), non di questa source page.

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
- EP-001 Gestione dei file di gioco — `management/kanban/EP-001-gestione-file-di-gioco/`
- EP-002 Libreria di gioco — `management/kanban/EP-002-libreria-di-gioco/`
- EP-003 Esecuzione e controlli — `management/kanban/EP-003-esecuzione-e-controlli/`
- EP-004 Salvataggi — `management/kanban/EP-004-salvataggi/`
- EP-005 Resa video — `management/kanban/EP-005-resa-video/`
- EP-006 Distribuzione desktop — `management/kanban/EP-006-distribuzione-desktop/`
