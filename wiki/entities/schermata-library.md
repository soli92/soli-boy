---
type: entity
kind: screen
sources: ["raw/soliboy-mockups/README.md", "raw/soliboy-mockups/screens/library-dark-desktop.html"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [ui, schermata, libreria, mockup]
---

# Schermata Library (Libreria)
> Vista di ingresso che mostra i giochi caricati in una griglia, con header, ricerca e azione di caricamento.

## Contesto

La schermata Library presenta i giochi caricati in una griglia, con header (logo Soli-boy, azione "Carica ROM", accesso alle impostazioni) e barra di ricerca. [^src: raw/soliboy-mockups/screens/library-dark-desktop.html]

## Struttura

- Header con titolo/logo, pulsante primario "Carica ROM" e icona Impostazioni.
- Campo di ricerca ("Cerca un gioco…") con filtri per piattaforma.
- Griglia dei giochi con titolo e piattaforma per elemento.

## Adattamento per dispositivo

La griglia dei giochi è a 2 colonne su mobile, 3 su tablet e 5 su desktop, con un numero di giochi mostrati crescente. [^src: raw/soliboy-mockups/README.md §Note di adattamento per dispositivo]

## Requisiti coperti

Riflette la libreria di gioco con griglia titolo/piattaforma e ricerca/filtro, e l'azione di caricamento ROM.

## Concetti correlati
[[libreria-di-gioco]]
[[layout-responsive]]

## Pagine collegate
[[2026-06-01-mockups-ui]]
[[solids]]

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
- EP-020 Graphic Refactoring & Solids Component Migration — `management/kanban/EP-020-graphic-refactoring/`
  - US-096 Library tab — game grid + search + chips + dialog
