// TSK-066 — useHapticsConfig: stato + persistenza del toggle feedback aptico (US-032).
//
// Carica la preferenza da `ConfigPort` al mount (chiave `haptics-enabled`).
// Default: false (disabilitato per non sorprendere l'utente al primo avvio).
// Pattern analogo a `useTouchOverlayConfig` (TSK-061).

import { useCallback, useEffect, useState } from "react";
import type { ConfigPort } from "../../storage/port";

/** Chiave canonica per la persistenza del toggle haptics. */
export const HAPTICS_CONFIG_KEY = "haptics-enabled";

export interface UseHapticsConfigReturn {
  hapticsEnabled: boolean;
  setHapticsEnabled: (value: boolean) => void;
  /**
   * Persiste la preferenza via ConfigPort.
   * Se si passa `value`, persiste quel valore; altrimenti usa `hapticsEnabled`
   * corrente (evita la closure stantia quando setState + save girano nello
   * stesso tick React).
   */
  saveHapticsEnabled: (value?: boolean) => Promise<void>;
  /** true durante il caricamento iniziale. */
  loading: boolean;
}

/**
 * Hook che carica e persiste la preferenza feedback aptico.
 *
 * Se `storage` è assente, usa solo lo stato locale con il default `false`
 * (backward compat — no crash).
 */
export function useHapticsConfig(storage?: ConfigPort): UseHapticsConfigReturn {
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Carica la preferenza al mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!storage) {
        setLoading(false);
        return;
      }
      try {
        const saved = await storage.getConfig<string>(HAPTICS_CONFIG_KEY);
        if (!cancelled && saved !== undefined) {
          // La preferenza è serializzata come stringa "true"/"false".
          setHapticsEnabledState(saved === "true");
        }
      } catch {
        // getConfig non disponibile o storage KO: si usa il default false.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storage]);

  const setHapticsEnabled = useCallback((value: boolean) => {
    setHapticsEnabledState(value);
  }, []);

  /**
   * Persiste il valore esplicito passato (evita la closure stantia del
   * setState asincrono quando si chiama setState + save nello stesso tick).
   */
  const saveHapticsEnabled = useCallback(
    async (value?: boolean) => {
      if (!storage) return;
      const toSave = value !== undefined ? value : hapticsEnabled;
      await storage.setConfig<string>(
        HAPTICS_CONFIG_KEY,
        toSave ? "true" : "false",
      );
    },
    [storage, hapticsEnabled],
  );

  return { hapticsEnabled, setHapticsEnabled, saveHapticsEnabled, loading };
}
