// TSK-008 — Player: viewport + mount del core (US-010).
// TSK-014 — controlli pausa/ripresa/arresto (US-011).
// TSK-035 — Schermo intero (US-020): Fullscreen API sul contenitore `.sb-screen`,
//           engine-agnostico (vedi design_&_architecture/architecture-overview.md §EP-005).
// TSK-036 — Scala + aspect ratio (US-021): CSS sul contenitore `.sb-screen` e
//           regola scoped per il `<canvas>` interno (object-fit). Persistenza
//           via `VideoSettingsPort` (opzionale). Engine-agnostico.
// TSK-037 — Filtri base (US-022): nearest/smoothing/scanline. `image-rendering`
//           sul canvas (regola scoped accanto a object-fit) + overlay scanline
//           via CSS dentro `.sb-screen` (sopra il canvas, pointer-events:none).
//           Engine-agnostico anche qui: nessuna modifica a `EmulatorEngine`.
// TSK-041 — Bugfix runtime US-016 AC3: canvas perso dopo WasmBoy.loadState.
//           Causa: `.sb-screen` veniva passato all'engine come container ma
//           contiene anche figli React (placeholder testuale + overlay scanline).
//           Il canvas appeso imperativamente da WasmBoyEngine.ensureCanvas è un
//           nodo "non-React" tra fratelli React: su re-render React riconcilia
//           i figli di `.sb-screen` e può rimuovere/clobberare quel canvas.
//           Fix engine-agnostico: introdurre un host React-VUOTO dedicato
//           (`<div ref={canvasHostRef} className="sb-canvas-host" />`) DENTRO
//           `.sb-screen`. Il canvas vive solo lì; React non riconcilia mai i
//           figli dell'host (nessun figlio React dichiarato). Placeholder
//           testuale e overlay scanline restano fratelli dell'host dentro
//           `.sb-screen`, così CSS scoping e fullscreen restano invariati.
// Monta il viewport di gioco e avvia l'esecuzione tramite CoreWrapper (ADR-003).
// L'EmulatorEngine (EmulatorJS in runtime) è iniettato → componente testabile.

import { useId, useMemo, useRef, useState } from "react";
// TSK-062 — Gamepad detection: auto-hide TouchOverlay quando un controller BT è connesso.
import { useGamepadDetection } from "../../domain/useGamepadDetection";
// TSK-065 — App lifecycle: pausa/ripresa emulazione in background via Capacitor + visibility API.
import { useAppLifecycle } from "../../domain/useAppLifecycle";
import {
  CoreWrapper,
  type EmulatorEngine,
  type LoadOptions,
} from "../../core/core-wrapper";
import type { Core } from "../../domain/types";
import { useFullscreen } from "./useFullscreen";
import { SaveStatePanel, type SaveServicePort } from "./SaveStatePanel";
import {
  aspectToCanvasObjectFit,
  filterShowsScanlineOverlay,
  filterToCanvasImageRendering,
  useVideoSettings,
  videoSettingsToContainerStyle,
  type VideoSettings,
  type VideoSettingsPort,
} from "./useVideoSettings";
// TSK-060 / TSK-061 — TouchOverlay: D-pad + pulsanti virtuali + config persistita (US-026/US-027).
import type { InputMapping } from "../../domain/input-mapping";
import type { ConfigPort } from "../../storage/port";
import { TouchOverlay } from "../TouchOverlay/TouchOverlay";

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
  /**
   * TSK-032 — servizio di dominio per i save state (US-016, ADR-006).
   * Se assente, il pannello "Save state" non viene reso (composizione legacy
   * o test focalizzati su altri aspetti del Player non lo richiedono).
   */
  saveService?: SaveServicePort;
  /**
   * TSK-032 — ID della ROM in sessione, usato dal pannello save state per
   * filtrare ed etichettare le entry (US-018 AC2: solo i saves del gioco
   * corrente). Senza romId il pannello si auto-disabilita.
   */
  romId?: string;
  /**
   * TSK-032 — core canonico della ROM corrente. Il pannello lo passa al
   * SaveService.loadState per il guard cross-engine (ADR-006 §Conseguenze).
   */
  currentCore?: Core;
  /**
   * TSK-060 — InputMapping da passare al TouchOverlay per instradare gli eventi
   * touch verso il core. Se assente, il TouchOverlay non viene montato (backward
   * compat — test legacy invariati).
   */
  inputMapping?: InputMapping;
  /**
   * TSK-061 — Porta di persistenza per la config TouchOverlay (US-027).
   * Se assente, la config TouchOverlay usa solo lo stato locale (no crash).
   */
  touchConfigStorage?: ConfigPort;
  /**
   * TSK-066 — Feedback aptico abilitato (US-032).
   * Propagato al TouchOverlay; default false (no vibrazione).
   */
  hapticsEnabled?: boolean;
  /**
   * TSK-062 — Nasconde il TouchOverlay quando un gamepad BT è connesso (default: true).
   * Corrisponde al toggle "Nascondi overlay con gamepad" in Settings (US-028).
   */
  hideOverlayWhenGamepad?: boolean;
}

export function Player({
  engine,
  rom,
  title,
  videoSettings,
  videoConfigPort,
  saveService,
  romId,
  currentCore,
  inputMapping,
  touchConfigStorage,
  hapticsEnabled = false,
  hideOverlayWhenGamepad = true,
}: PlayerProps) {
  const wrapper = useMemo(() => new CoreWrapper(engine), [engine]);
  const [state, setState] = useState(wrapper.currentState);

  // TSK-062 — Gamepad API: rilevamento connessione controller BT.
  // L'inputMapping viene passato così il polling dei pulsanti invia input al core.
  const { connected: gamepadConnected } = useGamepadDetection(inputMapping);

  // TSK-065 — App lifecycle: pausa/ripresa emulazione quando l'app va in background.
  // Passiamo `wrapper` come target (ha pause/resume/currentState).
  // Re-sincroniamo `state` locale dopo le chiamate interne al wrapper, ma
  // useAppLifecycle chiama direttamente wrapper.pause/resume: il `state` React
  // si desincronizza. Per mantenere coerenza, passiamo un proxy che aggiorna
  // `setState` insieme ai metodi del wrapper.
  const lifecycleTarget = useMemo(() => ({
    pause() {
      wrapper.pause();
      setState(wrapper.currentState);
    },
    resume() {
      wrapper.resume();
      setState(wrapper.currentState);
    },
    get currentState() {
      return wrapper.currentState;
    },
  }), [wrapper]);

  useAppLifecycle(lifecycleTarget);
  const [error, setError] = useState<string | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  // TSK-041 — host React-vuoto per il canvas imperativo dell'engine. Sta
  // DENTRO `.sb-screen` (così il CSS scoped `.sb-screen ... canvas` continua
  // a matchare il canvas appeso dall'engine) ma non ha figli React, quindi
  // React non riconcilia mai il suo contenuto. Questo isola il canvas
  // imperativo dal flusso di re-render (vedi commento di intestazione).
  const canvasHostRef = useRef<HTMLDivElement>(null);

  // TSK-035 — fullscreen sul contenitore del viewport (engine-agnostico).
  const fullscreen = useFullscreen(screenRef);

  // TSK-036 — preferenze video. Se il componente è controllato dall'esterno
  // (prop `videoSettings`), saltiamo lo stato interno; altrimenti carichiamo
  // dalla porta (opzionale) e gestiamo qui lo stato.
  // F-036-06: `internal.value` è SEMPRE definito (l'hook ritorna i default in
  // attesa del load), quindi un secondo `?? DEFAULT_VIDEO_SETTINGS` sarebbe
  // dead code.
  const internal = useVideoSettings(videoConfigPort);
  const effectiveSettings: VideoSettings = videoSettings ?? internal.value;

  // Stile inline sul contenitore: width (in funzione del fattore) + aspect-ratio.
  const screenStyle = videoSettingsToContainerStyle(effectiveSettings);
  // `object-fit` per il canvas interno reso dall'adapter. Veicolato via un
  // selettore scoped sull'id univoco del contenitore (evita di toccare il CSS
  // globale e resta engine-agnostico).
  const screenId = useId();
  const canvasObjectFit = aspectToCanvasObjectFit(effectiveSettings.aspect);
  // TSK-037 — filtro: `image-rendering` sul canvas + overlay scanline (US-022).
  const canvasImageRendering = filterToCanvasImageRendering(
    effectiveSettings.filter,
  );
  const showScanlineOverlay = filterShowsScanlineOverlay(
    effectiveSettings.filter,
  );

  async function handlePlay() {
    setError(null);
    try {
      // TSK-022 / TSK-041: passa al motore l'HOST DEDICATO (React-vuoto) e non
      // `.sb-screen`, così il canvas imperativo non ha mai fratelli React che
      // possano causarne la rimozione su re-render (anti-pattern React↔DOM
      // imperativo che bloccava US-016 AC3 dopo `WasmBoy.loadState`). Fallback
      // su screenRef solo se l'host non è ancora montato (test legacy): il
      // canvas resterebbe comunque dentro `.sb-screen`, ma senza l'isolamento.
      const container =
        canvasHostRef.current ?? screenRef.current ?? undefined;
      if (wrapper.currentState === "idle")
        await wrapper.load({ ...rom, container });
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
          box, object-fit dipende dall'aspect scelto (contain | fill).
          TSK-037 — `image-rendering` sul canvas (pixelated/auto) e overlay
          scanline (US-022): un elemento .sb-scanline sopra il canvas con un
          repeating-linear-gradient, pointer-events:none, posizionato in
          assoluto dentro `.sb-screen`. */}
      <style>{`
        .sb-screen[data-video-scope="${scopeId}"] {
          position: relative;
        }
        /* TSK-041 — host React-vuoto per il canvas imperativo: riempie
           l'intero box di .sb-screen cosi la resa visiva resta identica.
           position:absolute + inset:0 evita di influenzare il layout dei
           fratelli (placeholder testuale, overlay scanline). */
        .sb-screen[data-video-scope="${scopeId}"] .sb-canvas-host {
          position: absolute;
          inset: 0;
        }
        .sb-screen[data-video-scope="${scopeId}"] canvas {
          width: 100%;
          height: 100%;
          object-fit: ${canvasObjectFit};
          image-rendering: ${canvasImageRendering};
          display: block;
        }
        ${
          // F-037-03: la regola dell'overlay viene serializzata SOLO quando il
          // filtro corrente lo richiede (filter=scanline). Quando l'overlay non
          // è reso, evitiamo di iniettare CSS morto. Le regole base (canvas
          // image-rendering/object-fit, .sb-canvas-host, position:relative)
          // restano sempre presenti.
          showScanlineOverlay
            ? `.sb-screen[data-video-scope="${scopeId}"] .sb-scanline {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.25) 0px,
            rgba(0, 0, 0, 0.25) 1px,
            rgba(0, 0, 0, 0) 1px,
            rgba(0, 0, 0, 0) 3px
          );
          mix-blend-mode: multiply;
        }`
            : ""
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
        data-filter={effectiveSettings.filter}
        style={screenStyle}
      >
        {/* TSK-041 — Host dedicato per il canvas imperativo dell'engine.
            NESSUN figlio React qui dentro: React non riconcilia il contenuto
            dell'host, quindi il <canvas> appeso da WasmBoyEngine.ensureCanvas
            non viene mai rimosso/clobberato da re-render del Player (es. il
            re-render che segue handleLoad in SaveStatePanel). Il selettore
            e2e `.sb-screen canvas` continua a matchare (il canvas resta
            discendente di `.sb-screen`). */}
        <div
          ref={canvasHostRef}
          className="sb-canvas-host"
          data-testid="sb-canvas-host"
        />
        {running ? (title ?? "In esecuzione") : paused ? "In pausa" : "Premi Avvia"}
        {/* TSK-037 — Overlay scanline (US-022): reso solo con filter=scanline.
            Dentro `.sb-screen` per ereditare lo scoping CSS sopra. Fratello
            (NON figlio) dell'host canvas: vedi TSK-041. */}
        {showScanlineOverlay && (
          <div
            className="sb-scanline"
            aria-hidden="true"
            data-testid="scanline-overlay"
          />
        )}
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
      {/* TSK-032 — Pannello "Save state" (US-016, ADR-006 §Decisione p.4).
          Reso solo se la composizione applicativa fornisce un SaveService:
          test e composizioni legacy che non lo passano restano invariati. */}
      {saveService && (
        <SaveStatePanel
          engine={engine}
          saveService={saveService}
          romId={romId}
          currentCore={currentCore}
          isRunning={running}
        />
      )}
      {/* TSK-060 — TouchOverlay: D-pad + pulsanti virtuali su dispositivo touch
          (US-026/US-027). Montato solo se la composizione App inietta
          `inputMapping` (backward compat: test e composizioni legacy invariati).
          Visibilità touch-device effettuata internamente al componente.
          Posizionato DOPO il pannello save state perché l'overlay usa
          `position:absolute` sopra il viewport (z-index gestito internamente). */}
      {inputMapping && (
        <TouchOverlay
          core={rom.core}
          inputMapping={inputMapping}
          storage={touchConfigStorage}
          hapticsEnabled={hapticsEnabled}
          hideWhenGamepad={hideOverlayWhenGamepad}
          gamepadConnected={gamepadConnected}
        />
      )}
    </section>
  );
}
