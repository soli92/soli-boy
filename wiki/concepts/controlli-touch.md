---
type: concept
sources: ["raw/2026-06-01-integrazione-mobile.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [mobile, input, touch, gamepad]
---

# Controlli touch
> Sui dispositivi mobile l'input avviene tramite controlli touch su schermo, con supporto a controller fisici e feedback aptico.

## Contesto

L'app fornisce controlli touch su schermo (D-pad e pulsanti virtuali) per ogni piattaforma emulata. [^src: raw/2026-06-01-integrazione-mobile.txt §4. Requisiti funzionali mobile]

## Dettaglio

I controlli touch sono configurabili per posizione, dimensione e opacità (RFM-02), e l'app supporta controller fisici Bluetooth tramite la Gamepad API (RFM-03). [^src: raw/2026-06-01-integrazione-mobile.txt §4. Requisiti funzionali mobile]

L'app offre feedback aptico opzionale sugli input touch (RFM-08) e rispetta le aree sicure (notch, barre di sistema) su entrambe le piattaforme (RFM-09). [^src: raw/2026-06-01-integrazione-mobile.txt §4. Requisiti funzionali mobile]

L'interfaccia è responsiva e ottimizzata per orientamento verticale e orizzontale (RFM-05), con interfaccia touch conforme alle linee guida solids e alle convenzioni di ciascuna piattaforma. [^src: raw/2026-06-01-integrazione-mobile.txt §5. Requisiti non funzionali mobile]

## Concetti correlati
[[confezionamento-mobile-capacitor]]

## Pagine collegate
[[requisiti-mobile-soli-boy]]
[[solids]]

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
- EP-018 Controlli shoulder L e R in tutte le modalità e versioni — `management/kanban/EP-018-controlli-shoulder-l-r/`
  - US-063 Controlli touch L/R per le piattaforme che li espongono
- EP-022 Mobile-first Responsive & Visual Fidelity Overhaul — `management/kanban/EP-022-mobile-responsive-fidelity/`
  - US-105 Fix mobile portrait — navbar overlay e Play tab nascosto sotto il logo
  - US-107 Mobile landscape — audit e fix layout
