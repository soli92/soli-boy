// TSK-065 — useAppLifecycle: pausa/ripresa emulazione in background (US-031).
//
// Ascolta due sorgenti di segnale lifecycle:
//   1. `document.visibilitychange` — funziona su web/PWA e nel WebView Capacitor
//      (compatibile con tutti i browser moderni e con il bridge Capacitor).
//   2. `@capacitor/app` `App.addListener('appStateChange', ...)` — signal nativo
//      su Android/iOS, più affidabile su alcuni device per la transizione
//      background/foreground. Attivato solo se il runtime Capacitor è disponibile.
//
// Logica:
//   - `document.hidden === true` → `pause()` (se stato è 'running').
//   - `document.hidden === false` → `resume()` (se stato è 'paused').
//   - `appStateChange.isActive === false` → `pause()`.
//   - `appStateChange.isActive === true` → `resume()`.
//
// Il hook accetta un oggetto con i metodi `pause()` e `resume()` e la `state`
// corrente della sessione (SessionState da CoreWrapper). In questo modo rimane
// testabile senza dipendenze da CoreWrapper.
//
// Guard:
//   - No-op se `document` non è disponibile (SSR/jsdom senza env).
//   - No-op se `@capacitor/app` non è raggiungibile (web puro): import dinamico,
//     errore silenziato.
//   - Il listener Capacitor viene rimosso al cleanup del hook (evita leak).

import { useEffect, useRef } from "react";
import type { SessionState } from "../core/core-wrapper";

/** Interfaccia minimale del target di pausa/ripresa (subset di CoreWrapper). */
export interface LifecycleTarget {
  pause(): void;
  resume(): void;
  readonly currentState: SessionState;
}

/** Guard: true se `document` è disponibile (non SSR/jsdom puro). */
function hasDocument(): boolean {
  return typeof document !== "undefined";
}

/** Guard: true se il runtime Capacitor nativo è disponibile. */
function isCapacitorNative(): boolean {
  return (
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor?.isNativePlatform?.() === true
  );
}

/**
 * Hook che mette in pausa/riprende `target` quando l'app va in background o
 * torna in foreground. Gestisce entrambi i segnali (visibility API + Capacitor).
 *
 * @param target — Oggetto con `pause()`, `resume()`, `currentState`.
 *                 Se `null`/`undefined`, il hook è un no-op (composizioni
 *                 senza sessione attiva non crashano).
 */
export function useAppLifecycle(target: LifecycleTarget | null | undefined): void {
  // Ref stabile: evita di reinstallare i listener quando `target` cambia
  // referenza tra render (es. wrapper che ricrea l'oggetto).
  const targetRef = useRef<LifecycleTarget | null | undefined>(target);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    if (!hasDocument()) return;

    // ---- Segnale 1: Visibility API (web + WebView) ----
    function handleVisibilityChange() {
      const t = targetRef.current;
      if (!t) return;
      if (document.hidden) {
        if (t.currentState === "running") t.pause();
      } else {
        if (t.currentState === "paused") t.resume();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ---- Segnale 2: Capacitor App plugin (nativo) ----
    // Import dinamico per evitare errori su web puro (dove @capacitor/app esiste
    // come dipendenza ma il bridge nativo non è disponibile).
    let capacitorCleanup: (() => void) | null = null;

    if (isCapacitorNative()) {
      import("@capacitor/app")
        .then(({ App }) => {
          const listenerPromise = App.addListener(
            "appStateChange",
            ({ isActive }: { isActive: boolean }) => {
              const t = targetRef.current;
              if (!t) return;
              if (!isActive) {
                if (t.currentState === "running") t.pause();
              } else {
                if (t.currentState === "paused") t.resume();
              }
            },
          );

          // Salva il cleanup per la rimozione al teardown del hook.
          listenerPromise
            .then((handle) => {
              capacitorCleanup = () => void handle.remove();
            })
            .catch(() => {
              // addListener fallito: no-op.
            });
        })
        .catch(() => {
          // Import fallito: segnale Capacitor non disponibile, si usa solo
          // la Visibility API (già registrata sopra).
        });
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      capacitorCleanup?.();
    };
  }, []); // effetto stabile: i listener si installano una sola volta al mount
}
