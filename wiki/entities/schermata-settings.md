---
type: entity
kind: screen
sources: ["raw/soliboy-mockups/README.md", "raw/soliboy-mockups/screens/settings-dark-desktop.html"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [ui, schermata, impostazioni, mockup]
---

# Schermata Settings (Impostazioni)
> Vista di configurazione organizzata in sezioni: Video, Audio, BIOS, Controlli e Dati.

## Contesto

La schermata Settings raccoglie le impostazioni in sezioni a scheda: Video, Audio, BIOS, Controlli e Dati. [^src: raw/soliboy-mockups/screens/settings-dark-desktop.html]

## Struttura delle sezioni

- **Video**: scala (2x / 3x / Intero), aspect ratio (Originale / 4:3), filtro (Nearest / Scanline).
- **Audio**: volume (slider) e muto (toggle).
- **BIOS**: stato del file BIOS (es. GBA BIOS "Caricato") e azione di sostituzione.
- **Controlli**: gamepad connesso, vibrazione (toggle), rimappatura comandi.
- **Dati**: esporta/importa salvataggi e svuota libreria.

La sezione "Dati" occupa sempre l'intera larghezza. [^src: raw/soliboy-mockups/README.md §Note di adattamento per dispositivo]

In calce è presente l'avviso legale che Soli-boy non distribuisce ROM o BIOS e l'utente carica solo file di propria proprietà. [^src: raw/soliboy-mockups/screens/settings-dark-desktop.html]

## Adattamento per dispositivo

Le sezioni sono disposte in 1 colonna su mobile, 2 su tablet e 3 su desktop. [^src: raw/soliboy-mockups/README.md §Note di adattamento per dispositivo]

## Concetti correlati
[[vincoli-legali-rom-bios]]
[[layout-responsive]]

## Pagine collegate
[[2026-06-01-mockups-ui]]
[[requisiti-funzionali-soli-boy]]

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
- EP-019 Modifica data e ora dell'orologio interno dell'emulatore (RTC) — `management/kanban/EP-019-rtc-orologio-interno/`
  - US-065 Impostare data e ora dell'orologio interno dal Settings
  - US-068 Riallineamento dell'orologio interno all'orologio del dispositivo
- EP-020 Graphic Refactoring & Solids Component Migration — `management/kanban/EP-020-graphic-refactoring/`
  - US-097 Settings tab — accordion + form controls + ThemeSelector
  - US-098 Info tab — notices + UpdateBanner
- EP-021 Allineamento visivo produzione ↔ prototipo EP-020 — `management/kanban/EP-021-visual-fidelity-prototype/`
  - US-102 Tab Info & Privacy arricchita
- EP-022 Mobile-first Responsive & Visual Fidelity Overhaul — `management/kanban/EP-022-mobile-responsive-fidelity/`
  - US-108 Tablet — audit e fix layout (Settings 2 colonne)
  - US-109 Desktop — audit e fix residui fidelity (Settings 3 colonne)
