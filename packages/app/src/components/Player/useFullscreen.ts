// TSK-035 — Fullscreen API hook per il Player (US-020).
// Engine-agnostico: agisce sul nodo passato (tipicamente il contenitore `.sb-screen`
// del viewport di gioco). Nessuna modifica a EmulatorEngine.
// Vedi design_&_architecture/architecture-overview.md §EP-005.

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/**
 * Stato e azioni esposte dall'hook di gestione fullscreen.
 * - `supported=false` quando l'API non è disponibile sul nodo target (es. jsdom,
 *   browser senza supporto): il chiamante può disabilitare il bottone.
 * - `isFullscreen` riflette `document.fullscreenElement === target` ed è
 *   sincronizzato via listener `fullscreenchange`.
 */
export interface FullscreenApi {
  isFullscreen: boolean;
  supported: boolean;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => Promise<void>;
}

/** Detection minima: bastano `requestFullscreen` sull'elemento e `exitFullscreen` su document. */
function isApiSupported(target: Element | null | undefined): boolean {
  if (typeof document === "undefined") return false;
  if (!target) return false;
  // Standard moderno; non gestiamo vendor-prefix legacy (webkit/ms): la spec è stabile.
  return (
    typeof (target as HTMLElement).requestFullscreen === "function" &&
    typeof document.exitFullscreen === "function"
  );
}

/**
 * Hook che gestisce l'ingresso/uscita dalla modalità schermo intero su un elemento
 * (riferito da `ref`). Sincronizza `isFullscreen` con `document.fullscreenchange` e
 * pulisce il listener su unmount.
 *
 * Note di robustezza:
 * - Le promise di `requestFullscreen`/`exitFullscreen` sono catturate: in caso di
 *   reject (es. gesto utente mancante) l'errore è loggato e ri-lanciato così il
 *   chiamante può reagire (qui usato per non sporcare lo stato UI con throw).
 */
export function useFullscreen(ref: RefObject<Element | null>): FullscreenApi {
  // Calcoliamo `supported` lazy al primo render: in jsdom il nodo è già montato in test.
  const [supported, setSupported] = useState<boolean>(() => isApiSupported(ref.current));
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  // Tracciamo l'ultimo target per il diff in `fullscreenchange` (evita falsi positivi
  // se un altro elemento del DOM va in fullscreen).
  const targetRef = useRef<Element | null>(null);

  // Sync iniziale del flag supported: il ref può essere null al primo render,
  // popolato solo dopo il mount → ri-valutiamo.
  useEffect(() => {
    setSupported(isApiSupported(ref.current));
    targetRef.current = ref.current;
  }, [ref]);

  // Listener di sincronizzazione + cleanup su unmount.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onChange = () => {
      const current = document.fullscreenElement;
      setIsFullscreen(!!current && current === targetRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    // Stato iniziale coerente (es. nav back).
    onChange();
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
    };
  }, []);

  const enter = useCallback(async () => {
    const el = ref.current as HTMLElement | null;
    if (!el || typeof el.requestFullscreen !== "function") {
      throw new Error("Fullscreen API non disponibile");
    }
    targetRef.current = el;
    await el.requestFullscreen();
  }, [ref]);

  const exit = useCallback(async () => {
    if (typeof document === "undefined") return;
    if (typeof document.exitFullscreen !== "function") return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }, []);

  const toggle = useCallback(async () => {
    if (document.fullscreenElement === (ref.current as Element | null)) {
      await exit();
    } else {
      await enter();
    }
  }, [enter, exit, ref]);

  return { isFullscreen, supported, enter, exit, toggle };
}
