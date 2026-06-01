// TSK-025 — WasmBoyEngine: adapter EmulatorEngine reale su WasmBoy (GB/GBC, ADR-005).
// WasmBoy è ESM (no script globale / no decompressione core da CDN): supera i problemi
// di EmulatorJS (gap emulatorjs-real-integration). Singleton WasmBoy → un gioco alla volta.
import { WasmBoy, type WasmBoyJoypadState } from "wasmboy";
import type {
  AudioSettings,
  EmulatorEngine,
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

const BTN: Record<GameButton, keyof WasmBoyJoypadState> = {
  up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT",
  a: "A", b: "B", start: "START", select: "SELECT",
};

export class WasmBoyEngine implements EmulatorEngine {
  readonly capabilities = { rewind: false };

  private configured = false;
  private joypad: WasmBoyJoypadState = {};

  async load(opts: LoadOptions): Promise<void> {
    if (!opts.container) throw new Error("WasmBoyEngine.load: container DOM mancante.");
    const canvas = this.ensureCanvas(opts.container);
    await WasmBoy.config(WASMBOY_OPTIONS, canvas);
    this.configured = true;
    const bytes = new Uint8Array(await opts.rom.arrayBuffer());
    await WasmBoy.loadROM(bytes);
  }

  start(): void {
    void WasmBoy.play();
  }
  pause(): void {
    void WasmBoy.pause();
  }
  resume(): void {
    void WasmBoy.play();
  }
  stop(): void {
    void WasmBoy.pause();
    this.joypad = {};
  }

  setAudio(_settings: AudioSettings): void {
    // WasmBoy non espone un setVolume runtime nell'API pubblica; l'audio è gestito
    // via opzione isAudioEnabled. Mute/volume fine-grained: out-of-scope per ora.
  }

  sendInput(button: GameButton, pressed: boolean): void {
    if (!this.configured) return;
    this.joypad = { ...this.joypad, [BTN[button]]: pressed };
    WasmBoy.setJoypadState(this.joypad);
  }

  setSpeed(settings: SpeedSettings): void {
    WasmBoy.setSpeed(settings.fastForward ? 2 : 1); // rewind non supportato (capabilities.rewind=false)
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
