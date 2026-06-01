// EmulatorEngine stub deterministico (placeholder dell'integrazione EmulatorJS reale).
// Usato in app finché l'adapter EmulatorJS WASM non è integrato, e dai test e2e per un
// comportamento riproducibile senza WASM/ROM reali. Non esegue emulazione reale.

import type {
  AudioSettings,
  EmulatorEngine,
  GameButton,
  LoadOptions,
  SpeedSettings,
} from "./core-wrapper";

export class StubEngine implements EmulatorEngine {
  readonly capabilities = { rewind: false };

  loaded = false;
  audio: AudioSettings = { volume: 1, mute: false };
  lastInput: { button: GameButton; pressed: boolean } | null = null;

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
  sendInput(button: GameButton, pressed: boolean): void {
    this.lastInput = { button, pressed };
  }
  setSpeed(_settings: SpeedSettings): void {}
}
