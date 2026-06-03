// TSK-069 (US-033) — Stato + persistenza dell'avvenuta presa visione della
// informativa privacy on-device.
//
// Pattern allineato a `useTheme` (TSK-044) e `useVideoSettings` (TSK-036):
// hook di stato con porta opzionale, idratazione al mount, persistenza
// best-effort con `console.warn` su errore (no rollback UI).
//
// Stato iniziale: `acknowledged = false` (notice visibile). Al mount, se la
// porta è cablata, leggiamo `port.load()`:
// - valore presente (`PRIVACY_ACK_VALUE`) → `acknowledged = true` (notice
//   non viene più mostrato come banner di primo avvio);
// - `null` → resta `false` (notice di primo avvio mostrato).
//
// `acknowledge()` aggiorna lo stato e persiste in modo best-effort. Non
// esiste `reset()`: per l'utente l'informativa è SEMPRE consultabile nella
// sezione "Privacy" di Settings, indipendentemente da `acknowledged`.

import { useCallback, useEffect, useState } from "react";
import {
  PRIVACY_ACK_VALUE,
  type PrivacyAckPort,
} from "./privacy-port";

export interface UsePrivacyAckResult {
  /**
   * `true` se l'utente ha già preso visione dell'informativa privacy in una
   * sessione precedente. Usato dall'orchestratore (App.tsx) per decidere se
   * mostrare il banner di primo avvio.
   *
   * NB: indipendentemente da questo flag, la sezione "Privacy" di Settings
   * mostra SEMPRE l'informativa (requisito TSK-069: «sempre disponibile in
   * Settings → Privacy»).
   */
  acknowledged: boolean;
  /**
   * Marca l'informativa come letta. Aggiorna lo stato in memoria e tenta la
   * persistenza via porta (best-effort). Idempotente: chiamate successive
   * non causano errore.
   */
  acknowledge: () => void;
}

/**
 * Hook condiviso da App.tsx per gestire il banner di primo avvio
 * dell'informativa privacy on-device.
 *
 * @param port - porta di persistenza opzionale. Senza porta: stato puramente
 * in-memory (utile per i test che non vogliono coinvolgere IndexedDB).
 */
export function usePrivacyAck(port?: PrivacyAckPort): UsePrivacyAckResult {
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  // Idratazione dalla porta (one-shot al mount). `cancelled` evita setState
  // dopo unmount nei test che svolgono il render in <StrictMode> o smontano
  // rapidamente l'albero — stesso pattern di `useTheme`.
  useEffect(() => {
    let cancelled = false;
    if (!port) return;
    port
      .load()
      .then((loaded) => {
        if (cancelled) return;
        // Trattiamo qualsiasi valore non nullo come "acknowledged": l'utente
        // ha già interagito col banner. Non discriminiamo sul contenuto
        // esatto della stringa per essere robusti a future versioni del flag
        // (es. `"v2"` per future re-prompt dopo cambi di policy).
        if (loaded !== null) setAcknowledged(true);
      })
      .catch((err) => {
        if (cancelled) return;
        // Lettura fallita (store chiuso/corrotto): comportamento conservativo
        // = mostrare il banner. Logghiamo per facilitare il debug. Il banner
        // NON blocca l'app: chiuderlo è opzionale.
        console.warn("[usePrivacyAck] port.load() rejected:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [port]);

  const acknowledge = useCallback(() => {
    setAcknowledged(true);
    if (port) {
      // Best-effort: non blocchiamo la UI sull'I/O. Coerente con `useTheme`
      // dopo i fix CQRL F-036-03.
      port.save(PRIVACY_ACK_VALUE).catch((err) => {
        // Diagnostico: lo stato in memoria resta `true` (l'utente non vede
        // più il banner in questa sessione); il prossimo mount potrebbe
        // ri-mostrarlo se la save è davvero fallita (quota piena, ecc.).
        console.warn("[usePrivacyAck] port.save() rejected:", err);
      });
    }
  }, [port]);

  return { acknowledged, acknowledge };
}
