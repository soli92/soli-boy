---
type: source
sources: ["raw/soliboy-mockups/README.md"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [mockup, ui, solids, design]
---

# Mockup UI SoliDS — Soli-boy
> Set di 18 mockup statici dell'interfaccia di Soli-boy come riferimento visivo e strutturale dell'UI.

## Contesto

I mockup sono un set di schermate HTML standalone dell'interfaccia di Soli-boy, pensate per essere ingerite da una knowledge base come riferimento visivo e strutturale dell'UI. [^src: raw/soliboy-mockups/README.md §Soli-boy — Mockup UI (SoliDS)]

## Dettaglio

Il set contiene 18 schermate, una per ogni combinazione di sezione (library, player, settings), tema (dark, cyberpunk) e dispositivo (mobile ~390px, tablet ~768px, desktop ~1280px), con naming `screens/<sezione>-<tema>-<dispositivo>.html`. [^src: raw/soliboy-mockups/README.md §Cosa contiene]

Ogni file ha in testa un commento e un `<meta name="description">` con metadati `chiave=valore` per il parsing automatico (es. `section=library | theme=cyberpunk | device=desktop`).

## Sezioni mappate a pagine

- [[schermata-library]] — sezione Libreria.
- [[schermata-player]] — sezione Player di gioco.
- [[schermata-settings]] — sezione Impostazioni.
- [[temi-e-design-token-solids]] — temi e token SoliDS.
- [[layout-responsive]] — adattamento per dispositivo.

## Avvertenza di integrazione (reale vs mockup)

I valori esadecimali dei temi in `assets/solids-theme.css` sono un'approssimazione a uso esclusivo dei mockup; nell'app reale va usato il pacchetto `@soli92/solids` (import del CSS + selezione tema via `data-theme`), eliminando i blocchi colore locali. Struttura, nomi dei token e classi sono invece fedeli e riutilizzabili. [^src: raw/soliboy-mockups/README.md §IMPORTANTE per il progetto reale]

## Avvertenza legale

Le schermate riportano che Soli-boy non distribuisce né include ROM o BIOS protetti: l'utente carica esclusivamente file di propria proprietà. [^src: raw/soliboy-mockups/README.md §Avvertenza legale (presente anche nelle schermate)]

## Pagine collegate
[[solids]]
[[2026-06-01-specifiche-funzionali]]

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
