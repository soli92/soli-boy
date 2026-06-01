---
type: synthesis
sources: ["raw/2026-06-01-integrazione-mobile.txt"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [requisiti, mobile, rfm, rnfm]
---

# Requisiti mobile di Soli-boy
> Requisiti aggiuntivi RFM/RNFM per le versioni Android e iOS; i requisiti di base RF-01..RF-25 restano validi.

## Contesto

I requisiti aggiuntivi sono identificati con prefisso RFM; i requisiti funzionali di base RF-01..RF-25 restano validi e si applicano anche al mobile, salvo gli adattamenti specifici. [^src: raw/2026-06-01-integrazione-mobile.txt §4. Requisiti funzionali mobile]

## Requisiti funzionali mobile (RFM-01..RFM-09)

Controlli touch su schermo con D-pad e pulsanti virtuali (RFM-01, Must), configurabili per posizione/dimensione/opacità (RFM-02, Should), supporto a controller fisici Bluetooth via Gamepad API (RFM-03, Should), caricamento ROM/BIOS dal file system del dispositivo e dai provider cloud di sistema (RFM-04, Must), interfaccia responsiva per orientamento verticale e orizzontale (RFM-05, Must), gestione di sospensione e ripresa con pausa in background (RFM-06, Must), persistenza locale di salvataggi e libreria (RFM-07, Must), feedback aptico opzionale (RFM-08, Could), rispetto delle aree sicure notch/barre di sistema (RFM-09, Must). [^src: raw/2026-06-01-integrazione-mobile.txt §4. Requisiti funzionali mobile]

## Requisiti non funzionali mobile (RNFM-01..RNFM-07)

Prestazioni fluide su dispositivi di fascia media (RNFM-01), compatibilità con le versioni di Android e iOS correntemente mantenute (RNFM-02), usabilità touch conforme a solids e alle convenzioni di piattaforma (RNFM-03), consumo energetico controllato con pausa automatica in background (RNFM-04), conformità ai requisiti di pubblicazione Google Play e Apple App Store (RNFM-05), privacy con dati e salvataggi solo on-device (RNFM-06), vincolo legale di non distribuzione di contenuti protetti con avviso esplicito (RNFM-07). [^src: raw/2026-06-01-integrazione-mobile.txt §5. Requisiti non funzionali mobile]

## Pagine collegate
[[requisiti-funzionali-soli-boy]]
[[controlli-touch]]
[[2026-06-01-integrazione-mobile]]
