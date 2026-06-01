---
type: concept
sources: ["raw/2026-06-01-integrazione-mobile.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [mobile, capacitor, react-native, packaging]
---

# Confezionamento mobile (Capacitor vs React Native)
> Due strategie per il packaging mobile; Capacitor è consigliato per massimizzare il riuso della codebase.

## Contesto

Per il confezionamento mobile si valutano due strategie principali, scelte per massimizzare il riuso della codebase esistente (React + TypeScript + solids) e la velocità di sviluppo. [^src: raw/2026-06-01-integrazione-mobile.txt §3. Approccio tecnologico]

## Opzione A — Capacitor (consigliata)

Capacitor incapsula la SPA web in un contenitore nativo Android/iOS con accesso al filesystem nativo per ROM, BIOS e salvataggi tramite plugin, e un'unica logica applicativa condivisa tra web, desktop ed mobile. [^src: raw/2026-06-01-integrazione-mobile.txt §3.1 Opzione A — Capacitor (consigliata)]

## Opzione B — React Native (sconsigliata in prima battuta)

Una riscrittura dell'interfaccia in React Native offrirebbe maggiore integrazione nativa ma comporterebbe la perdita del riuso diretto dei componenti web solids e tempi più lunghi, ed è sconsigliata in prima battuta data la priorità sulla velocità. [^src: raw/2026-06-01-integrazione-mobile.txt §3.2 Opzione B — React Native]

## Concetti correlati
[[distribuzione-web-e-desktop]]
[[emulazione-su-mobile]]

## Pagine collegate
[[capacitor]]
[[solids]]
