// TSK-025 — WasmBoyEngine: adapter EmulatorEngine reale su WasmBoy (GB/GBC, ADR-005).
// WasmBoy è ESM (no script globale / no decompressione core da CDN): supera i problemi
// di EmulatorJS (gap emulatorjs-real-integration). Singleton WasmBoy → un gioco alla volta.
// TSK-030 (ADR-006) — esteso con snapshot/restore + SRAM (US-016/US-017).
import { WasmBoy, type WasmBoyJoypadState, type WasmBoySaveState } from "wasmboy";
import type { RtcBridge } from "../domain/rtc-service";
import type {
  AudioSettings,
  EmulatorEngine,
  EngineCapabilities,
  GameButton,
  LoadOptions,
  SpeedSettings,
} from "./core-wrapper";

const WASMBOY_OPTIONS = {
  isAudioEnabled: true,
  useGbcWhenOptional: true,
  isGbcEnabled: true,
  frameSkip: 0,
};

// TSK-060 / TSK-123: GB/GBC non ha shoulder button (L/R) → mappa parziale in BTN.
// sendInput ignora l/r prima di WasmBoy.setJoypadState (no-op corretto).
const BTN: Partial<Record<GameButton, keyof WasmBoyJoypadState>> = {
  up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT",
  a: "A", b: "B", start: "START", select: "SELECT",
  // L/R: no-op su GB/GBC (hardware non dispone di shoulder) — guard in sendInput.
};

/**
 * TSK-030 — magic header del payload binario WasmBoy save state.
 * Il save state nativo è un oggetto JS: lo serializziamo come JSON UTF-8 dietro
 * un magic header così:
 *  1) il dominio (SaveService) lo tratta come opaque blob conforme all'interfaccia;
 *  2) `restore()` rifiuta in modo onesto blob non prodotti da WasmBoy (cross-engine).
 */
const WASMBOY_SAVE_MAGIC = "WBSV1";

export class WasmBoyEngine implements EmulatorEngine {
  // TSK-030: WasmBoy supporta save state nativi e cartridgeRam → entrambe capability ON.
  readonly capabilities: EngineCapabilities = {
    rewind: false,
    saveStates: true,
    sram: true,
  };

  // ADR-009: bridge concreto (WasmBoyRtcBridge) pianificato Sprint 16 — stub
  // null mantiene flusso best-effort no-op in GameSession persist/restore
  // (TSK-128, ADR-009 §4).
  readonly rtcBridge: RtcBridge | null = null;

  private configured = false;
  private joypad: WasmBoyJoypadState = {};
  /**
   * Stato di riproduzione AUTORITATIVO tracciato dall'adapter, mirror dei nostri
   * comandi play/pause. NON ci affidiamo a `WasmBoy.isPlaying()` perché la lib
   * inizializza `paused=false` (→ isPlaying()=true) già prima del primo play():
   * un restore eseguito su un engine caricato-ma-mai-avviato lo farebbe partire
   * da solo. Inoltre `pause()` della lib risolve in modo asincrono, mentre questo
   * flag riflette subito l'intento, evitando race in `restore`.
   */
  private playing = false;

  async load(opts: LoadOptions): Promise<void> {
    if (!opts.container) throw new Error("WasmBoyEngine.load: container DOM mancante.");
    // TSK-093 (P3-10, finding code-review): App.tsx passa al Player un `new Blob()` come
    // placeholder ROM quando `selected === null` (stato idle). Una race condition (utente
    // preme "Avvia" prima che `selected` sia valorizzato) inoltrerebbe un Uint8Array vuoto
    // a `WasmBoy.loadROM`, con comportamento imprevedibile della lib. Guard precoce con
    // messaggio canonico distinguibile: il catch in Player.handlePlay lo mostrerà all'utente
    // come normale errore di caricamento (AC-4).
    if (opts.rom.size === 0) {
      throw new Error("WasmBoyEngine.load: ROM vuota — Blob privo di contenuto.");
    }
    const canvas = this.ensureCanvas(opts.container);
    await WasmBoy.config(WASMBOY_OPTIONS, canvas);
    this.configured = true;
    const bytes = new Uint8Array(await opts.rom.arrayBuffer());
    await WasmBoy.loadROM(bytes);
  }

  start(): void {
    this.run(WasmBoy.play(), "play");
    this.playing = true;
  }
  pause(): void {
    this.run(WasmBoy.pause(), "pause");
    this.playing = false;
  }
  resume(): void {
    // Guard: no-op se l'engine non è ancora configurato (nessuna ROM caricata).
    // Difesa in profondità rispetto al guard in CoreWrapper.resume(): protegge
    // da chiamate dirette sull'adapter (es. LifecycleTarget proxy) o da percorsi
    // non mediati da CoreWrapper (architettura "Player sempre montato" con
    // visibility/resume che potrebbe arrivare prima del primo load).
    if (!this.configured) return;
    this.run(WasmBoy.play(), "resume");
    this.playing = true;
  }
  stop(): void {
    this.run(WasmBoy.pause(), "stop");
    this.joypad = {};
    this.playing = false;
  }

  /** TSK-029 (TS-ROBUST-001): interfaccia sync ma API WasmBoy async → non lasciare
   *  la promise non gestita: logga l'errore invece di ingoiarlo. */
  private run(p: Promise<void>, op: string): void {
    p.catch((e) => console.error(`WasmBoyEngine.${op}:`, e));
  }

  /**
   * `WasmBoy.saveState()` e `WasmBoy.loadState()` mettono l'emulatore in PAUSA
   * internamente (`await this.pause()`, vedi wasmboy.ts.esm.js) e NON lo
   * riavviano. Ogni metodo dell'adapter che le usa (snapshot / restore /
   * getSram / loadSram) deve quindi riprendere la riproduzione se l'engine
   * stava girando, altrimenti il loop resta fermo e il canvas si congela
   * mentre il Player continua a credersi "running". Si basa sul flag
   * autoritativo `this.playing` (vedi nota sul campo), non su
   * `WasmBoy.isPlaying()`. No-op se eravamo in pausa/idle (nessun avvio spurio).
   */
  private resumeIfPlaying(): void {
    if (this.playing) this.run(WasmBoy.play(), "resume-after-savestate");
  }

  setAudio(_settings: AudioSettings): void {
    // WasmBoy non espone un setVolume runtime nell'API pubblica; l'audio è gestito
    // via opzione isAudioEnabled. Mute/volume fine-grained: out-of-scope per ora.
  }

  sendInput(button: GameButton, pressed: boolean): void {
    if (!this.configured) return;
    const key = BTN[button];
    // L/R: no-op su GB/GBC (hardware non dispone di shoulder) — TSK-123.
    if (!key) return;
    this.joypad = { ...this.joypad, [key]: pressed };
    WasmBoy.setJoypadState(this.joypad);
  }

  setSpeed(settings: SpeedSettings): void {
    WasmBoy.setSpeed(settings.fastForward ? 2 : 1); // rewind non supportato (capabilities.rewind=false)
  }

  /**
   * TSK-030 / US-016 — cattura save state via API WasmBoy reale.
   * `WasmBoy.saveState()` ritorna un oggetto JS con `wasmboyMemory.*` (incluso
   * cartridgeRam): lo serializziamo come JSON con magic header.
   * Reject onesto se non è stato ancora caricato un gioco o se l'API non c'è.
   */
  async snapshot(): Promise<Uint8Array> {
    if (!this.configured) {
      throw new Error("WasmBoyEngine.snapshot: nessuna ROM caricata (chiamare load prima).");
    }
    if (typeof WasmBoy.saveState !== "function") {
      throw new Error("WasmBoyEngine.snapshot: API WasmBoy.saveState non disponibile a runtime.");
    }
    const state = await WasmBoy.saveState();
    this.resumeIfPlaying(); // saveState() ha messo in pausa: riprendi se giocavamo.
    const serializable = toSerializableSaveState(state);
    const json = JSON.stringify(serializable);
    const body = new TextEncoder().encode(json);
    const header = new TextEncoder().encode(WASMBOY_SAVE_MAGIC);
    const out = new Uint8Array(header.length + body.length);
    out.set(header, 0);
    out.set(body, header.length);
    return out;
  }

  /**
   * TSK-030 / US-016 — ripristina lo stato da uno snapshot prodotto da `snapshot()`.
   * Reject onesto se il magic header non corrisponde (es. snapshot mGBA passato
   * per errore: ADR-006 §Conseguenze — i save state sono engine-specific).
   */
  async restore(state: Uint8Array): Promise<void> {
    if (!this.configured) {
      throw new Error("WasmBoyEngine.restore: nessuna ROM caricata (chiamare load prima).");
    }
    if (typeof WasmBoy.loadState !== "function") {
      throw new Error("WasmBoyEngine.restore: API WasmBoy.loadState non disponibile a runtime.");
    }
    const obj = decodeSaveState(state);
    await WasmBoy.loadState(obj);
    // loadState() mette in pausa internamente e non riavvia: senza questo lo
    // stato viene caricato ma il loop resta fermo (canvas congelato mentre il
    // Player si crede "running") → "carico ma il gioco non cambia". Vedi
    // resumeIfPlaying: riprende SOLO se stavamo effettivamente giocando.
    this.resumeIfPlaying();
  }

  /**
   * TSK-030 / US-017 — legge la SRAM cartuccia corrente.
   * Strategia: estraiamo `cartridgeRam` dallo save state appena catturato
   * (è l'unico modo di ottenere bytes raw dall'API pubblica WasmBoy).
   * Ritorna `null` se cartridgeRam è assente/vuoto (cartuccia senza battery RAM).
   */
  async getSram(): Promise<Uint8Array | null> {
    if (!this.configured) return null;
    if (typeof WasmBoy.saveState !== "function") {
      throw new Error("WasmBoyEngine.getSram: API WasmBoy.saveState non disponibile a runtime.");
    }
    const state = await WasmBoy.saveState();
    this.resumeIfPlaying(); // saveState() ha messo in pausa: riprendi se giocavamo.
    const cr = state?.wasmboyMemory?.cartridgeRam;
    if (!cr) return null;
    const bytes = cr instanceof Uint8Array ? cr : new Uint8Array(cr as ArrayLike<number>);
    return bytes.length > 0 ? new Uint8Array(bytes) : null;
  }

  /**
   * TSK-030 / US-017 — inietta SRAM nella cartuccia caricata.
   * Approccio: cattura lo state corrente, sostituisce solo `cartridgeRam`,
   * lo ricarica via `loadState`. Così evitiamo di toccare API interne (WasmBoyMemory)
   * e restiamo sull'API pubblica.
   */
  async loadSram(data: Uint8Array): Promise<void> {
    if (!this.configured) {
      throw new Error("WasmBoyEngine.loadSram: nessuna ROM caricata (chiamare load prima).");
    }
    if (typeof WasmBoy.saveState !== "function" || typeof WasmBoy.loadState !== "function") {
      throw new Error("WasmBoyEngine.loadSram: API save/loadState WasmBoy non disponibili a runtime.");
    }
    const current = await WasmBoy.saveState();
    const patched: WasmBoySaveState = {
      ...current,
      wasmboyMemory: {
        ...(current.wasmboyMemory ?? {}),
        cartridgeRam: new Uint8Array(data),
      },
    };
    await WasmBoy.loadState(patched);
    this.resumeIfPlaying(); // saveState+loadState hanno messo in pausa: riprendi.
  }

  /** Crea (una sola volta) un <canvas> dentro il container e lo ritorna. */
  private ensureCanvas(container: HTMLElement): HTMLCanvasElement {
    const existing = container.querySelector("canvas");
    if (existing) return existing;
    const canvas = document.createElement("canvas");
    canvas.className = "wasmboy-canvas";
    container.appendChild(canvas);
    return canvas;
  }
}

/**
 * TSK-030 — converte Uint8Array dentro `wasmboyMemory` in array di numeri,
 * altrimenti `JSON.stringify` produrrebbe `{}`. Mirror logico di getSaveStateAsArrays
 * (cfr. wasmboy.ts.esm.js ~L2914).
 */
function toSerializableSaveState(state: WasmBoySaveState): WasmBoySaveState {
  const mem = state.wasmboyMemory ?? {};
  const next: Record<string, number[] | unknown> = {};
  for (const key of Object.keys(mem)) {
    const v = (mem as Record<string, unknown>)[key];
    if (v instanceof Uint8Array) {
      next[key] = Array.prototype.slice.call(v) as number[];
    } else {
      next[key] = v;
    }
  }
  return {
    ...state,
    wasmboyMemory: next as WasmBoySaveState["wasmboyMemory"],
  };
}

/** TSK-030 — decodifica un blob WasmBoy save state, validando magic header. */
function decodeSaveState(state: Uint8Array): WasmBoySaveState {
  const header = new TextEncoder().encode(WASMBOY_SAVE_MAGIC);
  if (state.length < header.length) {
    throw new Error("WasmBoyEngine.restore: snapshot troppo corto / formato non riconosciuto.");
  }
  for (let i = 0; i < header.length; i++) {
    if (state[i] !== header[i]) {
      throw new Error(
        "WasmBoyEngine.restore: magic header non corrisponde (snapshot non prodotto da WasmBoyEngine; cross-engine save states non supportati — ADR-006).",
      );
    }
  }
  const json = new TextDecoder().decode(state.subarray(header.length));
  let parsed: WasmBoySaveState;
  try {
    parsed = JSON.parse(json) as WasmBoySaveState;
  } catch (e) {
    throw new Error(`WasmBoyEngine.restore: payload JSON non valido (${(e as Error).message}).`);
  }
  // Re-promuovi gli array di numeri a Uint8Array per coerenza con la memoria viva.
  const mem = parsed.wasmboyMemory ?? {};
  const restored: Record<string, Uint8Array | unknown> = {};
  for (const key of Object.keys(mem)) {
    const v = (mem as Record<string, unknown>)[key];
    if (Array.isArray(v)) {
      restored[key] = new Uint8Array(v as number[]);
    } else {
      restored[key] = v;
    }
  }
  return {
    ...parsed,
    wasmboyMemory: restored as WasmBoySaveState["wasmboyMemory"],
  };
}
