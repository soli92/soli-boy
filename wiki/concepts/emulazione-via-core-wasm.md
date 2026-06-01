---
type: concept
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [emulazione, wasm, libretro]
---

# Emulazione via core WASM
> L'emulazione è delegata a core maturi compilati in WebAssembly, non a core proprietari.

## Contesto

L'emulazione è delegata a core maturi compilati in WebAssembly, mentre l'interfaccia utente fornisce libreria, controlli di esecuzione, gestione salvataggi e configurazione comandi. [^src: raw/2026-06-01-specifiche-funzionali.txt §1.2 Descrizione generale]

## Dettaglio

La scelta di riusare motori di emulazione consolidati invece di svilupparne di proprietari serve a disporre rapidamente di un prodotto funzionante e affidabile, in linea con l'obiettivo di velocità di realizzazione. [^src: raw/2026-06-01-specifiche-funzionali.txt §1.2 Descrizione generale]

Un *core* è il motore di emulazione di una specifica piattaforma (es. mGBA, Gambatte, FBNeo). [^src: raw/2026-06-01-specifiche-funzionali.txt §1.4 Definizioni e acronimi]

WASM (WebAssembly) è il formato binario eseguibile ad alte prestazioni nel browser su cui i core sono compilati. [^src: raw/2026-06-01-specifiche-funzionali.txt §1.4 Definizioni e acronimi]

Vincolo tecnico: per i core WASM con threading è richiesta la configurazione degli header Cross-Origin (COOP/COEP) sul server web. [^src: raw/2026-06-01-specifiche-funzionali.txt §7.2 Vincoli tecnici]

## Concetti correlati
[[piattaforme-e-core-supportati]]
[[architettura-a-tre-livelli]]

## Pagine collegate
[[emulatorjs]]
