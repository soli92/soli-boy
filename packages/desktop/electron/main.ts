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
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import * as path from "node:path";

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

/** Canali IPC del filesystem nativo (TSK-053 → consumati da NativeFsAdapter TSK-054). */
function registerFsIpc(): void {
  ipcMain.handle("fs:readFile", async (_e, filePath: string): Promise<Uint8Array> => {
    const buf = await readFile(filePath);
    return new Uint8Array(buf);
  });

  ipcMain.handle("fs:writeFile", async (_e, filePath: string, data: Uint8Array): Promise<void> => {
    await writeFile(filePath, Buffer.from(data));
  });

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
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" || IS_SMOKE) app.quit();
});
