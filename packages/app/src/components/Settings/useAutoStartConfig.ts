// TSK-102 (US-053) — useAutoStartConfig: stato + persistenza del toggle
// "Avvio automatico dalla libreria" (UX-CF1-01 opt-out).
//
// Carica la preferenza da `ConfigPort` al mount (chiave `auto-start-from-library`).
// Default: true (ON) — coerente con il comportamento storico introdotto da
// TSK-100, che cabla `setAutoStartFromLibrary(true)` in `handleLibrarySelect`.
// Il toggle in Settings (TSK-102) consente all'utente di OPT-OUT, ribaltando il
// flusso a "tap = solo selezione, niente auto-avvio".
//
// Pattern intenzionalmente speculare a `useHapticsConfig` (TSK-066) — stessa
// composizione: hook isolato + porta `ConfigPort` (store `config`) + chiave
// canonica esportata; differenza unica nel default (true vs false), driven
// dall'AC1 ("default on" vs haptics che parte off per non sorprendere).

import { useCallback, useEffect, useState } from "react";
import type { ConfigPort } from "../../storage/port";

/** Chiave canonica per la persistenza del toggle "Avvio automatico dalla libreria". */
export const AUTO_START_CONFIG_KEY = "auto-start-from-library";

/**
 * Default ON (AC1, AC5): l'esperienza "tap = start" di TSK-100 è il default;
 * l'utente che preferisce "tap = solo selezione" disabilita il toggle.
 */
export const DEFAULT_AUTO_START_FROM_LIBRARY = true;

export interface UseAutoStartConfigReturn {
  autoStartFromLibrary: boolean;
  setAutoStartFromLibrary: (value: boolean) => void;
  /**
   * Persiste la preferenza via ConfigPort.
   * Se si passa `value`, persiste quel valore; altrimenti usa
   * `autoStartFromLibrary` corrente (evita la closure stantia quando setState
   * + save girano nello stesso tick React — stesso accorgimento di
   * `saveHapticsEnabled` in `useHapticsConfig`).
   */
  saveAutoStartFromLibrary: (value?: boolean) => Promise<void>;
  /** true durante il caricamento iniziale. */
  loading: boolean;
}

/**
 * Hook che carica e persiste la preferenza "Avvio automatico dalla libreria".
 *
 * Se `storage` è assente, usa solo lo stato locale con il default `true`
 * (backward compat — no crash; pattern coerente con `useHapticsConfig`).
 */
export function useAutoStartConfig(
  storage?: ConfigPort,
): UseAutoStartConfigReturn {
  const [autoStartFromLibrary, setAutoStartFromLibraryState] = useState<boolean>(
    DEFAULT_AUTO_START_FROM_LIBRARY,
  );
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
        const saved = await storage.getConfig<string>(AUTO_START_CONFIG_KEY);
        // `getConfig` ritorna:
        //  - `undefined`/`null` quando la chiave non è mai stata persistita
        //    (primo avvio) → manteniamo il default ON.
        //  - una stringa "true"/"false" quando l'utente ha già scelto.
        // Solo nel secondo caso ribaltiamo lo stato.
        if (!cancelled && saved !== undefined && saved !== null) {
          setAutoStartFromLibraryState(saved === "true");
        }
      } catch {
        // getConfig non disponibile o storage KO: si usa il default ON.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storage]);

  const setAutoStartFromLibrary = useCallback((value: boolean) => {
    setAutoStartFromLibraryState(value);
  }, []);

  /**
   * Persiste il valore esplicito passato (evita la closure stantia del
   * setState asincrono quando si chiama setState + save nello stesso tick).
   */
  const saveAutoStartFromLibrary = useCallback(
    async (value?: boolean) => {
      if (!storage) return;
      const toSave = value !== undefined ? value : autoStartFromLibrary;
      // Stessa precauzione di `saveHapticsEnabled` (TSK-066 CQRL F-2): il
      // call-site in App.tsx tratta questa come fire-and-forget; un eventuale
      // rigetto di `setConfig` (es. QuotaExceededError) NON deve diventare
      // unhandled rejection. Log non bloccante, lo stato in memoria resta
      // aggiornato (la preferenza è comunque valida per la sessione corrente).
      try {
        await storage.setConfig<string>(
          AUTO_START_CONFIG_KEY,
          toSave ? "true" : "false",
        );
      } catch (err) {
        console.warn("[auto-start] persistenza preferenza fallita:", err);
      }
    },
    [storage, autoStartFromLibrary],
  );

  return {
    autoStartFromLibrary,
    setAutoStartFromLibrary,
    saveAutoStartFromLibrary,
    loading,
  };
}
