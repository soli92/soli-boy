// TSK-061 — useTouchOverlayConfig: stato + persistenza della configurazione TouchOverlay.
// Gestisce posizione/dimensione/opacità con persistenza via ConfigPort (store `config`,
// chiave `touch-overlay`). Pattern analogo a `useVideoSettings` (TSK-036 / useVideoSettings.ts).

import { useCallback, useEffect, useState } from "react";
import type { ConfigPort } from "../../storage/port";

/** Config persistita per il TouchOverlay. */
export interface TouchOverlayConfig {
  /** Opacità globale dell'overlay: 0.2 – 1.0 (20%–100%). */
  opacity: number;
  /** Fattore di scala globale: 0.5 – 1.5 (50%–150%). */
  scale: number;
  /** Offset X del D-pad dal bordo sinistro (come percentuale del container, 0–40). */
  dpadOffsetX: number;
  /** Offset Y del D-pad dal bordo inferiore (come percentuale del container, 0–40). */
  dpadOffsetY: number;
  /** Offset X del blocco pulsanti dal bordo destro (come percentuale del container, 0–40). */
  buttonsOffsetX: number;
  /** Offset Y del blocco pulsanti dal bordo inferiore (come percentuale del container, 0–40). */
  buttonsOffsetY: number;
}

export const DEFAULT_TOUCH_OVERLAY_CONFIG: TouchOverlayConfig = {
  opacity: 0.75,
  scale: 1.0,
  dpadOffsetX: 4,
  dpadOffsetY: 8,
  buttonsOffsetX: 4,
  buttonsOffsetY: 8,
};

const CONFIG_KEY = "touch-overlay";

export interface UseTouchOverlayConfigReturn {
  config: TouchOverlayConfig;
  setConfig: (next: Partial<TouchOverlayConfig>) => void;
  /** Persiste la configurazione corrente via ConfigPort. */
  save: () => Promise<void>;
  /** true durante il caricamento iniziale (evita flash di default). */
  loading: boolean;
}

/**
 * Hook che carica la configurazione TouchOverlay da `ConfigPort` al mount,
 * la mantiene nello stato locale, e la persiste via `storage.setConfig`.
 *
 * Se `storage` è assente (composizione senza porta), usa solo lo stato locale
 * con i valori di default (backward compat — no crash).
 */
export function useTouchOverlayConfig(
  storage?: ConfigPort,
): UseTouchOverlayConfigReturn {
  const [config, setConfigState] = useState<TouchOverlayConfig>(
    DEFAULT_TOUCH_OVERLAY_CONFIG,
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Al mount: carica la config persistita.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!storage) {
        setLoading(false);
        return;
      }
      try {
        const saved =
          await storage.getConfig<string>(CONFIG_KEY);
        if (!cancelled && saved) {
          try {
            const parsed = JSON.parse(saved) as Partial<TouchOverlayConfig>;
            setConfigState((prev) => ({ ...prev, ...parsed }));
          } catch {
            // JSON malformato: si usa il default.
          }
        }
      } catch {
        // getConfig non disponibile o storage KO: si usa il default.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storage]);

  const setConfig = useCallback((next: Partial<TouchOverlayConfig>) => {
    setConfigState((prev) => ({ ...prev, ...next }));
  }, []);

  const save = useCallback(async () => {
    if (!storage) return;
    await storage.setConfig<string>(CONFIG_KEY, JSON.stringify(config));
  }, [storage, config]);

  return { config, setConfig, save, loading };
}
