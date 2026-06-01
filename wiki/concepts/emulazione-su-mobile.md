---
type: concept
sources: ["raw/2026-06-01-integrazione-mobile.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [mobile, emulazione, ios, webassembly]
---

# Emulazione su mobile
> Su mobile i core EmulatorJS/WASM girano nel WebView del contenitore Capacitor, con vincoli specifici su iOS.

## Contesto

I core EmulatorJS (WASM) restano il motore di emulazione anche su mobile, eseguiti all'interno del WebView del contenitore Capacitor; vanno verificate le prestazioni su dispositivi di fascia media e l'inclusione locale dei core per il funzionamento offline. [^src: raw/2026-06-01-integrazione-mobile.txt §3.3 Emulazione su mobile]

## Vincolo iOS

Su iOS l'esecuzione di WebAssembly avviene tramite il motore WebView di sistema, e vanno verificati i limiti di JIT e prestazioni. [^src: raw/2026-06-01-integrazione-mobile.txt §3.3 Emulazione su mobile]

Le politiche dell'App Store sugli emulatori sono cambiate di recente e vanno validate in fase di pubblicazione, assicurandosi che l'app non distribuisca contenuti protetti. [^src: raw/2026-06-01-integrazione-mobile.txt §3.3 Emulazione su mobile]

## Concetti correlati
[[emulazione-via-core-wasm]]
[[confezionamento-mobile-capacitor]]

## Pagine collegate
[[capacitor]]
[[emulatorjs]]
[[vincoli-legali-rom-bios]]
