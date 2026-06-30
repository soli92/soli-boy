// EmulatorEngine stub deterministico (placeholder dell'integrazione emulator reale).
// Usato in app finché un adapter non è integrato, e dai test e2e per un
// comportamento riproducibile senza WASM/ROM reali. Non esegue emulazione reale.

import type {
  AudioSettings,
  EmulatorEngine,
  EngineCapabilities,
  GameButton,
  LoadOptions,
  SpeedSettings,
} from "./core-wrapper";

/**
 * Forma dello stato interno serializzato dallo StubEngine (TSK-030).
 * Non rappresenta nulla di reale: è solo abbastanza per consentire al dominio
 * (SaveService, US-016) di esercitare snapshot/restore in unit/e2e test.
 */
interface StubSnapshotV1 {
  v: 1;
  loaded: boolean;
  audio: AudioSettings;
  lastInput: { button: GameButton; pressed: boolean } | null;
  tick: number;
}

/** Magic header del payload binario stub (per riconoscere il formato in restore). */
const STUB_SAVE_MAGIC = "SOLISTUB1";

export class StubEngine implements EmulatorEngine {
  // TSK-030: lo stub espone capability `saveStates`/`sram` per consentire al
  // dominio di esercitare i flussi di salvataggio in test deterministici.
  readonly capabilities: EngineCapabilities = {
    rewind: false,
    saveStates: true,
    sram: true,
  };

  loaded = false;
  audio: AudioSettings = { volume: 1, mute: false };
  lastInput: { button: GameButton; pressed: boolean } | null = null;
  /** Contatore monotono incrementato ad ogni snapshot: rende ogni save state distinguibile. */
  private tick = 0;
  /** SRAM "cartuccia" fittizia. `null` finché non viene popolata (TSK-030 / US-017). */
  private sram: Uint8Array | null = null;

  async load(_opts: LoadOptions): Promise<void> {
    this.loaded = true;
  }
  start(): void {}
  pause(): void {}
  resume(): void {}
  stop(): void {
    this.loaded = false;
  }
  setAudio(settings: AudioSettings): void {
    this.audio = settings;
  }
  // TSK-123: accetta qualsiasi GameButton (inclusi L/R) senza errore — traccia lastInput.
  sendInput(button: GameButton, pressed: boolean): void {
    this.lastInput = { button, pressed };
  }
  setSpeed(_settings: SpeedSettings): void {}

  /**
   * TSK-030 / US-016 — snapshot deterministico round-trippabile.
   * Serializza lo stato interno (loaded, audio, lastInput, tick) come JSON
   * UTF-8 dietro un magic header, così il round-trip restore(snapshot()) è
   * verificabile in unit test senza dipendenze esterne.
   */
  async snapshot(): Promise<Uint8Array> {
    this.tick += 1;
    const payload: StubSnapshotV1 = {
      v: 1,
      loaded: this.loaded,
      audio: { volume: this.audio.volume, mute: this.audio.mute },
      lastInput: this.lastInput ? { ...this.lastInput } : null,
      tick: this.tick,
    };
    const json = JSON.stringify(payload);
    const body = new TextEncoder().encode(json);
    const header = new TextEncoder().encode(STUB_SAVE_MAGIC);
    const out = new Uint8Array(header.length + body.length);
    out.set(header, 0);
    out.set(body, header.length);
    return out;
  }

  /**
   * TSK-030 / US-016 — ripristina lo stato dallo snapshot prodotto da `snapshot()`.
   * Reject onesto se il magic header non corrisponde (formato non riconosciuto).
   */
  async restore(state: Uint8Array): Promise<void> {
    const header = new TextEncoder().encode(STUB_SAVE_MAGIC);
    if (state.length < header.length) {
      throw new Error("StubEngine.restore: snapshot troppo corto / formato non riconosciuto.");
    }
    for (let i = 0; i < header.length; i++) {
      if (state[i] !== header[i]) {
        throw new Error("StubEngine.restore: magic header non corrisponde (snapshot non prodotto da StubEngine).");
      }
    }
    const json = new TextDecoder().decode(state.subarray(header.length));
    let parsed: StubSnapshotV1;
    try {
      parsed = JSON.parse(json) as StubSnapshotV1;
    } catch (e) {
      throw new Error(`StubEngine.restore: payload JSON non valido (${(e as Error).message}).`);
    }
    if (parsed.v !== 1) {
      throw new Error(`StubEngine.restore: versione snapshot non supportata (v=${parsed.v}).`);
    }
    this.loaded = parsed.loaded;
    this.audio = { volume: parsed.audio.volume, mute: parsed.audio.mute };
    this.lastInput = parsed.lastInput ? { ...parsed.lastInput } : null;
    this.tick = parsed.tick;
  }

  /**
   * TSK-030 / US-017 — ritorna la SRAM corrente (copia) o `null` se vuota.
   * Restituire una copia evita che il dominio muti accidentalmente lo stato interno.
   */
  async getSram(): Promise<Uint8Array | null> {
    if (this.sram === null) return null;
    return new Uint8Array(this.sram);
  }

  /**
   * TSK-030 / US-017 — inietta dati SRAM (copia difensiva).
   */
  async loadSram(data: Uint8Array): Promise<void> {
    this.sram = new Uint8Array(data);
  }
}
