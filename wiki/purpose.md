---
type: purpose
domain: "Emulatore multipiattaforma per console handheld e arcade (Game Boy/GBC, GBA, arcade) distribuito come SPA web + shell desktop Electron + estensione mobile Capacitor; persistenza 100% on-device e nessun contenuto protetto distribuito."
priority_entity_types: [piattaforma-e-core, motore-di-emulazione, componente-tecnologico, schermata-ui, requisito-funzionale, decisione-architetturale, vincolo-legale]
tone: technical-prescriptive
exclusions: [rom-bios-giochi-protetti, credenziali-e-segreti, roadmap-commerciale-marketing, internals-core-di-terze-parti]
---

# Purpose

Questa wiki documenta **soli-boy**: un emulatore multipiattaforma per console handheld e
arcade, con architettura a tre livelli (UI / emulazione / persistenza) e distribuzione
tripla — SPA web, shell desktop Electron, estensione mobile via Capacitor. [^src: wiki/index.md §Dominio progetto] [^src: wiki/concepts/architettura-a-tre-livelli.md]

È la knowledge base di un **prodotto applicativo**, non del meta-framework factory che lo
genera. Alcune pagine descrivono comunque capability del framework (es.
`factory-compression-layer`): sono documentazione di infrastruttura, non dominio di prodotto,
e vanno tenute distinte semanticamente dal dominio emulatore.

## Cosa privilegiare nell'ingest

In ordine di priorità semantica:

1. **Piattaforma-e-core** — quali sistemi sono emulati e con quale core: Game Boy / GBC e
   Game Boy Advance sono i target al lancio; l'arcade (FBNeo/MAME) è dichiarato ma rinviato a
   epica dedicata. Il mapping piattaforma → motore è conoscenza centrale. [^src: wiki/concepts/piattaforme-e-core-supportati.md]
2. **Motore-di-emulazione** — gli engine reali dietro il registro multi-engine (WasmBoy per
   GB/GBC, mGBA per GBA); le loro capacità, i loro limiti e i bridge (es. RTC) verso il core.
3. **Componente-tecnologico** — i mattoni concreti dello stack: EmulatorJS, Electron,
   IndexedDB, Capacitor, il design system SoliDS. [^src: wiki/index.md §Entities]
4. **Schermata-ui** — i mockup e le schermate reali (Library, Player, Settings) con i loro
   stati e vincoli di accessibilità.
5. **Requisito-funzionale** — RF-01..RF-25 e RNF-01..RNF-08 (e le estensioni mobile RFM/RNFM):
   sono il contratto di prodotto e vanno documentati come tali. [^src: wiki/syntheses/requisiti-funzionali-soli-boy.md]
6. **Decisione-architetturale** — gli ADR (registro multi-engine, packaging Electron,
   auto-update, RTC) con contesto e trade-off.
7. **Vincolo-legale** — la non-distribuzione di contenuti protetti è un invariante di
   prodotto, non un dettaglio.

## Tono

**Technical-prescriptive**: normativo e imperativo, karpathy-style. La documentazione dice
*cosa deve valere* (requisiti Must/Should/Could, vincoli legali, gate di persistenza), non
racconta una storia. Preferire tabelle piattaforma↔core, contratti di requisito e
riferimenti incrociati `[[wikilink]]` alla prosa. Ogni claim non banale cita la fonte
(`[^src: ...]`).

## Esclusioni

Fuori scope semantico e mai da introdurre in `wiki/`:

- **ROM / BIOS / giochi protetti da copyright**: l'app esegue solo file forniti dall'utente
  e non distribuisce né linka contenuti protetti (RF-06 Must, RNF legale, avviso esplicito in
  UI). Nessun riferimento a fonti di ROM protette. [^src: wiki/concepts/vincoli-legali-rom-bios.md] [^src: wiki/syntheses/requisiti-funzionali-soli-boy.md §Gestione dei file di gioco (RF-01..RF-06)]
- **Credenziali e segreti** (token di deploy Vercel/GitHub, chiavi di firma): sono
  configurazione operativa, non conoscenza.
- **Roadmap commerciale / marketing**: la wiki documenta il *cosa* e il *come* tecnico, non
  posizionamento o vendita.
- **Internals dei core di terze parti** (WasmBoy, mGBA, EmulatorJS) oltre l'interfaccia di
  integrazione: si documenta come li si usa e i loro limiti osservati, non la loro
  implementazione interna.

## Note per gli agenti

- **Dominio emulatore ≠ layer factory**: quando una pagina tocca il meta-framework
  (compression, graphify, capability importate), etichettarla come infrastruttura ed evitare
  di confonderla con il dominio di prodotto.
- **Privacy by design**: dati e salvataggi vivono solo on-device (IndexedDB); nessun invio a
  server esterni è parte del dominio (RNF-05/RNF-06). [^src: wiki/syntheses/requisiti-funzionali-soli-boy.md §Requisiti non funzionali (RNF-01..RNF-08)]
- **Terminologia canonica**: «core» = core di emulazione (Libretro/WASM o engine ESM);
  «save state» = istantanea dell'emulatore; «SRAM» = salvataggio in-game persistente — sono
  concetti distinti, non sinonimi. [^src: wiki/concepts/save-state-e-sram.md]

[^src: wiki/index.md + wiki/syntheses/requisiti-funzionali-soli-boy.md + wiki/concepts/vincoli-legali-rom-bios.md + wiki/concepts/architettura-a-tre-livelli.md]
