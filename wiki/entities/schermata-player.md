---
type: entity
kind: screen
sources: ["raw/soliboy-mockups/README.md", "raw/soliboy-mockups/screens/player-dark-desktop.html"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [ui, schermata, player, mockup]
---

# Schermata Player (Player di gioco)
> Vista di esecuzione con viewport di gioco, HUD di stato, controlli e pannello dei save state.

## Contesto

La schermata Player mostra il viewport di gioco (aspect ratio 16:10 su desktop), un HUD con fps, piattaforma/core e slot di salvataggio, e i controlli di esecuzione. [^src: raw/soliboy-mockups/screens/player-dark-desktop.html]

## Struttura

- Viewport di gioco con indicazione di scena (es. "WORLD 1-2").
- HUD: "60 fps", "GBA · mGBA", "Slot 1".
- Controlli: Pausa, Avanti veloce, Schermo intero.
- Pannello laterale (desktop): elenco "Save state" con slot (Carica/Salva) e sezione "Input".

## Adattamento per dispositivo

Su mobile e tablet il layout è verticale con controlli touch; su desktop è orizzontale 16:10 con pannello laterale di save state e indicazione input tastiera/gamepad, senza controlli touch. [^src: raw/soliboy-mockups/README.md §Note di adattamento per dispositivo]

Nei mockup desktop l'input riporta "Tastiera & gamepad Xbox connesso; i controlli touch non sono mostrati su desktop". [^src: raw/soliboy-mockups/screens/player-dark-desktop.html]

## Concetti correlati
[[save-state-e-sram]]
[[controlli-touch]]
[[layout-responsive]]

## Pagine collegate
[[2026-06-01-mockups-ui]]

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
- EP-020 Graphic Refactoring & Solids Component Migration — `management/kanban/EP-020-graphic-refactoring/`
  - US-095 Play tab — Player + HUD + FileLoader migration
- EP-021 Allineamento visivo produzione ↔ prototipo EP-020 — `management/kanban/EP-021-visual-fidelity-prototype/`
  - US-103 Layout Player desktop + visual oracle e2e
- EP-022 Mobile-first Responsive & Visual Fidelity Overhaul — `management/kanban/EP-022-mobile-responsive-fidelity/`
  - US-107 Mobile landscape — audit e fix layout (Player, TouchOverlay)
  - US-108 Tablet — audit e fix layout (player sizing)
  - US-109 Desktop — audit e fix residui fidelity post EP-021
