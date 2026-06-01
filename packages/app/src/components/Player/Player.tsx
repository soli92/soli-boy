// TSK-008 — Player: viewport + mount del core (US-010).
// TSK-014 — controlli pausa/ripresa/arresto (US-011).
// TSK-035 — Schermo intero (US-020): Fullscreen API sul contenitore `.sb-screen`,
//           engine-agnostico (vedi design_&_architecture/architecture-overview.md §EP-005).
// Monta il viewport di gioco e avvia l'esecuzione tramite CoreWrapper (ADR-003).
// L'EmulatorEngine (EmulatorJS in runtime) è iniettato → componente testabile.

import { useMemo, useRef, useState } from "react";
import {
  CoreWrapper,
  type EmulatorEngine,
  type LoadOptions,
} from "../../core/core-wrapper";
import { useFullscreen } from "./useFullscreen";

export interface PlayerProps {
  /** Engine di emulazione (EmulatorJS in runtime). */
  engine: EmulatorEngine;
  /** ROM e core risolti a monte (riconoscimento piattaforma). */
  rom: LoadOptions;
  /** Titolo mostrato nell'HUD. */
  title?: string;
}

export function Player({ engine, rom, title }: PlayerProps) {
  const wrapper = useMemo(() => new CoreWrapper(engine), [engine]);
  const [state, setState] = useState(wrapper.currentState);
  const [error, setError] = useState<string | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  // TSK-035 — fullscreen sul contenitore del viewport (engine-agnostico).
  const fullscreen = useFullscreen(screenRef);

  async function handlePlay() {
    setError(null);
    try {
      // TSK-022: passa il nodo DOM all'engine (gli engine reali, es. WasmBoy, vi montano il canvas).
      if (wrapper.currentState === "idle")
        await wrapper.load({ ...rom, container: screenRef.current ?? undefined });
      wrapper.start();
      setState(wrapper.currentState);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // TSK-014 — controlli di esecuzione (US-011).
  function handlePause() {
    wrapper.pause();
    setState(wrapper.currentState);
  }
  function handleResume() {
    wrapper.resume();
    setState(wrapper.currentState);
  }
  function handleStop() {
    wrapper.stop();
    setState(wrapper.currentState);
  }

  // TSK-035 — toggle schermo intero. Eventuali reject (es. gesto utente mancante,
  // contesto non permesso) sono riportati nell'area `error` come gli altri errori
  // del Player, senza far cadere il componente.
  async function handleFullscreenToggle() {
    setError(null);
    try {
      await fullscreen.toggle();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const idle = state === "idle";
  const running = state === "running";
  const paused = state === "paused";

  const fsLabel = fullscreen.isFullscreen
    ? "Esci da schermo intero"
    : "Schermo intero";

  return (
    <section className="sb-app">
      <div ref={screenRef} className="sb-screen" aria-label="Schermo di gioco" data-state={state}>
        {running ? (title ?? "In esecuzione") : paused ? "In pausa" : "Premi Avvia"}
      </div>
      <div className="sb-hud">
        <span>{rom.core}</span>
        <span>{state}</span>
      </div>
      <div className="sd-flex sd-gap-sm">
        {idle && (
          <button className="sb-btn sb-btn-primary" onClick={handlePlay}>
            Avvia
          </button>
        )}
        {running && (
          <button className="sb-btn" onClick={handlePause}>
            Pausa
          </button>
        )}
        {paused && (
          <button className="sb-btn sb-btn-primary" onClick={handleResume}>
            Riprendi
          </button>
        )}
        {!idle && (
          <button className="sb-btn sb-danger" onClick={handleStop}>
            Arresta
          </button>
        )}
        {/* TSK-035 — bottone schermo intero (US-020): sempre visibile come
            controllo essenziale; disabilitato se l'API non è disponibile
            (fallback onesto, niente fallback custom). */}
        <button
          type="button"
          className="sb-btn"
          onClick={handleFullscreenToggle}
          disabled={!fullscreen.supported}
          aria-label={fsLabel}
          aria-pressed={fullscreen.isFullscreen}
          title={
            fullscreen.supported
              ? fsLabel
              : "Schermo intero non supportato dal browser"
          }
        >
          {fsLabel}
        </button>
      </div>
      {error && (
        <p className="sb-note" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
