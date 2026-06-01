// TSK-008 — Player: viewport + mount del core (US-010).
// TSK-014 — controlli pausa/ripresa/arresto (US-011).
// TSK-035 — Schermo intero (US-020): Fullscreen API sul contenitore `.sb-screen`,
//           engine-agnostico (vedi design_&_architecture/architecture-overview.md §EP-005).
// TSK-036 — Scala + aspect ratio (US-021): CSS sul contenitore `.sb-screen` e
//           regola scoped per il `<canvas>` interno (object-fit). Persistenza
//           via `VideoSettingsPort` (opzionale). Engine-agnostico.
// Monta il viewport di gioco e avvia l'esecuzione tramite CoreWrapper (ADR-003).
// L'EmulatorEngine (EmulatorJS in runtime) è iniettato → componente testabile.

import { useId, useMemo, useRef, useState } from "react";
import {
  CoreWrapper,
  type EmulatorEngine,
  type LoadOptions,
} from "../../core/core-wrapper";
import { useFullscreen } from "./useFullscreen";
import {
  DEFAULT_VIDEO_SETTINGS,
  aspectToCanvasObjectFit,
  useVideoSettings,
  videoSettingsToContainerStyle,
  type VideoSettings,
  type VideoSettingsPort,
} from "./useVideoSettings";

export interface PlayerProps {
  /** Engine di emulazione (EmulatorJS in runtime). */
  engine: EmulatorEngine;
  /** ROM e core risolti a monte (riconoscimento piattaforma). */
  rom: LoadOptions;
  /** Titolo mostrato nell'HUD. */
  title?: string;
  /**
   * TSK-036 — preferenze video (scala + aspect). Se passate, il componente è
   * "controllato" dall'esterno (utile quando la composizione applicativa
   * condivide lo stato con Settings). Altrimenti il Player gestisce uno stato
   * interno opzionalmente persistito via `videoConfigPort`.
   */
  videoSettings?: VideoSettings;
  /** Porta di persistenza opzionale per le preferenze video (US-021). */
  videoConfigPort?: VideoSettingsPort;
}

export function Player({
  engine,
  rom,
  title,
  videoSettings,
  videoConfigPort,
}: PlayerProps) {
  const wrapper = useMemo(() => new CoreWrapper(engine), [engine]);
  const [state, setState] = useState(wrapper.currentState);
  const [error, setError] = useState<string | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  // TSK-035 — fullscreen sul contenitore del viewport (engine-agnostico).
  const fullscreen = useFullscreen(screenRef);

  // TSK-036 — preferenze video. Se il componente è controllato dall'esterno
  // (prop `videoSettings`), saltiamo lo stato interno; altrimenti carichiamo
  // dalla porta (opzionale) e gestiamo qui lo stato.
  const internal = useVideoSettings(videoConfigPort);
  const effectiveSettings: VideoSettings =
    videoSettings ?? internal.value ?? DEFAULT_VIDEO_SETTINGS;

  // Stile inline sul contenitore: width (in funzione del fattore) + aspect-ratio.
  const screenStyle = videoSettingsToContainerStyle(effectiveSettings);
  // `object-fit` per il canvas interno reso dall'adapter. Veicolato via un
  // selettore scoped sull'id univoco del contenitore (evita di toccare il CSS
  // globale e resta engine-agnostico).
  const screenId = useId();
  const canvasObjectFit = aspectToCanvasObjectFit(effectiveSettings.aspect);

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

  // useId genera un id con caratteri ":" che NON sono validi in selettori CSS
  // senza escape: usiamo un data-attribute per agganciare la regola scoped.
  const scopeId = screenId.replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <section className="sb-app">
      {/* TSK-036 — regola scoped per il <canvas> reso dall'adapter all'interno
          del contenitore `.sb-screen`. width/height a 100% per riempire il
          box, object-fit dipende dall'aspect scelto (contain | fill). */}
      <style>{`
        .sb-screen[data-video-scope="${scopeId}"] canvas {
          width: 100%;
          height: 100%;
          object-fit: ${canvasObjectFit};
          display: block;
        }
      `}</style>
      <div
        ref={screenRef}
        className="sb-screen"
        aria-label="Schermo di gioco"
        data-state={state}
        data-video-scope={scopeId}
        data-scale={String(effectiveSettings.scale)}
        data-aspect={effectiveSettings.aspect}
        style={screenStyle}
      >
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
