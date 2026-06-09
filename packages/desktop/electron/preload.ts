/**
 * Soli-boy — Electron preload (TSK-053, ADR-007).
 *
 * Espone al renderer SOLO la whitelist di API IPC tramite contextBridge.
 * Nessun accesso diretto a Node nel renderer (contextIsolation: true,
 * nodeIntegration: false). NativeFsAdapter (TSK-054) consuma `window.soliboyDesktop`.
 */
import { contextBridge, ipcRenderer } from "electron";
import type { OpenDialogOptions, SaveDialogOptions } from "electron";

export interface UpdateEvent {
  type: "checking" | "available" | "not-available" | "error" | "progress" | "downloaded";
  payload?: unknown;
}

const api = {
  /**
   * TSK-077: ritorna il path assoluto della base dir applicativa (root
   * autoritativa del main process, equivalente a `path.resolve(os.homedir(),
   * ".soli-boy")` — stessa costante usata da `guardPath`). Il renderer non
   * conosce `os.homedir()` (nodeIntegration:false): questa è l'unica via per
   * comporre path assoluti coerenti con il guard del main. `NativeFsAdapter`
   * la consuma in modo lazy+memoizzato così la factory `selectAdapter()` resta
   * sincrona.
   */
  getBaseDir: (): Promise<string> => ipcRenderer.invoke("fs:getBaseDir"),
  /** Legge un file dal filesystem nativo. */
  readFile: (filePath: string): Promise<Uint8Array> => ipcRenderer.invoke("fs:readFile", filePath),
  /** Scrive un file sul filesystem nativo. */
  writeFile: (filePath: string, data: Uint8Array): Promise<void> =>
    ipcRenderer.invoke("fs:writeFile", filePath, data),
  /**
   * Rimuove un file dal filesystem nativo (TSK-074).
   * Solleva se il file non esiste (ENOENT) — il consumer è responsabile della
   * gestione idempotente lato adapter.
   */
  unlink: (filePath: string): Promise<void> => ipcRenderer.invoke("fs:unlink", filePath),
  /**
   * Crea una directory (TSK-074). Con `{ recursive: true }` crea anche i
   * parent mancanti e non solleva se la dir esiste già (parità `fs.mkdir`).
   */
  mkdir: (dirPath: string, opts?: { recursive?: boolean }): Promise<void> =>
    ipcRenderer.invoke("fs:mkdir", dirPath, opts),
  /**
   * Elenca il contenuto di una directory (TSK-074). Ritorna solo i nomi
   * relativi (no path assoluti). Solleva se la dir non esiste.
   */
  readdir: (dirPath: string): Promise<string[]> => ipcRenderer.invoke("fs:readdir", dirPath),
  /**
   * Stat strutturato (TSK-074). Per file mancanti ritorna
   * `{ exists: false, size: 0, isDirectory: false }` invece di sollevare
   * (contratto stabile per consumer come NativeFsAdapter).
   */
  stat: (filePath: string): Promise<{ exists: boolean; size: number; isDirectory: boolean }> =>
    ipcRenderer.invoke("fs:stat", filePath),
  /** Apre il dialog nativo di selezione file. Ritorna i path scelti ([] se annullato). */
  showOpenDialog: (options: OpenDialogOptions): Promise<string[]> =>
    ipcRenderer.invoke("fs:showOpenDialog", options),
  /** Apre il dialog nativo di salvataggio. Ritorna il path scelto (undefined se annullato). */
  showSaveDialog: (options: SaveDialogOptions): Promise<string | undefined> =>
    ipcRenderer.invoke("fs:showSaveDialog", options),
  /** Sottoscrive gli eventi di auto-update (ADR-008). Ritorna la funzione di unsubscribe. */
  onUpdateEvent: (callback: (event: UpdateEvent) => void): (() => void) => {
    const listener = (_e: unknown, event: UpdateEvent) => callback(event);
    ipcRenderer.on("update:event", listener);
    return () => ipcRenderer.removeListener("update:event", listener);
  },
  /**
   * Richiede al main process di uscire e installare l'aggiornamento scaricato
   * (ADR-008). Invocabile SOLO dopo aver ricevuto un evento `{ type: "downloaded" }`.
   * Nel renderer il bridge è no-op su web (nessun `window.soliboyDesktop`).
   */
  quitAndInstall: (): void => ipcRenderer.send("update:quitAndInstall"),
} as const;

export type SoliboyDesktopApi = typeof api;

contextBridge.exposeInMainWorld("soliboyDesktop", api);
