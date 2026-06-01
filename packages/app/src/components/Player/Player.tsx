// TSK-008 — Player: viewport + mount del core (US-010).
// Monta il viewport di gioco e avvia l'esecuzione tramite CoreWrapper (ADR-003).
// L'EmulatorEngine (EmulatorJS in runtime) è iniettato → componente testabile.

import { useMemo, useState } from "react";
import {
  CoreWrapper,
  type EmulatorEngine,
  type LoadOptions,
} from "../../core/core-wrapper";

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

  async function handlePlay() {
    setError(null);
    try {
      if (wrapper.currentState === "idle") await wrapper.load(rom);
      wrapper.start();
      setState(wrapper.currentState);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section className="sb-app">
      <div className="sb-screen" aria-label="Schermo di gioco" data-state={state}>
        {state === "running" ? (title ?? "In esecuzione") : "Premi Avvia"}
      </div>
      <div className="sb-hud">
        <span>{rom.core}</span>
        <span>{state}</span>
      </div>
      <button className="sb-btn sb-btn-primary" onClick={handlePlay}>
        Avvia
      </button>
      {error && (
        <p className="sb-note" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
