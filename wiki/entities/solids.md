---
type: entity
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [design-system, solids, ui]
---

# solids (soli92/solids)
> Design system aziendale e fonte unica di verità per l'aspetto e il comportamento dei componenti visivi dell'applicazione.

## Contesto

L'interfaccia utente è costruita sopra il design system solids (repository soli92/solids, v1.14.1), che costituisce la fonte unica di verità per l'aspetto e il comportamento dei componenti visivi. [^src: raw/2026-06-01-specifiche-funzionali.txt §5.2 Design system: solids (soli92/solids)]

## Dettaglio

La versione di riferimento per il progetto è la v1.14.1, rilasciata il 29 aprile 2026, distribuita tramite il repository soli92/solids (https://github.com/soli92/solids). [^src: raw/2026-06-01-specifiche-funzionali.txt §5.2 Design system: solids (soli92/solids)]

Gli ambiti di utilizzo sono i componenti UI (pulsanti, campi, menu, modali, schede, griglie), i design token (colori, tipografia, spaziature, raggi), i temi chiaro/scuro, i pattern di accessibilità e la coerenza cross-platform tra web ed Electron. [^src: raw/2026-06-01-specifiche-funzionali.txt §5.2 Design system: solids (soli92/solids)]

Le linee guida di integrazione prevedono installazione come dipendenza, importazione di token/stili all'entry point, wrapping dell'albero React con l'eventuale provider di tema, uso esclusivo di componenti e token del sistema ed estensione tramite componenti compositi senza alterare i token di base. [^src: raw/2026-06-01-specifiche-funzionali.txt §5.3 Linee guida di integrazione del design system]

L'adozione del design system supporta il requisito di usabilità RNF-04 (interfaccia accessibile da tastiera, conforme al design system aziendale). [^src: raw/2026-06-01-specifiche-funzionali.txt §4. Requisiti non funzionali]

## Concetti correlati
[[libreria-di-gioco]]

## Pagine collegate
[[stack-tecnologico-soli-boy]]
