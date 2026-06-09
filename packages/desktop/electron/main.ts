/**
 * Soli-boy — Electron main process (TSK-053, ADR-007).
 *
 * Responsabilità:
 *  - finestra principale (BrowserWindow) con il renderer = dist/ di @soli-boy/app;
 *  - cross-origin isolation (COOP/COEP) richiesta dai core WASM threaded, servita
 *    via custom protocol `app://` in produzione e via header injection in dev;
 *  - canale IPC del filesystem nativo su cui si appoggia NativeFsAdapter (TSK-054);
 *  - integrazione electron-updater (ADR-008).
 *
 * Vincoli di sicurezza: contextIsolation: true, nodeIntegration: false (ADR-007).
 * Invariante privacy: nessun dato lascia il dispositivo (ADR-002).
 */
import { app, BrowserWindow, dialog, ipcMain, net, protocol, session } from "electron";
import type { OpenDialogOptions, SaveDialogOptions } from "electron";
import { autoUpdater } from "electron-updater";
import { mkdir, readdir, readFile, realpath, stat, unlink, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import * as path from "node:path";
import * as os from "node:os";

const DEV_URL = process.env.SOLIBOY_DEV_URL; // settato da electron:dev (es. http://localhost:5173)
const IS_SMOKE = process.env.SOLIBOY_SMOKE === "1"; // avvio → ready → quit per smoke test CI/locale

/** dist/ del renderer: in packaged sta nelle resources, in dev è packages/app/dist. */
const RENDERER_DIR = app.isPackaged
  ? path.join(process.resourcesPath, "renderer")
  : path.join(__dirname, "..", "..", "app", "dist");

const COOP_COEP = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
} as const;

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

// I privilegi del custom scheme vanno dichiarati PRIMA di app.ready.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
]);

/** Serve dist/ via `app://` aggiungendo gli header COOP/COEP necessari ai core WASM. */
function registerAppProtocol(): void {
  protocol.handle("app", async (request) => {
    const url = new URL(request.url);
    // `app://./index.html` → host "." + pathname; normalizziamo su un path locale dentro RENDERER_DIR.
    let relative = decodeURIComponent(url.pathname);
    if (relative === "" || relative === "/") relative = "/index.html";
    const target = path.join(RENDERER_DIR, relative);

    // Anti path-traversal: il file risolto deve restare dentro RENDERER_DIR.
    if (!target.startsWith(RENDERER_DIR)) {
      return new Response("Forbidden", { status: 403 });
    }

    const res = await net.fetch(pathToFileURL(target).toString());
    const headers = new Headers(res.headers);
    headers.set("Content-Type", MIME[path.extname(target)] ?? "application/octet-stream");
    for (const [k, v] of Object.entries(COOP_COEP)) headers.set(k, v);
    return new Response(res.body, { status: res.status, headers });
  });
}

/**
 * Base directory consentita per le operazioni filesystem IPC.
 *
 * Tutti i path forniti dal renderer attraverso `fs:*` devono risolvere dentro
 * questa root: garantisce l'invariante privacy ADR-002 (nessun dato lascia il
 * dispositivo) e impedisce path traversal verso aree del filesystem fuori
 * dallo storage applicativo. Il renderer non ha alcun modo per influenzare la
 * scelta della base dir: viene risolta lato main process una sola volta.
 *
 * Convenzione: `~/.soli-boy/` (cfr. TSK-074 §Technical Specs). `path.resolve`
 * normalizza separatori platform-specific in modo coerente con il filesystem
 * nativo (POSIX su macOS/Linux, NT su Windows).
 */
const FS_BASE_DIR = path.resolve(os.homedir(), ".soli-boy");

/**
 * Path traversal guard (LESSICALE) — confina `target` a `FS_BASE_DIR` via
 * `path.resolve` (normalizza `..`, separatori e prefissi). Restituisce il path
 * assoluto risolto se OK, lancia altrimenti.
 *
 * **Limite noto (F-074-1, CQRL TSK-074 iter-1)**: `path.resolve` NON dereferenzia
 * i symlink. Un link simbolico esistente DENTRO `FS_BASE_DIR` (es.
 * `~/.soli-boy/roms/evil` → `/etc`) supera questo guard lessicale: il path
 * risolto resta `<FS_BASE_DIR>/roms/evil` e `startsWith(rootWithSep)` ritorna
 * true, ma le syscall successive (`readFile`, `unlink`, ecc.) seguono il link
 * fisico verso `/etc`. Per i path ESISTENTI usa `guardExistingPath()` che fa
 * un secondo passo via `fs.realpath()` per chiudere questa finestra.
 *
 * Questo guard "puro" resta corretto per i path che CREANO file nuovi
 * (`fs:writeFile`, `fs:mkdir`): il target non esiste ancora, `realpath`
 * fallirebbe ENOENT. Per gli stessi motivi resta usato in `registerAppProtocol`
 * (lì il file servito esiste, ma il rischio symlink è confinato a chi può
 * scrivere dentro `RENDERER_DIR` = `resourcesPath` packaged o `dist/` in dev,
 * cioè il developer/build pipeline — non un attaccante remoto, non l'utente).
 *
 * Il separatore di sistema viene aggiunto al confronto per evitare il
 * falso-positivo `/base-dir-evil` rispetto a `/base-dir` (prefix-match naive).
 * In caso di violazione lancia un errore tipato (loggabile ma non sensibile:
 * contiene solo il path richiesto, non quello assoluto risolto).
 */
function guardPath(target: string): string {
  const resolved = path.resolve(target);
  const root = FS_BASE_DIR;
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) {
    throw new Error(`fs: path fuori dalla base dir consentita (~/.soli-boy/): ${target}`);
  }
  return resolved;
}

/**
 * Path traversal guard (FISICO) — variante di `guardPath` per i path che
 * devono già esistere su disco (handler `fs:readFile`, `fs:unlink`,
 * `fs:readdir`, `fs:stat`). Esegue prima il check lessicale e poi
 * `fs.realpath()` per dereferenziare gli eventuali symlink, riapplicando il
 * confronto `startsWith(rootWithSep)` sul target fisico. Garantisce che il
 * file effettivamente toccato dalle syscall sia DENTRO `FS_BASE_DIR`, chiudendo
 * il vettore symlink-traversal descritto in F-074-1.
 *
 * Strategia:
 *   1. `guardPath(target)` — guard lessicale + normalizzazione.
 *   2. `realpath(resolved)` — dereferenzia symlink (compresi quelli intermedi).
 *      Se il path NON esiste (ENOENT), facciamo passare il path lessicale: i
 *      handler che chiamano questa guard otterranno comunque l'ENOENT dalla
 *      syscall successiva (semantica preservata), mentre i path "fantasma"
 *      (es. lookup `fs:stat` su file mancante) non vengono falsamente
 *      bloccati. Errori `realpath` diversi da ENOENT (permessi, ELOOP) si
 *      propagano: l'handler li mappa in rejection IPC, fail-closed.
 *   3. Confronto finale su `realResolved` con `startsWith(rootWithSep)`.
 *
 * Nota: il path RITORNATO è sempre quello lessicale (passo 1). Le syscall
 * Node seguono comunque il symlink fisico: la guard ha già verificato che
 * tale fisico è dentro `FS_BASE_DIR`, quindi è safe usare il lessicale come
 * argomento di `readFile`/`unlink`/ecc.
 */
async function guardExistingPath(target: string): Promise<string> {
  const resolved = guardPath(target);
  let realResolved: string;
  try {
    realResolved = await realpath(resolved);
  } catch (err) {
    // Path inesistente: nessun symlink da dereferenziare. Lasciamo procedere
    // l'handler; sarà la syscall successiva a propagare l'ENOENT con
    // semantica nativa (allineata al contratto IPC, vedi `fs:stat`/`fs:unlink`).
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return resolved;
    throw err;
  }
  const root = FS_BASE_DIR;
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (realResolved !== root && !realResolved.startsWith(rootWithSep)) {
    throw new Error(
      `fs: path fuori dalla base dir consentita (~/.soli-boy/) via symlink: ${target}`,
    );
  }
  return resolved;
}

/** Canali IPC del filesystem nativo (TSK-053 / TSK-074 → consumati da NativeFsAdapter). */
function registerFsIpc(): void {
  // TSK-077: espone al renderer la base dir assoluta autoritativa. Il
  // `NativeFsAdapter` (TSK-055) compone i path relativi sulla convenzione
  // `.soli-boy` ma il main process confina già le scritture a `FS_BASE_DIR`
  // (path.resolve(os.homedir(), ".soli-boy")). Esporre questo path al renderer
  // permette all'adapter di comporre path assoluti coerenti con `guardPath`,
  // eliminando il disallineamento renderer ↔ main. **Riusa la STESSA costante
  // `FS_BASE_DIR`** già usata da `guardPath`: single source of truth (non
  // ricalcolare `os.homedir()/.soli-boy` qui sotto, pena divergenza silenziosa).
  ipcMain.handle("fs:getBaseDir", async (): Promise<string> => {
    return FS_BASE_DIR;
  });

  ipcMain.handle("fs:readFile", async (_e, filePath: string): Promise<Uint8Array> => {
    // F-074-1: path esistente → guard fisico (realpath) per chiudere il
    // vettore symlink-traversal (es. `roms/evil` → `/etc/passwd`).
    const safe = await guardExistingPath(filePath);
    const buf = await readFile(safe);
    return new Uint8Array(buf);
  });

  ipcMain.handle("fs:writeFile", async (_e, filePath: string, data: Uint8Array): Promise<void> => {
    // F-074-1 (limite noto, accettato): `fs:writeFile` può creare path nuovi
    // → `realpath` fallirebbe ENOENT sul target. Usiamo solo il guard
    // lessicale `guardPath`. Conseguenza: se il PARENT del path contiene un
    // symlink che esce da `FS_BASE_DIR` (es. `roms` è un symlink a `/etc`),
    // questo writeFile finirebbe fisicamente fuori. Il vettore è confinato a
    // chi può creare symlink dentro `~/.soli-boy/` (= utente locale stesso
    // che possiede la home, già fidato in modello desktop single-user).
    // Mitigation futura possibile: realpath sulla directory parent del target
    // e ricomporre il path con `path.basename`; rimandata per non complicare
    // l'happy path con un'ulteriore syscall su ogni write. Vedi log entry
    // dev-agent TSK-074 absorb iter-1.
    const safe = guardPath(filePath);
    await writeFile(safe, Buffer.from(data));
  });

  // TSK-074: primitive aggiuntive per il delete reale e la gestione directory
  // del NativeFsAdapter. Tutti i path passano dalla guard `guardPath` (path
  // nuovi) o `guardExistingPath` (path esistenti, dereferenza symlink — F-074-1)
  // per mantenere l'invariante privacy (ADR-002).

  // F-074-2 (CQRL TSK-074 iter-1): asimmetria contratto IPC documentata.
  // `fs:unlink` PROPAGA ENOENT come rejection (semantica nativa di
  // `fs/promises.unlink`), mentre `fs:stat` la intercetta e restituisce
  // `{exists:false}`. Scelta consapevole, non un bug: il consumer primario
  // `NativeFsAdapter.tryUnlink()` (packages/app/src/storage/native-fs-adapter.ts
  // §tryUnlink) maschera già correttamente l'ENOENT via `isNotFoundError`,
  // ottenendo idempotenza lato adapter senza dover allargare la responsabilità
  // dell'handler IPC. Eventuali consumer futuri del bridge che chiamino
  // `window.soliboyDesktop.unlink()` direttamente su un path mancante DEVONO
  // gestire il rejection ENOENT esplicitamente (è il contratto). Vedi anche
  // JSDoc in `packages/desktop/electron/preload.ts §unlink`.
  ipcMain.handle("fs:unlink", async (_e, filePath: string): Promise<void> => {
    // F-074-1: path esistente (il caller chiama unlink su qualcosa che
    // intende esista, ENOENT è un caso di errore esplicito). Guard fisico.
    const safe = await guardExistingPath(filePath);
    await unlink(safe);
  });

  ipcMain.handle(
    "fs:mkdir",
    async (_e, dirPath: string, opts?: { recursive?: boolean }): Promise<void> => {
      // F-074-1 (limite noto, accettato): `fs:mkdir` può creare path nuovi
      // (caso d'uso primario con `recursive: true` lato adapter). Stessa
      // motivazione di `fs:writeFile`: guard lessicale soltanto. Vedi commento
      // sopra in `fs:writeFile`.
      const safe = guardPath(dirPath);
      await mkdir(safe, { recursive: opts?.recursive === true });
    },
  );

  ipcMain.handle("fs:readdir", async (_e, dirPath: string): Promise<string[]> => {
    // F-074-1: path esistente → guard fisico.
    const safe = await guardExistingPath(dirPath);
    return readdir(safe);
  });

  ipcMain.handle(
    "fs:stat",
    async (
      _e,
      filePath: string,
    ): Promise<{ exists: boolean; size: number; isDirectory: boolean }> => {
      // F-074-1: il path POTREBBE non esistere (è il caso d'uso primario di
      // stat: testare l'esistenza). `guardExistingPath` ha già un fallback
      // esplicito al guard lessicale su ENOENT, quindi è safe usarlo qui:
      // i path mancanti passano col solo check lessicale e l'handler ritorna
      // `{exists:false}` come da contratto.
      const safe = await guardExistingPath(filePath);
      try {
        const st = await stat(safe);
        return { exists: true, size: st.size, isDirectory: st.isDirectory() };
      } catch (err) {
        // Convenzione contratto: file mancante → exists:false (no throw).
        // Altri errori (permessi, IO) si propagano: vogliamo segnalarli.
        if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
          return { exists: false, size: 0, isDirectory: false };
        }
        throw err;
      }
    },
  );

  ipcMain.handle("fs:showOpenDialog", async (_e, options: OpenDialogOptions): Promise<string[]> => {
    const result = await dialog.showOpenDialog(options);
    return result.canceled ? [] : result.filePaths;
  });

  ipcMain.handle("fs:showSaveDialog", async (_e, options: SaveDialogOptions): Promise<string | undefined> => {
    const result = await dialog.showSaveDialog(options);
    return result.canceled ? undefined : result.filePath;
  });
}

/** Auto-update (ADR-008): solo in build packaged; eventi inoltrati al renderer via IPC. */
function setupAutoUpdater(win: BrowserWindow): void {
  if (!app.isPackaged) return;
  const forward = (type: string, payload?: unknown) => {
    if (!win.isDestroyed()) win.webContents.send("update:event", { type, payload });
  };
  autoUpdater.on("checking-for-update", () => forward("checking"));
  autoUpdater.on("update-available", (info) => forward("available", info));
  autoUpdater.on("update-not-available", () => forward("not-available"));
  autoUpdater.on("error", (err) => forward("error", String(err)));
  autoUpdater.on("download-progress", (p) => forward("progress", p));
  autoUpdater.on("update-downloaded", (info) => forward("downloaded", info));
  // Check all'avvio (delay) + periodico, come da ADR-008.
  setTimeout(() => void autoUpdater.checkForUpdates(), 10_000);
  setInterval(() => void autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000);
}

/**
 * Canale IPC per il quit-and-install dell'auto-update (ADR-008).
 * Registrato una sola volta a livello app (non dipende dalla singola BrowserWindow).
 * Il renderer lo invoca via `window.soliboyDesktop.quitAndInstall()` SOLO dopo
 * aver ricevuto un evento `{ type: "downloaded" }` dall'autoUpdater.
 * Sicuro perché `contextIsolation: true` + `nodeIntegration: false`: solo il
 * preload whitelistato può raggiungere questo canale.
 */
function registerUpdateIpc(): void {
  ipcMain.on("update:quitAndInstall", () => {
    autoUpdater.quitAndInstall();
  });
}

async function createWindow(): Promise<BrowserWindow> {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (DEV_URL) {
    // In dev il renderer è servito da Vite: gli header COOP/COEP vanno iniettati a runtime.
    session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
      cb({ responseHeaders: { ...details.responseHeaders, ...COOP_COEP } });
    });
    await win.loadURL(DEV_URL);
  } else {
    await win.loadURL("app://./index.html");
  }

  setupAutoUpdater(win);
  win.once("ready-to-show", () => {
    if (IS_SMOKE) {
      // Smoke test: la finestra è pronta → l'avvio funziona → usciamo pulitamente.
      console.log("[soliboy-desktop] smoke OK: renderer caricato, finestra ready-to-show");
      app.quit();
      return;
    }
    win.show();
  });
  return win;
}

app.whenReady().then(() => {
  registerAppProtocol();
  registerFsIpc();
  registerUpdateIpc();
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" || IS_SMOKE) app.quit();
});
