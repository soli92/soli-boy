// TSK-062 — useGamepadDetection: rilevamento Gamepad API per controller Bluetooth (US-028).
//
// Espone `{ connected: boolean }`:
//   - `connected` diventa `true` quando ≥1 gamepad è collegato, `false` quando
//     vengono tutti disconnessi.
//   - Ascolta gli eventi `gamepadconnected`/`gamepaddisconnected` su `window`.
//   - Quando un gamepad è connesso, avvia un loop `requestAnimationFrame` che
//     chiama `navigator.getGamepads()` e invia i pulsanti premuti al sink
//     (InputMapping.gamepadButton).
//   - Guard SSR/jsdom: se `window` o `navigator.getGamepads` non sono disponibili,
//     il hook è un no-op completo (niente errori in ambienti senza Gamepad API).
//
// Nota sull'architettura: il polling via rAF è necessario perché la Gamepad API
// non emette eventi per i singoli pulsanti; solo la connessione/disconnessione
// hanno eventi dedicati. Il loop gira SOLO quando ≥1 gamepad è connesso (R.F1)
// e viene cancellato alla disconnessione o all'unmount (niente leak).
//
// InputMapping.gamepadButton già esiste (TSK-016) con DEFAULT_GAMEPAD_MAP standard
// (indici 0=A, 1=B, 8=select, 9=start, 12=up, 13=down, 14=left, 15=right).

import { useCallback, useEffect, useRef, useState } from "react";
import type { InputMapping } from "./input-mapping";

/** Guard SSR/jsdom: true se il browser supporta la Gamepad API. */
function hasGamepadApi(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.getGamepads === "function"
  );
}

export interface UseGamepadDetectionReturn {
  /** true se ≥1 gamepad è attualmente connesso. */
  connected: boolean;
}

/**
 * Hook che rileva la connessione/disconnessione di gamepad via Web Gamepad API
 * e, quando connesso, effettua il polling dei pulsanti inviandoli via InputMapping.
 *
 * @param inputMapping — InputMapping a cui instradare gli input gamepad.
 *                       Se assente, il polling è avviato ma gli input non vengono
 *                       inviati (nessun crash — composizioni senza wiring input
 *                       continuano a ottenere il `connected` flag correttamente).
 */
export function useGamepadDetection(
  inputMapping?: InputMapping,
): UseGamepadDetectionReturn {
  const [connected, setConnected] = useState<boolean>(false);

  // Ref per il frame handle del loop rAF (cancellazione al cleanup).
  const rafRef = useRef<number | null>(null);
  // Ref per lo stato pressed precedente: evita di inviare duplicati quando
  // un pulsante rimane premuto tra due frame consecutivi.
  const prevPressedRef = useRef<Record<number, boolean>>({});
  // Ref stabile all'inputMapping corrente (evita restart del loop per ogni
  // cambio referenziale dell'istanza in composizioni che la ricreano).
  const inputMappingRef = useRef<InputMapping | undefined>(inputMapping);
  useEffect(() => {
    inputMappingRef.current = inputMapping;
  }, [inputMapping]);

  /** Conta quanti gamepad sono attualmente connessi via navigator.getGamepads(). */
  const countConnected = useCallback((): number => {
    if (!hasGamepadApi()) return 0;
    const pads = navigator.getGamepads();
    return Array.from(pads).filter((p) => p !== null).length;
  }, []);

  /** Avvia il loop rAF di polling pulsanti. */
  const startPolling = useCallback(() => {
    if (!hasGamepadApi()) return;
    if (rafRef.current !== null) return; // già in corso

    function poll() {
      const pads = navigator.getGamepads();
      const mapping = inputMappingRef.current;

      for (const pad of pads) {
        if (!pad) continue;
        pad.buttons.forEach((btn, index) => {
          const wasPressed = prevPressedRef.current[index] ?? false;
          const isPressed = btn.pressed;
          if (isPressed !== wasPressed) {
            prevPressedRef.current[index] = isPressed;
            mapping?.gamepadButton(index, isPressed);
          }
        });
      }

      rafRef.current = requestAnimationFrame(poll);
    }

    rafRef.current = requestAnimationFrame(poll);
  }, []);

  /** Ferma il loop rAF. */
  const stopPolling = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    prevPressedRef.current = {};
  }, []);

  useEffect(() => {
    if (!hasGamepadApi()) return;

    function handleConnected() {
      const n = countConnected();
      setConnected(n > 0);
      if (n > 0) startPolling();
    }

    function handleDisconnected() {
      const n = countConnected();
      setConnected(n > 0);
      if (n === 0) stopPolling();
    }

    // Al mount: controlla se ci sono gamepad già connessi (edge case: la pagina
    // è stata caricata con un gamepad già inserito e l'evento è già stato emesso).
    const already = countConnected();
    if (already > 0) {
      setConnected(true);
      startPolling();
    }

    window.addEventListener("gamepadconnected", handleConnected);
    window.addEventListener("gamepaddisconnected", handleDisconnected);

    return () => {
      window.removeEventListener("gamepadconnected", handleConnected);
      window.removeEventListener("gamepaddisconnected", handleDisconnected);
      stopPolling();
    };
  }, [countConnected, startPolling, stopPolling]);

  return { connected };
}
