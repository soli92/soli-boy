---
type: concept
sources: ["raw/soliboy-mockups/README.md"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [responsive, layout, mobile, tablet, desktop]
---

# Layout responsive
> Le schermate si adattano a tre fasce di dispositivo: mobile (~390px), tablet (~768px), desktop (~1280px).

## Contesto

I mockup coprono tre fasce di dispositivo — mobile (~390px), tablet (~768px), desktop (~1280px) — per ciascuna sezione e tema. [^src: raw/soliboy-mockups/README.md §Cosa contiene]

## Adattamenti per sezione

- **Library**: griglia giochi a 2 colonne (mobile), 3 (tablet), 5 (desktop), con numero di giochi mostrati crescente. [^src: raw/soliboy-mockups/README.md §Note di adattamento per dispositivo]
- **Player**: layout verticale con controlli touch su mobile e tablet; su desktop layout orizzontale 16:10 con pannello laterale di save state e indicazione input tastiera/gamepad, senza controlli touch. [^src: raw/soliboy-mockups/README.md §Note di adattamento per dispositivo]
- **Settings**: sezioni in 1 colonna (mobile), 2 (tablet), 3 (desktop); la sezione "Dati" occupa sempre l'intera larghezza. [^src: raw/soliboy-mockups/README.md §Note di adattamento per dispositivo]

## Concetti correlati
[[controlli-touch]]
[[temi-e-design-token-solids]]

## Pagine collegate
[[schermata-library]]
[[schermata-player]]
[[schermata-settings]]

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
- EP-020 Graphic Refactoring & Solids Component Migration — `management/kanban/EP-020-graphic-refactoring/`
  - US-094 App shell + Tabs navigation migration
- EP-021 Allineamento visivo produzione ↔ prototipo EP-020 — `management/kanban/EP-021-visual-fidelity-prototype/`
  - US-101 Shell + theme switcher + Play idle CTA
- EP-022 Mobile-first Responsive & Visual Fidelity Overhaul — `management/kanban/EP-022-mobile-responsive-fidelity/`
  - US-104 Audit sistematico fedeltà grafica prototipo↔produzione sui 4 viewport
  - US-105 Fix mobile portrait — navbar overlay e Play tab nascosto sotto il logo
  - US-107 Mobile landscape — audit e fix layout
  - US-108 Tablet — audit e fix layout
  - US-109 Desktop — audit e fix residui fidelity post EP-021
  - US-110 Regression e2e multi-viewport
