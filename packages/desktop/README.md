# @soli-boy/desktop — shell Electron (ADR-007)

Contenitore desktop di Soli-boy. Il **renderer è la SPA esistente** (`@soli-boy/app`):
nessuna modifica al bundler Vite, la `dist/` web è riusata 1:1 (ADR-007).

## Architettura

- `electron/main.ts` — processo main: `BrowserWindow`, custom protocol `app://`
  (serve `dist/` con header COOP/COEP per i core WASM threaded), canali IPC del
  filesystem nativo, integrazione `electron-updater` (ADR-008).
- `electron/preload.ts` — `contextBridge` che espone `window.soliboyDesktop`
  (whitelist IPC) al renderer. `contextIsolation: true`, `nodeIntegration: false`.
- `electron-builder.yml` — packaging Win (NSIS) / macOS (dmg+zip) / Linux (AppImage+deb),
  publish su GitHub Releases.

### API IPC esposte (consumate da NativeFsAdapter, TSK-054)

| Metodo (`window.soliboyDesktop`) | Canale IPC | Descrizione |
|---|---|---|
| `readFile(path)` | `fs:readFile` | legge un file → `Uint8Array` |
| `writeFile(path, data)` | `fs:writeFile` | scrive un file |
| `showOpenDialog(opts)` | `fs:showOpenDialog` | dialog nativo apertura → `string[]` |
| `showSaveDialog(opts)` | `fs:showSaveDialog` | dialog nativo salvataggio → `string \| undefined` |
| `onUpdateEvent(cb)` | `update:event` | eventi auto-update (ADR-008) |

## Comandi

```bash
# Dev: avvia Vite (in packages/app) su :5173, poi in un altro terminale:
npm --prefix ../app run dev
npm run electron:dev        # compila main/preload e apre la finestra su localhost:5173

# Avvio da build statica (compila renderer + main, carica via app://):
npm run electron:start

# Smoke test (avvio → ready-to-show → quit, exit 0): usato per verifica non-interattiva
npm run smoke

# Packaging installer (locale, target host):
npm run dist
```

## Code signing (prerequisito human — R.14)

Il primo release può uscire **unsigned** (installer funzionanti, warning Gatekeeper/SmartScreen).
Per firmare servono segreti GitHub Actions (vedi ADR-007 §Code signing):
- macOS: `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`
- Windows: `CSC_LINK`, `CSC_KEY_PASSWORD`

electron-builder attiva la firma automaticamente quando i segreti sono presenti — nessuna
modifica architetturale.
