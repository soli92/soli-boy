---
type: concept
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [salvataggi, save-state, sram]
---

# Save state e SRAM
> Due meccanismi di salvataggio distinti: l'istantanea completa dell'emulatore e il salvataggio in-game della cartuccia.

## Contesto

Un *save state* è un'istantanea completa dello stato dell'emulatore, ripristinabile in qualsiasi momento. [^src: raw/2026-06-01-specifiche-funzionali.txt §1.4 Definizioni e acronimi]

## Dettaglio

L'utente può creare save state multipli e ripristinarli. [^src: raw/2026-06-01-specifiche-funzionali.txt §3.4 Salvataggi]

Distintamente dal save state, il sistema persiste i salvataggi in-game (SRAM) della cartuccia. [^src: raw/2026-06-01-specifiche-funzionali.txt §3.4 Salvataggi]

Entrambi i tipi di salvataggio sono persistiti in IndexedDB e ripristinabili nel flusso di esecuzione di un gioco. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.3 Flusso di esecuzione di un gioco]

## Concetti correlati
[[persistenza-locale]]

## Pagine collegate
[[indexeddb]]
[[requisiti-funzionali-soli-boy]]

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
- EP-019 Modifica data e ora dell'orologio interno dell'emulatore (RTC) — `management/kanban/EP-019-rtc-orologio-interno/`
  - US-067 Stato dell'orologio interno incluso nei save state
