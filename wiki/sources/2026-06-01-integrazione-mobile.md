---
type: source
sources: ["raw/2026-06-01-integrazione-mobile.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [mobile, android, ios, capacitor, soli-boy]
---

# Integrazione Mobile Soli-boy v1.0
> Documento funzionale integrativo che estende le specifiche base alle piattaforme mobile Android e iOS.

## Contesto

Il documento integra le Specifiche Funzionali di Soli-boy v1.0 estendendo l'ambito del prodotto alle piattaforme mobile: oltre a web e desktop, il prodotto dovrà essere disponibile come applicazione mobile nativa su Android e iOS. [^src: raw/2026-06-01-integrazione-mobile.txt §1. Scopo dell'integrazione]

L'obiettivo è offrire la medesima esperienza di emulazione adattata ai dispositivi touch, mantenendo coerenza funzionale e visiva con le altre versioni grazie al design system solids. [^src: raw/2026-06-01-integrazione-mobile.txt §1. Scopo dell'integrazione]

## Nota terminologica (decisione di prodotto)

La richiesta originaria citava "Android e macOS"; poiché macOS è un sistema desktop, il documento interpreta le piattaforme mobile come Android e iOS, mentre un eventuale target macOS rientra nella distribuzione desktop Electron già descritta. [^src: raw/2026-06-01-integrazione-mobile.txt §1. Scopo dell'integrazione]

> Decisione da validare con lo stakeholder: la reinterpretazione "Android/macOS" → "Android/iOS" è assunta dal documento integrativo, non confermata dalla richiesta originaria.

## Piattaforme target

I target mobile sono Android (distribuzione Google Play Store / APK) e iOS (Apple App Store, iPhone ed eventualmente iPad); desktop e web restano coperti dalle specifiche di base. Le versioni mobile sono considerate prioritarie al pari della versione desktop. [^src: raw/2026-06-01-integrazione-mobile.txt §2. Piattaforme target]

## Oggetti estratti (indice)

Concetti: [[confezionamento-mobile-capacitor]] · [[controlli-touch]] · [[emulazione-su-mobile]]
Entità: [[capacitor]]
Sintesi: [[requisiti-mobile-soli-boy]] · [[roadmap-mobile-soli-boy]]

## Pagine collegate
[[2026-06-01-specifiche-funzionali]]
[[distribuzione-web-e-desktop]]

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
- EP-007 Esperienza mobile — `management/kanban/EP-007-esperienza-mobile/`
- EP-008 Conformità e pubblicazione store — `management/kanban/EP-008-conformita-e-pubblicazione-store/`
