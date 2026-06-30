---
type: synthesis
sources: ["raw/2026-06-01-specifiche-funzionali.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [requisiti, rf, rnf, soli-boy]
---

# Requisiti funzionali e non funzionali di Soli-boy
> Consolidamento dei requisiti RF-01..RF-25 e RNF-01..RNF-08 per area e priorità.

## Contesto

I requisiti funzionali usano il prefisso RF e sono classificati per priorità Must (indispensabile al lancio), Should (atteso), Could (desiderabile). [^src: raw/2026-06-01-specifiche-funzionali.txt §3. Requisiti funzionali]

## Requisiti funzionali per area

### Gestione dei file di gioco (RF-01..RF-06)
Caricamento ROM via file picker o drag & drop (RF-01, Must), riconoscimento automatico della piattaforma (RF-02, Must), caricamento BIOS per le piattaforme che lo richiedono (RF-03, Must), memorizzazione locale e ripresentazione nella libreria (RF-04, Should), rimozione ROM (RF-05, Should), nessuna distribuzione di ROM/BIOS protetti (RF-06, Must). [^src: raw/2026-06-01-specifiche-funzionali.txt §3.1 Gestione dei file di gioco]

### Libreria di gioco (RF-07..RF-09)
Griglia con titolo e piattaforma (RF-07, Must), filtro/ricerca per nome e piattaforma (RF-08, Should), anteprima/copertina (RF-09, Could). [^src: raw/2026-06-01-specifiche-funzionali.txt §3.2 Libreria di gioco]

### Esecuzione e controlli (RF-10..RF-15)
Avvio emulazione con core appropriato (RF-10, Must), pausa/ripresa/arresto (RF-11, Must), input tastiera e gamepad via Gamepad API (RF-12, Must), rimappatura e profili comandi (RF-13, Should), fast-forward e rewind dove supportato (RF-14, Should), audio con volume e mute (RF-15, Must). [^src: raw/2026-06-01-specifiche-funzionali.txt §3.3 Esecuzione e controlli]

### Salvataggi (RF-16..RF-19)
Save state multipli e ripristino (RF-16, Must), persistenza SRAM in-game (RF-17, Must), salvataggi locali associati al gioco (RF-18, Must), export/import salvataggi (RF-19, Should). [^src: raw/2026-06-01-specifiche-funzionali.txt §3.4 Salvataggi]

### Resa video (RF-20..RF-22)
Modalità schermo intero (RF-20, Must), fattore di scala e aspect ratio (RF-21, Should), filtri/shader di base (RF-22, Could). [^src: raw/2026-06-01-specifiche-funzionali.txt §3.5 Resa video]

### Funzionalità desktop Electron (RF-23..RF-25)
Accesso filesystem nativo (RF-23, Must), core inclusi localmente per uso offline (RF-24, Must), aggiornamento automatico (RF-25, Should). [^src: raw/2026-06-01-specifiche-funzionali.txt §3.6 Funzionalità specifiche desktop (Electron)]

## Requisiti non funzionali (RNF-01..RNF-08)

Prestazioni a velocità nativa 60 fps su hardware desktop medio (RNF-01), compatibilità con browser desktop moderni (RNF-02), portabilità con codebase condivisa e pacchetti Win/macOS/Linux (RNF-03), usabilità conforme al design system e accessibile da tastiera (RNF-04), sicurezza con core isolato e nessun invio file a server esterni (RNF-05), privacy con dati e salvataggi solo on-device (RNF-06), vincolo legale di non distribuzione di contenuti protetti con avviso esplicito (RNF-07), manutenibilità con architettura modulare (RNF-08). [^src: raw/2026-06-01-specifiche-funzionali.txt §4. Requisiti non funzionali]

## Requisiti mobile (estensione)

Le versioni mobile aggiungono requisiti RFM/RNFM specifici; i requisiti di base elencati sopra restano validi anche su mobile. Vedi [[requisiti-mobile-soli-boy]].

## Pagine collegate
[[save-state-e-sram]]
[[libreria-di-gioco]]
[[vincoli-legali-rom-bios]]
[[requisiti-mobile-soli-boy]]
[[2026-06-01-specifiche-funzionali]]

## Storie collegate
<!-- Sezione gestita dal product-manager — non modificare se sei wiki-keeper -->
- EP-019 Modifica data e ora dell'orologio interno dell'emulatore (RTC) — `management/kanban/EP-019-rtc-orologio-interno/`
  - US-065 Impostare data e ora dell'orologio interno dal Settings
  - US-066 Persistenza locale dello stato dell'orologio interno
  - US-067 Stato dell'orologio interno incluso nei save state
  - US-068 Riallineamento dell'orologio interno all'orologio del dispositivo
