---
id: emulatorjs-hosting
type: runbook
title: "Hosting EmulatorJS — core, pathtodata, COOP/COEP"
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [runbook, emulatorjs, hosting, wasm]
---

> **STORICO / SUPERSEDED (2026-06-01):** EmulatorJS abbandonato — pivot a WasmBoy (ADR-005). Questo runbook resta come riferimento storico del tentativo self-host; non più in uso.

# Runbook — Hosting EmulatorJS

Procedura operativa a supporto di `design_&_architecture/decisions/ADR-004.md` (integrazione EmulatorJS reale).
Decisione: **CDN su web, self-host su desktop/mobile** (offline, RF-24).

## `EJS_pathtodata`

EmulatorJS carica loader + core WASM da `EJS_pathtodata`.

- **Web**: CDN EmulatorJS, es. `https://cdn.jsdelivr.net/npm/@emulatorjs/emulatorjs@<ver>/data/`.
  Pinnare una versione esatta (no `latest`) per riproducibilità.
- **Desktop (Electron) / Mobile (Capacitor)**: core **vendati localmente** (copiati negli
  asset dell'app al build) e `EJS_pathtodata` puntato al path locale → funzionamento offline.

## Header Cross-Origin (COOP/COEP)

I core con threading (SharedArrayBuffer) richiedono un contesto cross-origin isolated:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

- **Dev (Vite)**: impostare gli header nel dev server (`server.headers`) per testare i core threaded.
- **Prod web**: configurare gli header sul server/CDN che serve l'app.
- **Electron/Capacitor**: contesto locale; verificare comunque l'isolamento per i core threaded.

## Mapping piattaforma → core EmulatorJS

| Piattaforma | `EJS_core` |
|---|---|
| GB / GBC | `gambatte` |
| GBA | `mgba` |
| Arcade | `fbneo` (o `mame2003_plus`) |

(Allineato a [[piattaforme-e-core-supportati]] e a `api_specs/core-wrapper.md`.)

## Avvio di un gioco (flusso adapter)

1. Risolvi `{platform, core}` dal file (PlatformRecognition).
2. Crea un Object URL dal blob ROM → `EJS_gameUrl`.
3. Configura le globali `EJS_*` (`EJS_player`, `EJS_core`, `EJS_pathtodata`, `EJS_startOnLoaded`).
4. Inietta il loader EmulatorJS (lazy, una volta).
5. Al teardown (`stop`): distruggi l'istanza e **revoke** dell'Object URL (no memory leak).

## Vincoli

- Nessun core/ROM protetto incluso o distribuito (vincolo legale; ROM e2e = homebrew libere).
- iOS: limiti WASM/JIT da validare (US-035, [[emulazione-su-mobile]]).

## Smoke test

- Web dev: `npm run dev` con header COOP/COEP → caricare una ROM homebrew → verificare avvio, audio, pausa.
- e2e: spec dedicata con ROM homebrew (chiude il gap `emulatorjs-real-integration`).

## Stato (TSK-023)

- **Dev/preview Vite**: header COOP/COEP configurati in `packages/app/vite.config.ts`
  (`Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`)
  → SharedArrayBuffer disponibile. e2e verdi con isolation attiva.
- **CDN web**: `EJS_pathtodata` pinnato a `@emulatorjs/emulatorjs@4.2.1` in `EmulatorJsEngine`.
- **Produzione (Vercel)**: header COOP/COEP in `packages/app/vercel.json` (tutte le route).
- **Residui (deferred)**:
  crossorigin/self-host delle sottorisorse CDN (font/icone) sotto COEP; **vendoring** core
  per build **desktop (Electron)/mobile (Capacitor)** offline (RF-24) — quando quei target
  esisteranno (EP-006/007). Da validare con il provider scelto.

## Self-host (TSK-024 / debug 2026-06-01)

Il CDN sotto cross-origin isolation è bloccato da ORB/COEP. Soluzione: self-host same-origin.
- `npm run setup:emu` (`scripts/setup-emulatorjs.mjs`): copia il pacchetto npm `@emulatorjs/emulatorjs/data`
  + scarica `emulator.min.js` e i core (es. `gambatte-wasm.data`) da `cdn.emulatorjs.org/stable`
  in `public/emulatorjs/data/` (gitignorato, rigenerabile).
- `EJS_pathtodata = /emulatorjs/data/` (default di `EmulatorJsEngine`).
- Residuo noto: `EJS_Runtime is not defined` (runtime core non caricato in headless) — vedi gap.
