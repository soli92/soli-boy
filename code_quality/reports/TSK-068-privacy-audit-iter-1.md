# TSK-068 — Privacy Audit: invariante on-device

**Audit date:** 2026-06-09  
**Auditor:** qa-dev (agent, soli-boy factory)  
**Scope:** packages/app/src + packages/desktop/electron  
**US:** US-033 §Acceptance Criteria  
**ADR:** ADR-002 §Invariante  
**Verdict:** INVARIANTE ON-DEVICE **RISPETTATA**

---

## Metodologia

Audit statico condotto tramite grep sistematico sul codice sorgente di produzione
(esclusi file `*.test.ts`, `*.spec.ts`, `*.test.tsx`). Pattern cercati:

- `fetch(` — chiamate `window.fetch` o `net.fetch`
- `new XMLHttpRequest(` — XHR diretto
- `axios` — client HTTP axios
- `navigator.sendBeacon(` — beacon API
- `new WebSocket(` — WebSocket
- URL `http://` e `https://` hardcodati
- `ipcRenderer` (solo nel preload — verificato isolamento renderer)
- Dynamic import con URL esterni (`import("http...`)

---

## Risultati per modulo

### 1. packages/app/src — renderer / dominio / componenti

| Occorrenza | File | Riga | Tipo | Classificazione |
|---|---|---|---|---|
| _nessuna_ | — | — | fetch / XHR / WS / sendBeacon / axios | — |

**Risultato:** ZERO occorrenze di chiamate di rete nel codice renderer di produzione.

Verifica dettagliata:
- `src/storage/native-fs-adapter.ts`: nessuna chiamata di rete. Commento esplicito riga 57: "nessun fetch/XHR/WebSocket". Usa SOLO il bridge IPC iniettato (`NativeFsBridge`).
- `src/storage/indexeddb-adapter.ts` / `src/storage/db.ts`: usa IndexedDB (API locale). Commento riga 99 in db.ts ribadisce invariante privacy.
- `src/storage/select-adapter.ts`: factory di selezione adapter — nessun I/O.
- `src/core/wasmboy-engine.ts`: carica il WASM di WasmBoy tramite import ESM staticamente incluso nel bundle (package NPM `wasmboy`). `WasmBoy.config()` e `WasmBoy.loadROM()` operano su ArrayBuffer in-memory. Nessun fetch, nessun URL esterno.
- `src/core/mgba-engine.ts`: carica mGBA tramite `import("@thenick775/mgba-wasm")` — import dinamico risolto a build-time da Vite (bundle locale). Nessun URL remoto.
- `src/components/FileLoader/useCapacitorFilePicker.ts`: usa `@capacitor/filesystem` per leggere file URI locali (IPC nativo). Commento riga 18 esplicito. Zero fetch.
- `src/components/Library/Library.tsx`: commento riga 6 esplicito. Zero fetch.
- `index.html`: nessun `<script src="...">` verso CDN esterni, nessun `<link rel="preload">` verso origini remote.

### 2. packages/desktop/electron/main.ts — main process Electron

| Occorrenza | File | Riga | Tipo | Classificazione | Giudizio |
|---|---|---|---|---|---|
| `net.fetch(pathToFileURL(target).toString())` | main.ts | 72 | `net.fetch` Electron | Serve asset statici dal bundle locale via protocollo `app://` | **LEGITTIMA** |
| `const DEV_URL = process.env.SOLIBOY_DEV_URL` | main.ts | 22 | commento URL localhost | Solo in development (Vite dev server, `localhost:5173`) | **LEGITTIMA (dev-only)** |

**Analisi `net.fetch` riga 72:**
```ts
const res = await net.fetch(pathToFileURL(target).toString());
```
- Contesto: handler del protocollo custom `app://` (`registerAppProtocol()`).
- `pathToFileURL(target)` converte un path POSIX/Windows assoluto in un URL `file://...` locale.
- `target` è costruito da `path.join(RENDERER_DIR, relative)` dove `RENDERER_DIR` è il `dist/` del renderer o `resourcesPath` nella build packaged — entrambi locali al dispositivo.
- Guard anti path-traversal: `if (!target.startsWith(RENDERER_DIR))` blocca qualsiasi URL fuori dalla dir.
- `net.fetch` di Electron non usa la rete TCP: serve il file dal filesystem locale tramite il modulo Node nativo.
- **Conclusione:** questa chiamata non invia dati utente (ROM, save, config) su rete. Serve solo asset statici del renderer (JS/CSS/WASM del bundle). Legittima e confinata al main process.

**Analisi `autoUpdater` (electron-updater):**
- `main.ts` riga 296-307: `autoUpdater.checkForUpdates()` — si collega a GitHub Releases (`electron-builder.yml: provider: github`) per verificare disponibilità aggiornamenti.
- Questa è l'**UNICA** chiamata di rete remota nell'intera codebase.
- Trasmette: versione app corrente, OS/arch. **NON** trasmette ROM, save state, config, BIOS, dati utente.
- Guardia: `if (!app.isPackaged) return;` — disabilitato in development.
- Classificazione: **LEGITTIMA** per l'invariante US-033 (la US parla di "file utente e salvataggi", non di update check). Il commento in main.ts e ADR-008 documentano esplicitamente questo canale.

### 3. packages/desktop/electron/preload.ts — preload script

| Occorrenza | File | Riga | Tipo | Classificazione |
|---|---|---|---|---|
| `ipcRenderer.invoke(...)` | preload.ts | 26–67 | IPC locale | LEGITTIMA: comunicazione renderer↔main process (canale Electron locale, non rete TCP) |

`ipcRenderer` è il bus IPC **locale** di Electron (comunicazione intra-processo via `contextBridge`): non è una chiamata di rete, non usa socket TCP/UDP, non esfiltrano dati fuori dal dispositivo.

---

## Verifica NativeFsAdapter (TSK-054, scope dell'audit)

- `NativeFsAdapter` usa SOLO il bridge IPC `NativeFsBridge` (iniettato, interfaccia locale).
- I metodi del bridge (`readFile`, `writeFile`, `unlink`, `mkdir`, ecc.) si mappano su `ipcRenderer.invoke("fs:*")` che attivano handler `ipcMain.handle("fs:*")` nel main process — tutto locale al dispositivo.
- Guard `guardPath` / `guardExistingPath` nel main process confinano i path a `~/.soli-boy/`.
- Nessun URL remoto nei path IPC.
- Test di privacy già presenti: `native-fs-adapter.test.ts §"privacy on-device (US-033)"` + `electron-storage-ipc.test.ts` (TSK-058) stubba `globalThis.fetch` e verifica 0 invocazioni.

---

## Verifica core WASM (WasmBoy, mGBA)

- WasmBoy: importato come ESM package NPM, WASM incluso nel bundle Vite. Nessun fetch esterno a runtime.
- mGBA: `import("@thenick775/mgba-wasm")` — dynamic import risolto da Vite a build-time (bundle locale). Nessun URL remoto.
- EmulatorJS: non utilizzato in produzione (ADR-005 §Decisione, gap `emulatorjs-real-integration`). L'engine non è attivo.

---

## Verifica Capacitor (target mobile)

- `@capacitor/filesystem.readFile` legge da URI locali (`file://`, `content://`). IPC nativo locale, nessuna rete.
- `@capacitor/haptics`: solo vibrazione locale.
- Nessun plugin Capacitor che esegua fetch remoti nei flussi di storage.

---

## Verifica statica automatizzata (comando ripetibile)

```bash
# Esegui dall'interno di packages/app e packages/desktop per riprodurre l'audit:
grep -rn "fetch(\|XMLHttpRequest\|axios\|sendBeacon\|new WebSocket(" \
  packages/app/src packages/desktop/electron \
  --include="*.ts" --include="*.tsx" | grep -v "\.test\."
# Output atteso: solo main.ts:72 (net.fetch locale) e commenti nei test file
```

---

## Test e2e (Playwright)

Il file `packages/app/e2e/privacy-audit.e2e.ts` implementa la verifica runtime:
- Intercetta tutte le richieste HTTP/HTTPS durante il flusso carica-ROM → avvia-emulazione → salva-stato.
- Asserisce `0 richieste verso origini != localhost/127.0.0.1`.
- Include un guard esplicito sul WASM (verifica assenza di network request durante il load del core emulatore).

---

## Verdict

**INVARIANTE ON-DEVICE RISPETTATA.**

| Dominio | Verdict | Note |
|---|---|---|
| Storage (ROM, save, config, SRAM) | PASS | Zero rete. Solo IPC locale (IndexedDB o NativeFsAdapter). |
| Core WASM (WasmBoy, mGBA) | PASS | Bundle Vite locale. Zero fetch a runtime. |
| Capacitor (mobile) | PASS | IPC nativo locale. Zero rete. |
| Electron main process | PASS (con nota) | `net.fetch` = file locale. Auto-updater = solo version check, nessun dato utente. |
| EmulatorJS | N/A | Non attivo in produzione (ADR-005). |

**Unica chiamata di rete remota trovata:** `autoUpdater.checkForUpdates()` in
`packages/desktop/electron/main.ts` → classficata LEGITTIMA (non coinvolge dati
utente; documentata in ADR-008; disabilitata in dev e in web/mobile target).

---

## Gap / Follow-up

Nessuna violazione trovata. Nessun gap aperto da questo audit.

Per il target Electron, l'`autoUpdater` è l'unico canale remoto: se in futuro
si volesse estendere l'invariante anche agli update check (privacy massima),
un flag `privacy-mode: no-network` potrebbe disabilitare anche questo canale.
Non è richiesto da US-033.
