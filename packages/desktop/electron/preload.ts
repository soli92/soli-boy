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
  /** Legge un file dal filesystem nativo. */
  readFile: (filePath: string): Promise<Uint8Array> => ipcRenderer.invoke("fs:readFile", filePath),
  /** Scrive un file sul filesystem nativo. */
  writeFile: (filePath: string, data: Uint8Array): Promise<void> =>
    ipcRenderer.invoke("fs:writeFile", filePath, data),
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
} as const;

export type SoliboyDesktopApi = typeof api;

contextBridge.exposeInMainWorld("soliboyDesktop", api);
