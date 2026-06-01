---
type: entity
sources: ["raw/2026-06-01-integrazione-mobile.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [capacitor, mobile, packaging]
---

# Capacitor
> Runtime che incapsula la SPA web esistente in un contenitore nativo per Android e iOS.

## Contesto

Capacitor incapsula la SPA web esistente in un contenitore nativo per Android e iOS, esponendo le API native (filesystem, gamepad, haptics) tramite plugin. [^src: raw/2026-06-01-integrazione-mobile.txt §3.1 Opzione A — Capacitor (consigliata)]

## Dettaglio

È la via più rapida perché riutilizza quasi integralmente il codice React e i componenti solids già sviluppati, con un'unica logica applicativa condivisa tra web, desktop (Electron) e mobile (Capacitor). [^src: raw/2026-06-01-integrazione-mobile.txt §3.1 Opzione A — Capacitor (consigliata)]

Nel modello di distribuzione, sia Android sia iOS usano Capacitor come contenitore (WebView + plugin nativi), con distribuzione rispettivamente su Play Store e App Store. [^src: raw/2026-06-01-integrazione-mobile.txt §6. Impatti sull'architettura]

I core EmulatorJS (WASM) restano il motore di emulazione anche su mobile, eseguiti all'interno del WebView del contenitore Capacitor. [^src: raw/2026-06-01-integrazione-mobile.txt §3.3 Emulazione su mobile]

## Concetti correlati
[[confezionamento-mobile-capacitor]]
[[emulazione-su-mobile]]

## Pagine collegate
[[electron]]
[[emulatorjs]]
