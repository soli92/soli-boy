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

import { useEffect, useId, useMemo, useRef, useState } from "react";
// TSK-144 (EP-020 Wave B P1) — solids components: Button/Badge shadcn-ui.
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// TSK-062 — Gamepad detection: auto-hide TouchOverlay quando un controller BT è connesso.
import { useGamepadDetection } from "../../domain/useGamepadDetection";
// TSK-065 — App lifecycle: pausa/ripresa emulazione in background via Capacitor + visibility API.
import { useAppLifecycle } from "../../domain/useAppLifecycle";
import {
  CoreWrapper,
  type EmulatorEngine,
  type LoadOptions,
  type SessionState,
} from "../../core/core-wrapper";
import type { Core } from "../../domain/types";
import { useFullscreen } from "./useFullscreen";
import { SaveStatePanel, type SaveServicePort } from "./SaveStatePanel";
import type {
  AutosaveSramResult,
  RestoreSramResult,
} from "../../domain/save-service";
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

/**
 * Operazioni SRAM (salvataggio in-game/batteria, US-017) consumate dal Player
 * per ripristinare il salvataggio all'avvio e persisterlo quando si lascia il
 * gioco. Segregato dal `SaveServicePort` (save state, US-016): il `SaveService`
 * di dominio le implementa entrambe, ma i due gruppi hanno cicli di vita diversi
 * (SRAM = lifecycle del gioco; save state = azione esplicita dell'utente).
 */
export interface SramPort {
  restoreSram(engine: EmulatorEngine, romId: string): Promise<RestoreSramResult>;
  autosaveSram(engine: EmulatorEngine, romId: string): Promise<AutosaveSramResult>;
}

// TSK-103 — etichette HUD localizzate (UX-018): centralizzate qui per
// evitare drift fra componente, test e visual/functional oracle. Lo stato
// `loaded` (transitorio post-load, pre-start) eredita la label di idle:
// l'utente lo percepisce come "non ancora avviato".
const HUD_STATE_LABELS: Record<"idle" | "loaded" | "running" | "paused", string> = {
  idle: "Premi Avvia",
  loaded: "Premi Avvia",
  running: "In esecuzione",
  paused: "In pausa",
};
const HUD_TITLE_IDLE = "Nessun gioco selezionato";

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
  saveService?: SaveServicePort & Partial<SramPort>;
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
  /**
   * TSK-100 (US-053) — Avvio automatico ROM dalla Library (UX-CF1-01 "tap = start").
   *
   * Quando `true` e il Player è in stato `idle` con una ROM "reale" (fileBlob
   * non vuoto), il Player invoca `handlePlay()` automaticamente al mount /
   * all'aggiornamento della ROM, senza richiedere il click manuale su "Avvia".
   *
   * Backward compat: default `false`/`undefined` → comportamento legacy
   * (l'utente preme manualmente "Avvia"). Il trigger è guardato da un ref
   * interno (`autoStartedForRomRef`) che memorizza l'identità del Blob ROM già
   * autoavviato: una nuova ROM riattiva il trigger; ri-render con la stessa ROM
   * è no-op (no loop, no doppi `wrapper.load`).
   *
   * NB: blob "vuoti" (placeholder `new Blob()` di App.tsx in stato idle, vedi
   * App.tsx#385-393) sono ignorati — l'auto-avvio richiede una ROM materiale.
   *
   * TSK-102 (futuro) — il toggle Settings "Avvio automatico dalla libreria"
   * controllerà a livello App.tsx il valore qui passato (oggi App.tsx ne usa
   * un default ON quando la selezione viene dalla Library, vedi
   * `handleLibrarySelect`).
   */
  autoStart?: boolean;
  /**
   * TSK-101 (US-053) — Callback osservazionale sullo stato di sessione del
   * Player ("idle" | "loaded" | "running" | "paused").
   *
   * App.tsx la usa per tracciare a livello composizione lo stato del Player
   * senza duplicare la sorgente di verità: lo stato canonico resta nel
   * `CoreWrapper` (R.M1 single-source-of-truth). Necessaria per il gate di
   * conferma cambio gioco (UX-CF1-02): tap su una ROM diversa mentre il
   * Player è `running` o `paused` apre un dialog modale ("Cambia gioco?")
   * prima di sostituire `selected`. Senza esposizione di `state` ad App.tsx
   * il gate sarebbe scollegato dalla realtà del gioco.
   *
   * Contratto:
   * - Invocata al mount con lo stato iniziale ("idle").
   * - Invocata a ogni transizione di `state` (idle/loaded/running/paused),
   *   dopo che il `setState` ha causato il re-render.
   * - Semantica fire-and-forget: il Player non si aspetta alcun ritorno.
   *
   * Backward compat: default `undefined` → no-op (nessuna call), tutti i test
   * legacy continuano a passare invariati.
   */
  onStateChange?: (state: SessionState) => void;
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
  autoStart = false,
  onStateChange,
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

  // US-017 — persiste la SRAM (salvataggio in-game/batteria) della ROM corrente.
  // Best-effort: un fallimento non deve impedire pausa/stop/uscita. No-op se la
  // composizione non fornisce il SaveService o non c'è una ROM in sessione.
  async function persistSram() {
    if (!saveService?.autosaveSram || !romId) return;
    try {
      await saveService.autosaveSram(engine, romId);
    } catch {
      // Salvataggio best-effort: l'engine può non esporre la SRAM (capability)
      // o non avere battery RAM. Non propaghiamo nell'area errori del Player.
    }
  }

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
      if (wrapper.currentState === "idle") {
        await wrapper.load({ ...rom, container });
        // US-017 — ripristina la SRAM persistita PRIMA di avviare il loop, così
        // il gioco parte con il salvataggio in-game della sessione precedente
        // (senza questo wiring la SRAM veniva persa: restoreSram non era mai
        // invocato da nessun consumatore). No-op se non c'è SaveService/ROM o
        // se non esiste SRAM salvata.
        // TSK-092 — SRAM = persistenza best-effort (vedi wiki
        // `save-state-e-sram.md`): un reject di `restoreSram` (SRAM assente,
        // IDB transitorio, engine senza capability) NON deve interrompere
        // l'avvio del gioco né mostrare "ROM non trovata" all'utente — quel
        // messaggio appartiene esclusivamente al fallimento di `wrapper.load()`.
        // Try/catch separato e log non-error (`console.warn`) per coerenza con
        // `persistSram` (best-effort, vedi sopra).
        if (saveService?.restoreSram && romId) {
          try {
            await saveService.restoreSram(engine, romId);
          } catch (sramErr) {
            console.warn(
              "[Player] restoreSram best-effort failed; continuing without SRAM restore",
              sramErr,
            );
          }
        }
      }
      wrapper.start();
      setState(wrapper.currentState);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // TSK-014 — controlli di esecuzione (US-011).
  function handlePause() {
    // Persisti la SRAM (fire-and-forget): WasmBoy mantiene la memoria della
    // cartuccia anche dopo pause/stop, quindi non serve bloccare il comando di
    // pausa. Tenere il handler sincrono preserva il contratto UI (pausa immediata).
    void persistSram();
    wrapper.pause();
    setState(wrapper.currentState);
  }
  function handleResume() {
    wrapper.resume();
    setState(wrapper.currentState);
  }
  function handleStop() {
    void persistSram();
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

  // TSK-100 (US-053) — Auto-start ROM dalla Library (UX-CF1-01 "tap = start").
  // Trigger una sola volta per identità del Blob ROM: il ref memorizza l'ultimo
  // blob autoavviato così su re-render con la stessa ROM non rilanciamo
  // `handlePlay`. Il ref si resetta implicitamente quando il blob cambia (nuova
  // ROM in sessione). `handlePlayRef` è aggiornato ad ogni render perché
  // `handlePlay` chiude su `wrapper`/`saveService`/`romId`/`rom`/`engine`: senza
  // ref-stable la deps array sarebbe enorme e fragile (esaustivo solo a costo
  // di riavviare l'effect su ogni input). Pattern già utilizzato da React docs
  // per "trigger su evento" — vedi useEffectEvent (pattern equivalente).
  const handlePlayRef = useRef(handlePlay);
  useEffect(() => {
    handlePlayRef.current = handlePlay;
  });
  const autoStartedForRomRef = useRef<Blob | null>(null);
  useEffect(() => {
    if (!autoStart) return;
    if (state !== "idle") return;
    // F-100-01: ignora blob "placeholder" vuoti (App.tsx in stato idle senza
    // ROM selezionata monta `new Blob()` per tenere il Player sempre montato).
    // L'auto-avvio richiede una ROM materiale.
    if (rom.rom.size === 0) return;
    // F-100-02: stessa identità Blob già autoavviata → no-op (no loop su
    // re-render). React garantisce stable identity per la stessa `rom` prop
    // finché App.tsx non costruisce un nuovo oggetto LoadOptions.
    if (autoStartedForRomRef.current === rom.rom) return;
    autoStartedForRomRef.current = rom.rom;
    void handlePlayRef.current();
  }, [autoStart, state, rom.rom]);

  // US-017 — autosave SRAM quando l'app passa in background o la pagina viene
  // scaricata. Su mobile l'utente raramente preme "Arresta": tipicamente manda
  // l'app in background (visibilitychange → hidden) o chiude la scheda
  // (pagehide). Senza questo il salvataggio in-game andrebbe perso. Best-effort,
  // attivo solo quando c'è un gioco in esecuzione con SaveService + ROM.
  useEffect(() => {
    if (!saveService?.autosaveSram || !romId) return;
    if (typeof document === "undefined") return;
    const flush = () => {
      if (wrapper.currentState !== "running") return;
      void saveService.autosaveSram?.(engine, romId).catch(() => {
        /* best-effort, vedi persistSram */
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [saveService, romId, engine, wrapper]);

  // TSK-101 (US-053) — Notifica osservazionale ad App.tsx delle transizioni di
  // stato del Player (idle/loaded/running/paused). Effect dedicato e
  // disaccoppiato dalle ramificazioni di handlePlay/Pause/Resume/Stop: react
  // sincronizza `state` con `wrapper.currentState`, quindi è sufficiente
  // osservare `state` per coprire tutti i path (anche `useAppLifecycle` e
  // lifecycleTarget che chiamano `setState`). Una variabile esterna effimera
  // sarebbe equivalente; useEffect garantisce che il consumer riceva la nuova
  // identità DOPO il commit (rispetta R.M1: consumer in linea con la render
  // tree).
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

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
    <section className="sb-player">
      <div className="sb-play-row">
        <div className="sb-play-main">
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
          /* TSK-105 — aspect-ratio invariante in ogni stato (idle/running/paused).
             Token locale soli-boy (non @soli92/solids DS); valore allineato a
             DEFAULT_SCREEN_ASPECT_RATIO in useVideoSettings.ts — modificare in
             sincronia. Lo style inline di videoSettingsToContainerStyle
             sovrascrive per "original"/"4:3"; per "stretch" nessun override
             inline → la CSS fallback garantisce altezza visibile (no jump).
             Fullscreen: la UA applica width:100%/height:100% sul container
             — aspect-ratio resta attivo ma il container si espande a tutto
             schermo (verificato, visual oracle pass TSK-105). */
          --sb-canvas-aspect: 3 / 2;
          aspect-ratio: var(--sb-canvas-aspect);
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
        /* TSK-103 — Overlay icona pausa (UX-019): centrato sopra il canvas,
           non interagibile, opacity ~0.6, font-size ≥48px. Usa il token di
           testo primario di SoliDS con fallback bianco. */
        .sb-screen[data-video-scope="${scopeId}"] .sb-pause-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          font-size: 96px;
          line-height: 1;
          opacity: 0.6;
          color: var(--sd-color-text-primary, #f0e9ff);
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
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
        /* TSK-106 — Layout slot fissi controlli Player (US-055 / UX-020).
           3 slot grid nominali (primary|secondary|fullscreen), sempre presenti
           nel DOM. Bottoni non applicabili: visibility:hidden (NON display:none)
           per preservare spazio + aria-hidden/tabIndex=-1 per l'a11y tree
           (jsdom non computa visibility da <style> iniettato — i test usano
           aria-hidden come contratto). Token @soli92/solids: --sd-space-sm. */
        .sb-player-controls {
          display: grid;
          grid-template-columns: auto auto auto;
          grid-template-areas: "primary secondary fullscreen";
          gap: var(--sd-space-sm, 0.5rem);
          justify-content: start;
          align-items: center;
        }
        /* TSK-174 (US-109 / EP-022) — P2-09 audit finding: su desktop wide
           (>= lg, 1024px) il .sb-player-layout centra la .sb-screen
           (align-items:center) mentre i controlli restavano justify-start,
           creando disallineamento visivo tra HUD / screen (centrati) e la
           barra controlli (ancorata a sinistra della .sb-play-main). Override
           justify-content:center limitato al viewport desktop lg per:
           - preservare il layout mobile portrait (controls a sinistra della
             colonna, comportamento invariato — nessuna regressione TSK-167);
           - preservare il layout landscape non-fullscreen (nessuna media query
             specifica: la regola base resta attiva finche la viewport e
             sotto 1024px, coerente con landscape su mobile/tablet piccolo);
           - non alterare marker DOM stabili (proto-root, theme-switcher,
             sb-privacy-section, sb-legal-card) → ep021-visual-fidelity.e2e.ts
             resta verde (nessuna modifica JSX).
           NB: NON usare backtick attorno a token CSS in questo commento — il
           blocco vive dentro un template literal JS (tag style con
           interpolazione tagged), i backtick chiuderebbero prematuramente
           la template string TS. */
        @media (min-width: 1024px) {
          .sb-player-controls {
            justify-content: center;
          }
        }
        .sb-player-controls > .sb-slot {
          display: flex;
          align-items: center;
        }
        .sb-player-controls > .sb-slot-primary { grid-area: primary; }
        .sb-player-controls > .sb-slot-secondary { grid-area: secondary; }
        .sb-player-controls > .sb-slot-fullscreen { grid-area: fullscreen; }
        /* TSK-144 — placeholder invisibile ora via utility Tailwind "invisible"
           (applicata inline sull'elemento). Selettore CSS legacy rimosso perche
           i bottoni sono ora componenti Button shadcn (no piu .sb-btn class). */
      `}</style>
      {/*
        Variante B — .sb-player-layout: wrapper che gestisce i tre layout:
        1. Portrait non-fullscreen: flex-column (schermo sopra, controlli touch sotto).
        2. Landscape non-fullscreen: flex-row 3-colonne (D-pad | schermo | tasti).
        3. Fullscreen: l'overlay è montato DENTRO .sb-screen (vedi sotto) — il
           wrapper è trasparente al layout (il fullscreen riguarda solo .sb-screen).
        Il TouchOverlay è figlio del wrapper (sibling di .sb-screen) in non-fullscreen;
        in fullscreen è figlio diretto di .sb-screen per restare nel fullscreen context.
      */}
      <div
        className={[
          "sb-player-layout",
          fullscreen.isFullscreen ? "sb-player-fullscreen" : "",
        ].filter(Boolean).join(" ")}
        data-fullscreen={fullscreen.isFullscreen ? "true" : "false"}
      >
        <div
          ref={screenRef}
          // TSK-144 — invarianti game (position:relative, aspect-ratio 16/10,
          // overflow:hidden) espressi via Tailwind utilities; classe `.sb-screen`
          // preservata per compat con CSS scoped runtime (data-video-scope) e
          // test selettori (e2e `.sb-screen canvas`, videoSettings, filter).
          className="sb-screen relative overflow-hidden rounded-md border border-border bg-[var(--sd-screen-bg)] flex items-center justify-center"
          role="img"
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
            aria-describedby="sb-canvas-status"
          />
          {/* TSK-116 — Testo adiacente al canvas (R-03): contesto minimo per AT
              e utenti sighted. Annuncia titolo + stato con prefisso "Gioco corrente".
              Complementare all'HUD (stato breve): qui il focus è il contesto di gioco
              vicino al viewport WASM. */}
          <div
            id="sb-canvas-status"
            className="sb-canvas-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-testid="sb-canvas-status"
          >
            Gioco corrente: {title ?? HUD_TITLE_IDLE} — {HUD_STATE_LABELS[state]}
          </div>
          {/* TSK-103 — Overlay icona pausa (UX-019): elemento puramente visivo
              centrato sopra il canvas quando `state === "paused"`. aria-hidden
              perché il cambio di stato è già annunciato dall'HUD aria-live. */}
          {paused && (
            <div
              className="sb-pause-overlay"
              aria-hidden="true"
              data-testid="pause-overlay"
            >
              ⏸
            </div>
          )}
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
          {/* Variante B — fullscreen: TouchOverlay DENTRO .sb-screen per restare
              nel fullscreen context (requestFullscreen su .sb-screen include solo
              i figli diretti nel rendering fullscreen). Comportamento INCREMENT 3
              invariato: position:absolute; inset:0 ancorato al viewport di gioco.
              Montato solo se la composizione App inietta `inputMapping`. */}
          {inputMapping && fullscreen.isFullscreen && (
            <TouchOverlay
              core={rom.core}
              inputMapping={inputMapping}
              storage={touchConfigStorage}
              hapticsEnabled={hapticsEnabled}
              hideWhenGamepad={hideOverlayWhenGamepad}
              gamepadConnected={gamepadConnected}
              isFullscreen={true}
            />
          )}
        </div>

        {/* Variante B — non-fullscreen: TouchOverlay FUORI da .sb-screen,
            sibling nel .sb-player-layout. In portrait: compare sotto lo schermo
            (flex-column del wrapper). In landscape: CSS 3-colonne posiziona D-pad
            a sinistra e pulsanti a destra tramite la classe sb-touch-landscape.
            Il componente riceve isFullscreen=false (default) per usare il layout
            in flusso (portrait) o landscape CSS.
            Montato solo in non-fullscreen e se `inputMapping` è presente. */}
        {inputMapping && !fullscreen.isFullscreen && (
          <TouchOverlay
            core={rom.core}
            inputMapping={inputMapping}
            storage={touchConfigStorage}
            hapticsEnabled={hapticsEnabled}
            hideWhenGamepad={hideOverlayWhenGamepad}
            gamepadConnected={gamepadConnected}
            isFullscreen={false}
          />
        )}
      </div>
      {/* TSK-103 / TSK-116 — HUD user-facing (UX-018): titolo ROM + stato in
          italiano. aria-live sul solo span stato (complementare al canvas status
          che annuncia il contesto completo "Gioco corrente: …").
          TSK-144 (EP-020) — layout HUD via Tailwind utilities + Badge solids
          per lo stato (semantica invariante: role="status", aria-live, aria-atomic
          preservati sul Badge esterno — vedi Player.hud.test.tsx). */}
      <div
        className="flex items-center justify-between text-xs text-muted-foreground font-mono px-2 py-1"
        data-testid="sb-hud"
        aria-label="Stato giocatore"
      >
        <span>{title ?? HUD_TITLE_IDLE}</span>
        <Badge
          variant="outline"
          className="font-mono text-xs"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {HUD_STATE_LABELS[state]}
        </Badge>
      </div>
      {/* TSK-106 — Container dei controlli con layout a slot fissi (US-055 AC1).
          3 slot grid stabili: primary (Avvia/Pausa/Riprendi), secondary
          (Arresta, vuoto in idle), fullscreen (sempre presente). Lo slot
          primario contiene SEMPRE un bottone (mai placeholder), così la
          posizione fisica del primario non cambia tra gli stati (AC2).
          Lo slot secondary contiene un placeholder (visibility:hidden) in
          idle, dove "Arresta" non è applicabile (AC3). Lo slot fullscreen è
          invariato (sempre presente).
          data-testid="player-controls" + data-slot per le asserzioni DOM dei
          test (vedi Player.test.tsx — TSK-106). */}
      <div
        className="sb-player-controls"
        data-testid="player-controls"
        role="group"
        aria-label="Controlli Player"
      >
        {/* Slot 1 — primary: Avvia (idle) | Pausa (running) | Riprendi (paused).
            SEMPRE renderizzato come un singolo <button> reale (mai placeholder),
            così la sua posizione fisica nel grid è invariante tra gli stati. */}
        <div className="sb-slot sb-slot-primary" data-slot="primary">
          {/* TSK-144 — mapping variant: Avvia/Riprendi = default (primary CTA),
              Pausa = outline (azione secondaria durante running). */}
          {idle && (
            <Button
              variant="default"
              onClick={handlePlay}
              data-action="play"
            >
              Avvia
            </Button>
          )}
          {running && (
            <Button
              variant="outline"
              onClick={handlePause}
              data-action="pause"
            >
              Pausa
            </Button>
          )}
          {paused && (
            <Button
              variant="default"
              onClick={handleResume}
              data-action="resume"
            >
              Riprendi
            </Button>
          )}
        </div>
        {/* Slot 2 — secondary: Arresta (running/paused) | placeholder (idle).
            In idle "Arresta" non è applicabile: rendo un placeholder con
            visibility:hidden (preserva spazio del grid, NON display:none),
            aria-hidden + tabIndex=-1 per escluderlo dall'a11y tree e dal tab
            order. I test legacy che cercano "arresta" via getByRole restano
            OK perché in idle il placeholder ha aria-hidden=true (e in
            running/paused il bottone reale è renderizzato normalmente). */}
        <div className="sb-slot sb-slot-secondary" data-slot="secondary">
          {/* TSK-144 — Arresta = destructive; placeholder in idle usa la utility
              Tailwind `invisible` (preserva lo spazio grid, vedi TSK-106 AC),
              aria-hidden + tabIndex=-1 per escluderlo dall'a11y tree. */}
          {!idle ? (
            <Button
              variant="destructive"
              onClick={handleStop}
              data-action="stop"
            >
              Arresta
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              className="invisible"
              data-slot-placeholder="true"
              aria-hidden="true"
              tabIndex={-1}
              disabled
            >
              Arresta
            </Button>
          )}
        </div>
        {/* Slot 3 — fullscreen: TSK-035 (US-020) sempre visibile come controllo
            essenziale; disabilitato se l'API non è supportata. */}
        <div className="sb-slot sb-slot-fullscreen" data-slot="fullscreen">
          {/* TSK-144 — Fullscreen toggle = outline (azione secondaria). */}
          <Button
            type="button"
            variant="outline"
            onClick={handleFullscreenToggle}
            disabled={!fullscreen.supported}
            aria-label={fsLabel}
            aria-pressed={fullscreen.isFullscreen}
            title={
              fullscreen.supported
                ? fsLabel
                : "Schermo intero non supportato dal browser"
            }
            data-action="fullscreen"
          >
            {fsLabel}
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-muted-foreground" role="alert">
          {error}
        </p>
      )}
        </div>
      {/* EP-021 — Save state sidebar su desktop (sotto lo schermo su mobile). */}
      {saveService && (
        <SaveStatePanel
          className="save-panel-desktop"
          engine={engine}
          saveService={saveService}
          romId={romId}
          currentCore={currentCore}
          isRunning={running}
        />
      )}
      </div>
    </section>
  );
}
