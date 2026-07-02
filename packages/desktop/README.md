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
npm run smoke              # build completo + smoke
xvfb-run -a npm run smoke:ci   # solo smoke (dopo build), per CI headless

# Packaging installer (locale, target host):
npm run dist               # tutti i target in electron-builder.yml
npm run dist:linux         # solo AppImage Linux, --publish never
npm run dist:linux:publish # AppImage + upload GitHub Releases (richiede GH_TOKEN)
```

## Release (GitHub Releases, tag `v*`)

Workflow: [`.github/workflows/release-desktop.yml`](../../.github/workflows/release-desktop.yml) (TSK-163).

| Trigger | Comportamento |
|---------|----------------|
| Push tag `v*` (es. `v0.4.0`) | Build Linux AppImage **unsigned**, pubblica su [GitHub Releases](https://github.com/soli92/soli-boy/releases) + `latest-linux.yml` per auto-update (ADR-008, solo Linux AppImage) |
| `workflow_dispatch` + `publish=false` | Dry-run: build + artifact CI, **nessuna** Release |
| PR / push `main` | Job `desktop-dist` in CI: build + smoke + AppImage come artifact (7 giorni), senza publish |

### Scaricare l'AppImage

1. Vai su **GitHub → Releases** del repo e apri l'ultimo tag `v*`.
2. Scarica `Soli-Boy-<version>-linux-x86_64.AppImage`.
3. Rendilo eseguibile e avvialo:

```bash
chmod +x Soli-Boy-0.4.0-linux-x86_64.AppImage
./Soli-Boy-0.4.0-linux-x86_64.AppImage
```

Su PR/main, l'artifact `soli-boy-desktop-linux` è disponibile nella run Actions del job **Desktop Linux AppImage**.

### Matrice target (Sprint 19)

| Piattaforma | CI / Release | Note |
|-------------|--------------|------|
| Linux AppImage | ✅ CI + tag `v*` | Unsigned; auto-update via `latest-linux.yml` |
| Linux deb | Locale (`npm run dist`) | `deb` non auto-updatable (ADR-008) |
| Windows NSIS | Locale | Runner Windows o macchina dev; signing opzionale |
| macOS dmg/zip | Locale | Richiede macOS; notarization = gate umano |

### Token per publish

`electron-builder` legge **`GH_TOKEN`**. Nel workflow release si usa `secrets.GITHUB_TOKEN` (scope repo, `contents: write`). Per publish da macchina locale:

```bash
export GH_TOKEN=<PAT con scope repo>
cd packages/desktop && npm run dist:linux:publish
```

Nessun secret obbligatorio per CI base (build + smoke + artifact unsigned).

## Code signing (prerequisito human — R.14)

Il primo release può uscire **unsigned** (installer funzionanti, warning Gatekeeper/SmartScreen su Win/macOS).
Vedi [ADR-007 §Code signing](../../design_&_architecture/decisions/ADR-007.md) per i segreti opzionali:
- macOS: `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`
- Windows: `CSC_LINK`, `CSC_KEY_PASSWORD`

electron-builder attiva la firma automaticamente quando i segreti sono presenti — nessuna
modifica architetturale.
