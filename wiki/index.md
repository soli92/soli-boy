---
id: index
type: index
title: Wiki Index
status: draft
created: 2026-06-01
updated: 2026-06-01
sources: []
tags: [navigation]
---

# Wiki Index

Punto di ingresso navigabile alla wiki di **soli-boy** (emulatore multipiattaforma per
arcade e console handheld). Layout karpathy-style.

## Dominio progetto

### Sources
- [[2026-06-01-specifiche-funzionali]] — Documento di Specifiche Funzionali v1.0.
- [[2026-06-01-integrazione-mobile]] — Estensione alle piattaforme mobile (Android e iOS).
- [[2026-06-01-mockups-ui]] — Mockup UI SoliDS (18 schermate).
- [[2026-06-01-brand-kit]] — Brand kit (logo + icon set + palette).

### Concepts
- [[emulazione-via-core-wasm]] — riuso di core Libretro maturi in WebAssembly.
- [[architettura-a-tre-livelli]] — UI / emulazione / persistenza.
- [[persistenza-locale]] — dati di gioco e salvataggi on-device.
- [[save-state-e-sram]] — istantanea dell'emulatore vs salvataggio in-game.
- [[libreria-di-gioco]] — griglia, filtri e ricerca dei giochi.
- [[distribuzione-web-e-desktop]] — SPA web + shell Electron + estensione mobile.
- [[vincoli-legali-rom-bios]] — nessun contenuto protetto distribuito.
- [[piattaforme-e-core-supportati]] — GB/GBC, GBA, arcade.
- [[confezionamento-mobile-capacitor]] — Capacitor vs React Native per il mobile.
- [[controlli-touch]] — input touch, controller BT, aptica su mobile.
- [[emulazione-su-mobile]] — core WASM nel WebView, vincolo iOS.
- [[temi-e-design-token-solids]] — token --sd-*, temi dark/cyberpunk, accessibilità.
- [[layout-responsive]] — adattamento mobile/tablet/desktop.
- [[brand-identita-soliboy]] — logo pixel-art + palette cyberpunk.

### Entities
- [[solids]] — design system aziendale (soli92/solids v1.14.1).
- [[emulatorjs]] — motore di emulazione (core Libretro WASM).
- [[electron]] — shell desktop nativa.
- [[indexeddb]] — persistenza locale (via idb).
- [[capacitor]] — contenitore nativo mobile (Android/iOS).
- [[schermata-library]] · [[schermata-player]] · [[schermata-settings]] — mockup UI (kind: screen).
- [[soliboy-logo]] — logo/icone (kind: asset).

### Syntheses
- [[requisiti-funzionali-soli-boy]] — RF-01..RF-25 e RNF-01..RNF-08 consolidati.
- [[stack-tecnologico-soli-boy]] — overview stack + linee guida di integrazione.
- [[requisiti-mobile-soli-boy]] — RFM-01..09 e RNFM-01..07 mobile.
- [[roadmap-mobile-soli-boy]] — roadmap estesa con le fasi mobile.

### Runbooks
- [[emulatorjs-hosting]] — hosting core EmulatorJS (CDN/self-host, COOP/COEP).

## Framework (factory llm-wiki++)

### Concepts
- [[factory-compression-layer]] · [[token-compression]] · [[knowledge-graph-codebase]]

### Entities
- [[julius-brussee]] · [[caveman]] · [[graphify]]

### Syntheses
- [[token-reduction-tools]]
