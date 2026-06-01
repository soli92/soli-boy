// TSK-021 — EmulatorJsEngine: adapter EmulatorEngine reale su EmulatorJS (ADR-004).
// EmulatorJS è una libreria a script globale che si monta in un nodo DOM e gestisce
// loop/input/audio. Questo adapter la incapsula dietro l'interfaccia stabile EmulatorEngine.
//
// NOTA (ADR-004): non unit-testabile in jsdom (richiede WASM/DOM reali). La validazione
// runtime è delegata a TSK-024 (e2e con ROM homebrew). Le chiamate all'API EJS sono
// difensive perché la superficie varia per versione: confermare in TSK-024.

import type {
  AudioSettings,
  EmulatorEngine,
  GameButton,
  LoadOptions,
  SpeedSettings,
} from "./core-wrapper";

/** Superficie minima dell'istanza EmulatorJS usata da questo adapter. */
interface EjsInstance {
  play?: () => void;
  pause?: () => void;
  setVolume?: (v: number) => void;
  /** simulateInput(player, retroButtonIndex, value 0|1). */
  simulateInput?: (player: number, index: number, value: number) => void;
  callEvent?: (name: string) => void;
}

interface EjsWindow extends Window {
  EJS_player?: HTMLElement | string;
  EJS_core?: string;
  EJS_gameUrl?: string;
  EJS_pathtodata?: string;
  EJS_startOnLoaded?: boolean;
  EJS_ready?: () => void;
  EJS_emulator?: EjsInstance;
}

/** Mapping GameButton → indice pulsante RetroArch (RETRO_DEVICE_ID_JOYPAD_*). */
const RETRO_BUTTON: Record<GameButton, number> = {
  b: 0,
  select: 2,
  start: 3,
  up: 4,
  down: 5,
  left: 6,
  right: 7,
  a: 8,
};

const DEFAULT_PATHTODATA =
  "https://cdn.jsdelivr.net/npm/@emulatorjs/emulatorjs@4.2.1/data/";

export class EmulatorJsEngine implements EmulatorEngine {
  readonly capabilities = { rewind: false };

  private objectUrl: string | null = null;
  private loaderInjected = false;

  constructor(private readonly pathtodata: string = DEFAULT_PATHTODATA) {}

  private get win(): EjsWindow {
    return window as unknown as EjsWindow;
  }

  private get ejs(): EjsInstance | undefined {
    return this.win.EJS_emulator;
  }

  /** Timeout (ms) entro cui EJS_ready deve essere emesso prima di fallire. */
  readyTimeoutMs = 30_000;

  async load(opts: LoadOptions): Promise<void> {
    if (!opts.container) {
      throw new Error("EmulatorJsEngine.load: container DOM mancante (TSK-022).");
    }

    // EmulatorJS richiede un SELETTORE CSS per EJS_player (non un HTMLElement):
    // assicura un id sul container e passa il selettore.
    if (!opts.container.id) opts.container.id = "ejs-player";
    const w = this.win;
    w.EJS_player = `#${opts.container.id}`;
    w.EJS_core = opts.core;
    w.EJS_gameUrl = this.objectUrl = URL.createObjectURL(opts.rom);
    w.EJS_pathtodata = this.pathtodata;
    w.EJS_startOnLoaded = false;

    // TSK-021 iter 2 (TS-ROBUST-001): distingui successo da errore e applica un timeout,
    // così un fallimento del loader / EJS_ready mai emesso non resta mascherato.
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("EmulatorJsEngine.load: timeout, EJS_ready non emesso."));
        }, this.readyTimeoutMs);

        w.EJS_ready = () => {
          clearTimeout(timer);
          resolve();
        };
        if (!this.loaderInjected) {
          const s = document.createElement("script");
          s.src = `${this.pathtodata}loader.js`;
          // TSK-023: caricamento CDN robusto sotto COEP require-corp (jsdelivr invia CORS+CORP).
          s.crossOrigin = "anonymous";
          s.onerror = () => {
            clearTimeout(timer);
            reject(new Error(`EmulatorJsEngine.load: caricamento loader fallito (${s.src}).`));
          };
          document.body.appendChild(s);
          this.loaderInjected = true;
        }
      });
    } catch (e) {
      // Cleanup su fallimento: revoke dell'Object URL e reset, poi propaga l'errore.
      if (this.objectUrl) {
        URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = null;
      }
      this.loaderInjected = false;
      throw e;
    }
  }

  start(): void {
    this.ejs?.play?.();
  }
  pause(): void {
    this.ejs?.pause?.();
  }
  resume(): void {
    this.ejs?.play?.();
  }
  stop(): void {
    this.ejs?.pause?.();
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  setAudio(settings: AudioSettings): void {
    const v = settings.mute ? 0 : Math.min(1, Math.max(0, settings.volume));
    this.ejs?.setVolume?.(v);
  }

  sendInput(button: GameButton, pressed: boolean): void {
    this.ejs?.simulateInput?.(0, RETRO_BUTTON[button], pressed ? 1 : 0);
  }

  setSpeed(_settings: SpeedSettings): void {
    // Fast-forward/rewind dipendono dalla versione/core EJS → da confermare in TSK-024.
    // Conservativo: no-op finché non validato (capabilities.rewind = false).
  }
}
