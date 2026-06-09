// TSK-057 (US-025) — Hook che si iscrive agli eventi di auto-update Electron.
//
// Stato macchina:
//   idle → checking → available → progress (0-100%) → downloaded | error
//   idle → checking → not-available → idle
//
// Guard web: se `window.soliboyDesktop` non è presente (runtime web/mobile)
// il hook restituisce sempre `{ phase: "idle" }` senza effetti collaterali.
//
// Il chiamante (UpdateBanner) usa `quitAndInstall()` per avviare il riavvio;
// l'hook lo espone come callback opzionale solo quando il bridge è presente.
//
// Pattern allineato a `usePrivacyAck` (TSK-069):
//   - useEffect per iscrizione/disiscrizione (cleanup al unmount);
//   - `cancelled` guard per setState post-unmount;
//   - nessun import diretto da `packages/desktop` (bridge strutturale via window).

import { useCallback, useEffect, useState } from "react";

/** Payload del progresso di download (electron-updater DownloadProgress). */
export interface UpdateProgress {
  percent: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
}

/** Fase della macchina a stati del ciclo di update. */
export type UpdatePhase =
  | "idle"
  | "checking"
  | "available"
  | "progress"
  | "downloaded"
  | "error"
  | "not-available";

export interface UpdaterState {
  /** Fase corrente del ciclo di update. */
  phase: UpdatePhase;
  /** Percentuale di avanzamento download (solo quando `phase === "progress"`). */
  progress?: UpdateProgress;
  /** Messaggio di errore (solo quando `phase === "error"`). */
  errorMessage?: string;
}

/**
 * Sottoinsieme del bridge desktop usato da questo hook.
 * Strutturalmente compatibile con `SoliboyDesktopApi` di preload.ts ma definito
 * in locale per non accoppiare `@soli-boy/app` con `packages/desktop`
 * (stesso pattern di `select-adapter.ts`).
 */
interface UpdateBridge {
  onUpdateEvent: (callback: (event: { type: string; payload?: unknown }) => void) => () => void;
  quitAndInstall: () => void;
}

interface BridgeWindow {
  soliboyDesktop?: UpdateBridge;
}

/**
 * Rileva il bridge desktop per i soli campi update.
 * Sicuro in SSR / vitest (no `window`).
 */
function getUpdateBridge(win: BridgeWindow | undefined): UpdateBridge | undefined {
  if (typeof win === "undefined") return undefined;
  const desktop = win.soliboyDesktop;
  if (!desktop || typeof desktop.onUpdateEvent !== "function") return undefined;
  return desktop;
}

export interface UseUpdaterResult extends UpdaterState {
  /**
   * Invoca `quitAndInstall` sul main process.
   * Definita solo quando il bridge è presente E `phase === "downloaded"`.
   * `undefined` su web (no bridge) e finché l'update non è scaricato.
   */
  quitAndInstall?: () => void;
}

/**
 * Hook che si iscrive al canale `update:event` esposto da `window.soliboyDesktop`
 * (ADR-008). Su web/mobile (nessun bridge) è completamente no-op: lo stato è
 * sempre `{ phase: "idle" }`.
 *
 * @param windowRef - override opzionale per test (default: `globalThis.window`).
 */
export function useUpdater(
  windowRef: BridgeWindow | undefined = typeof window === "undefined"
    ? undefined
    : (window as unknown as BridgeWindow),
): UseUpdaterResult {
  const bridge = getUpdateBridge(windowRef);

  const [state, setState] = useState<UpdaterState>({ phase: "idle" });

  useEffect(() => {
    if (!bridge) return; // no-op su web

    let cancelled = false;

    const unsubscribe = bridge.onUpdateEvent((event) => {
      if (cancelled) return;
      const { type, payload } = event;

      if (type === "checking") {
        setState({ phase: "checking" });
      } else if (type === "available") {
        setState({ phase: "available" });
      } else if (type === "not-available") {
        setState({ phase: "not-available" });
      } else if (type === "progress") {
        const p = payload as UpdateProgress | undefined;
        setState({
          phase: "progress",
          progress: p ?? { percent: 0 },
        });
      } else if (type === "downloaded") {
        setState({ phase: "downloaded" });
      } else if (type === "error") {
        setState({
          phase: "error",
          errorMessage: typeof payload === "string" ? payload : String(payload ?? ""),
        });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [bridge]);

  const quitAndInstall = useCallback(() => {
    bridge?.quitAndInstall();
  }, [bridge]);

  return {
    ...state,
    // Esponiamo quitAndInstall solo se il bridge è presente, indipendentemente
    // dalla fase: il componente decide quando mostrare il pulsante. Su web
    // il bridge è undefined, quindi quitAndInstall è undefined → no rendering.
    quitAndInstall: bridge ? quitAndInstall : undefined,
  };
}
