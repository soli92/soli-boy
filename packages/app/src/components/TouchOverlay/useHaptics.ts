// TSK-066 — useHaptics: feedback aptico opzionale via Capacitor Haptics (US-032).
//
// Espone `triggerImpact()`:
//   - Se `enabled === false`, è un no-op.
//   - Se Capacitor non è disponibile (browser desktop/test), è un no-op silenzioso.
//   - In ambiente nativo Capacitor invoca `Haptics.impact({ style: ImpactStyle.Light })`.
//
// L'import di `@capacitor/haptics` è dinamico per evitare errori di runtime
// nei contesti senza il bridge nativo (PWA browser, jsdom): il modulo viene
// importato solo una volta e il risultato viene memoizzato nella ref.

import { useCallback, useRef } from "react";

/** Tipo stretto del metodo `Haptics.impact` per il test mock. */
export type ImpactFn = (options: { style: "LIGHT" | "MEDIUM" | "HEAVY" }) => Promise<void>;

/** Shape minimale dell'API Capacitor Haptics consumata da questo hook. */
export interface HapticsApi {
  impact: ImpactFn;
  ImpactStyle: { Light: "LIGHT"; Medium: "MEDIUM"; Heavy: "HEAVY" };
}

/** Guard: ritorna true se il runtime Capacitor è disponibile (env nativo). */
function isCapacitorNative(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as unknown as Record<string, unknown>)["Capacitor"] !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor?.isNativePlatform?.() === true
  );
}

export interface UseHapticsReturn {
  /**
   * Chiama `Haptics.impact({ style: ImpactStyle.Light })` se il feedback
   * aptico è abilitato e il bridge nativo è disponibile. No-op altrimenti.
   */
  triggerImpact: () => void;
}

/**
 * Hook che espone `triggerImpact()` condizionato al flag `enabled`.
 *
 * @param enabled — `true` per attivare il feedback aptico (default `false`).
 */
export function useHaptics(enabled: boolean): UseHapticsReturn {
  // Ref che memorizza la Promise di import per evitare import multipli.
  const hapticsRef = useRef<HapticsApi | null>(null);
  const importedRef = useRef(false);

  const triggerImpact = useCallback(() => {
    if (!enabled) return;
    if (!isCapacitorNative()) return;

    // Carica il modulo Capacitor Haptics in modo lazy (una sola volta).
    if (!importedRef.current) {
      importedRef.current = true;
      import("@capacitor/haptics")
        .then((mod) => {
          hapticsRef.current = mod as unknown as HapticsApi;
        })
        .catch(() => {
          // Import fallito (es. modulo non disponibile): rimane no-op.
        });
      // Il primo trigger è fire-and-forget: l'import avviene asincronamente.
      // Il feedback aptico sul primo touch viene perso; quelli successivi usano
      // l'istanza già caricata. Questo è intenzionale: preferiamo un primo
      // touch silenzioso a un errore di runtime.
      return;
    }

    const api = hapticsRef.current;
    if (!api) return;

    void api.impact({ style: api.ImpactStyle.Light }).catch(() => {
      // Errore silenzioso: il feedback aptico non è critico.
    });
  }, [enabled]);

  return { triggerImpact };
}
