---
type: gap
status: draft
created: 2026-06-01
updated: 2026-06-01
append_only: true
---

# Gaps — informazioni assenti in wiki/

File **append-only condiviso in scrittura** fra `wiki-keeper`, `product-manager`,
`lead-architect`, `tpm`, `wiki-query`. Canale formale del wiki feedback loop (vedi
`PATTERN.md §10`).

## Quando appendere

Quando un agente — durante una produzione qualsiasi — scopre che una conoscenza
necessaria **non è presente in `wiki/`** e non può essere inventata.

## Entries

_(nessun gap registrato al bootstrap)_

## 2026-06-01 19:50 — palette-brand-da-verificare
**Origine:** wiki-keeper @ ingest brand-kit (raw/soliboy-brand/)
**Gap:** la palette del brand kit deriva dal tema cyberpunk SoliDS e non è verificata sui brand asset ufficiali (`soli-icons`, pacchetto npm). Tonalità esatte da confermare.
**Sospetta fonte:** brand asset ufficiali Soli (`soli-icons`) — non ancora forniti in raw/.
**Impatto:** non-bloccante. Logo/icone usabili; allineare le tonalità (e l'export PNG con font reali) prima del rilascio brand-definitivo.

## 2026-06-01 20:10 — e2e-browser-runtime
**Origine:** qa-dev @ TSK-011/TSK-019
**Gap:** i test e2e sono implementati a livello di integrazione modulo (vitest+jsdom/node, engine fake). Manca un vero e2e browser con Playwright + EmulatorJS reale che esegua una ROM end-to-end.
**Sospetta fonte:** nessuna (richiede setup tooling: Playwright + harness EmulatorJS, fuori dal Core web MVP corrente).
**Impatto:** non-bloccante. Il flusso è coperto a livello logico; il browser-e2e è follow-up pre-release.
**Risolto:** 2026-06-01 — e2e Playwright (Chromium) in `packages/app/e2e/app.e2e.ts`: 4 spec verdi (avviso legale, carica→avvia→pausa, file non supportato, rimappatura). Engine = StubEngine. La validazione dell'emulazione *reale* (EmulatorJS WASM + ROM) è tracciata nel nuovo gap `emulatorjs-real-integration`.

## 2026-06-01 20:55 — emulatorjs-real-integration
**Origine:** qa-dev @ e2e setup (StubEngine)
**Gap:** l'app usa `StubEngine` (placeholder); manca l'adapter EmulatorJS reale (core Libretro WASM) che esegua davvero una ROM. L'e2e valida UI/flusso ma non l'emulazione effettiva.
**Sospetta fonte:** integrazione EmulatorJS (CDN/npm) + ROM di test legittima; richiede design dell'adapter `EmulatorEngine` reale.
**Impatto:** non-bloccante per l'UI del Core web MVP; bloccante per la giocabilità reale → prioritario nel prossimo ciclo dev.
**Aggiornamento 2026-06-01:** ROM libera ottenuta (dmg-acid2.gb, MIT) + e2e reale scaffoldato (opt-in SOLIBOY_E2E_REAL=1). Import/libreria/Player UI funzionano; **EmulatorJS reale NON inizializza in headless**: `EJS_ready` non emesso (timeout surfacato correttamente come errore). loader.js @4.2.1 raggiungibile (200). Tentativi senza effetto: COEP `credentialless`, `EJS_player` come selettore CSS. Causa non isolata → serve debug con console/network del browser e, probabilmente, **self-host dei core** (same-origin) anziché CDN. Gap RESTA APERTO.

**Aggiornamento 2026-06-01 (debug):** causa del CDN isolata = **ORB/COEP** blocca le sottorisorse interne di EmulatorJS (`emulator.min.js`, core). **Risolto** con **self-host same-origin**: `npm run setup:emu` copia `@emulatorjs/emulatorjs/data` + scarica `emulator.min.js` e `gambatte-wasm.data` in `public/emulatorjs/data/` (gitignorato); `EJS_pathtodata=/emulatorjs/data/`. Ora EmulatorJS **si inizializza completamente** (EJS_emulator + menu controlli + virtual gamepad). **Blocco residuo**: `EJS_Runtime is not defined!` + `Could not fetch core report JSON` → il **runtime del core WASM non si carica** (nessun canvas in headless). Lead: verificare decompressione/caricamento core (report JSON dei core, variante threads vs non-threads, possibile limite WebGL/WASM in Chromium headless); validare in browser **headed**. Gap RESTA APERTO (molto avanzato).

**Risolto 2026-06-01:** pivot a **WasmBoy** (ADR-005). Emulazione **GB/GBC reale** funzionante e verificata in e2e (`?engine=real` + `dmg-acid2.gb`, canvas reso, 5/5 e2e verdi). EmulatorJS abbandonato (gap superato). GBA tracciato in TSK-028; arcade in gap `arcade-emulation-engine`/EP-009.

## 2026-06-01 16:45 — design-system-real-package
**Origine:** fe-dev @ wiring stile app
**Gap:** l'app importa un tema SoliDS *approssimato* (vendorizzato dai mockup, `src/styles/solids-theme.css`) perché il pacchetto reale `@soli92/solids` non è disponibile/installato. Colori e alcune classi sono approssimati.
**Sospetta fonte:** pacchetto npm `@soli92/solids` (privato) — da fornire/installare.
**Impatto:** non-bloccante (UI ora leggibile/stilizzata); sostituire con `@import "@soli92/solids/css/index.css"` + rimuovere il tema approssimato quando il pacchetto è disponibile.


**Aggiornamento 2026-06-01 (debug 2):** confermato che fallisce **anche in browser headed** (utente): "Error loading EmulatorJS runtime" / `EJS_Runtime is not defined`. NON è né versione né headless. Provati senza successo: self-host npm+CDN, `EJS_threads=false`, core variante threaded e non-threaded, build **coerente** stable (`emulator.min.zip` esteso in `data/`), min vs non-min. Sintomo costante: "Could not fetch core report JSON" + il runtime del core non si estrae/definisce. Cause residue da indagare (sessione dedicata): caricamento/decompressione del core EmulatorJS (modulo `compression/` + endpoint cores report), MIME `application/wasm`, eventuale necessità di un manifest `cores`/`version` specifico, o quirk noto di self-host EJS (consultare doc/community EmulatorJS). Engine config (threads=false, startOnLoaded, selettore, pathtodata locale) lasciata come base. Gap RESTA APERTO.

## 2026-06-01 17:35 — arcade-emulation-engine
**Origine:** lead-architect @ ADR-005
**Gap:** FBNeo/MAME (arcade) non hanno una libreria ESM standalone (come WasmBoy per GB); girano via libretro (EmulatorJS/RetroArch). Decisione: **rinvio** a epica dedicata (EP-009); il registry instrada l'arcade a "non ancora supportato".
**Sospetta fonte:** percorso libretro/RetroArch web (umbrella) da valutare in EP-009.
**Impatto:** non-bloccante per GB/GBA; le specifiche elencano arcade al lancio → rischio di scope da concordare con owner.

## 2026-06-01 19:20 — gba-runtime-verification
**Origine:** be-dev @ TSK-028
**Gap:** MgbaEngine (GBA, @thenick775/mgba-wasm MPL-2.0) implementato contro l'API documentata e registrato (selectEngine mgba→MgbaEngine), build/typecheck verdi, ma NON verificato a runtime: manca una ROM GBA libera in public/test-roms/ per l'e2e (emulation-gba.e2e.ts, skip finché assente).
**Sospetta fonte:** ROM GBA homebrew/free (es. demo libere) da aggiungere + whitelist .gitignore.
**Impatto:** non-bloccante; GB già reale. GBA da validare quando si fornisce una ROM libera (l'e2e passerà da skip a verde).

**Risolto 2026-06-01:** ROM GBA libera ottenuta (gba-tests-thumb.gba, MIT, jsmolka/gba-tests). e2e reale verde: mGBA (MgbaEngine, ?engine=real) rende il canvas → **GBA reale verificato**. 6/6 e2e verdi (4 stub + GB WasmBoy + GBA mGBA).
