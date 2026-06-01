---
id: emulatorjs-hosting
type: runbook
title: "Hosting EmulatorJS — core, pathtodata, COOP/COEP"
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [runbook, emulatorjs, hosting, wasm]
---

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
