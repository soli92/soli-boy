---
type: concept
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [distribuzione, electron, web]
---

# Distribuzione web e desktop
> La stessa codebase è distribuita come web application e come applicazione desktop nativa.

## Contesto

Soli-boy è distribuito sia come web application sia come applicazione desktop nativa, e consente di caricare ed eseguire ROM nel browser oppure tramite un'applicazione desktop. [^src: raw/2026-06-01-specifiche-funzionali.txt §1.1 Scopo del documento]

## Dettaglio

La stessa SPA viene servita come applicazione web e incapsulata nella shell Electron per la distribuzione desktop. [^src: raw/2026-06-01-specifiche-funzionali.txt §6.1 Visione d'insieme]

Il requisito di portabilità prevede una codebase condivisa tra versione web e desktop, con pacchetti per Windows, macOS e Linux. [^src: raw/2026-06-01-specifiche-funzionali.txt §4. Requisiti non funzionali]

Nella versione desktop l'applicazione accede al filesystem nativo per aprire e salvare file, include i core di emulazione localmente per il funzionamento offline e supporta l'aggiornamento automatico delle versioni. [^src: raw/2026-06-01-specifiche-funzionali.txt §3.6 Funzionalità specifiche desktop (Electron)]

## Estensione mobile

Il modello di distribuzione condiviso è esteso alle piattaforme mobile Android e iOS, confezionate tramite Capacitor (WebView + plugin nativi), mantenendo condivisi logica applicativa, interfaccia React e componenti solids. [^src: raw/2026-06-01-integrazione-mobile.txt §6. Impatti sull'architettura]

Vedi [[confezionamento-mobile-capacitor]] e [[roadmap-mobile-soli-boy]].

## Concetti correlati
[[architettura-a-tre-livelli]]
[[confezionamento-mobile-capacitor]]

## Pagine collegate
[[electron]]
[[capacitor]]
