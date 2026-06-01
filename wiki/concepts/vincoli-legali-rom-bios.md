---
type: concept
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [legale, copyright, rom, bios]
---

# Vincoli legali ROM e BIOS
> L'applicazione non distribuisce alcun contenuto protetto: esegue solo file forniti dall'utente.

## Contesto

L'applicazione non include, non distribuisce e non fornisce alcun collegamento a ROM o BIOS protetti da copyright. [^src: raw/2026-06-01-specifiche-funzionali.txt §7.1 Vincoli legali]

## Dettaglio

L'esecuzione avviene esclusivamente su file forniti dall'utente e l'interfaccia mostra un avviso esplicito in tal senso. [^src: raw/2026-06-01-specifiche-funzionali.txt §7.1 Vincoli legali]

Coerentemente, il requisito funzionale RF-06 stabilisce che il sistema non distribuisce né include alcuna ROM o BIOS protetti da copyright. [^src: raw/2026-06-01-specifiche-funzionali.txt §3.1 Gestione dei file di gioco]

Il requisito non funzionale legale ribadisce: nessuna distribuzione di contenuti protetti, con avviso esplicito nell'interfaccia. [^src: raw/2026-06-01-specifiche-funzionali.txt §4. Requisiti non funzionali]

Si assume che gli utenti dispongano legittimamente dei file di gioco che intendono eseguire; il BIOS GBA, ove necessario alla piena compatibilità, deve essere fornito dall'utente. [^src: raw/2026-06-01-specifiche-funzionali.txt §7.3 Assunzioni]

## Concetti correlati
[[piattaforme-e-core-supportati]]

## Pagine collegate
[[requisiti-funzionali-soli-boy]]
