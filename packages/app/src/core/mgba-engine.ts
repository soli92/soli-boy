// TSK-028 — MgbaEngine: adapter EmulatorEngine reale su mGBA WASM (GBA, ADR-005).
// Lib: @thenick775/mgba-wasm (MPL-2.0), core mGBA via Emscripten. Import dinamico:
// non pesa sul bundle/stub finché non si avvia un gioco GBA.
//
// NOTA (onestà): non verificato a runtime in questo repo (manca una ROM GBA libera).
// L'adapter segue l'API documentata (dist/mgba.d.ts); validare con e2e quando disponibile
// una ROM GBA homebrew/free (vedi public/test-roms/README.md).
import type {
  AudioSettings,
  EmulatorEngine,
  GameButton,
  LoadOptions,
  SpeedSettings,
} from "./core-wrapper";

/** Superficie minima dell'API mGBA usata (dist/mgba.d.ts di @thenick775/mgba-wasm). */
interface MgbaModule {
  FSInit(): Promise<void>;
  uploadRom(file: File, callback?: () => void): void;
  loadGame(romPath: string, savePathOverride?: string): boolean;
  buttonPress(name: string): void;
  buttonUnpress(name: string): void;
  pauseGame(): void;
  resumeGame(): void;
  quitGame(): void;
  setVolume(percent: number): void;
  filePaths(): { gamePath: string };
}

const BTN: Record<GameButton, string> = {
  up: "Up", down: "Down", left: "Left", right: "Right",
  a: "A", b: "B", start: "Start", select: "Select",
};

export class MgbaEngine implements EmulatorEngine {
  readonly capabilities = { rewind: false };
  private module: MgbaModule | null = null;

  async load(opts: LoadOptions): Promise<void> {
    if (!opts.container) throw new Error("MgbaEngine.load: container DOM mancante.");
    const canvas = this.ensureCanvas(opts.container);

    const mod = await import("@thenick775/mgba-wasm");
    const factory = (mod.default ?? mod) as unknown as (o: {
      canvas: HTMLCanvasElement;
    }) => Promise<MgbaModule>;
    this.module = await factory({ canvas });
    await this.module.FSInit();

    const name = "game.gba";
    const file = new File([opts.rom], name, { type: "application/octet-stream" });
    await new Promise<void>((resolve) => this.module!.uploadRom(file, () => resolve()));
    const ok = this.module.loadGame(`${this.module.filePaths().gamePath}/${name}`);
    if (!ok) throw new Error("MgbaEngine.load: loadGame fallito.");
  }

  start(): void {
    this.module?.resumeGame();
  }
  pause(): void {
    this.module?.pauseGame();
  }
  resume(): void {
    this.module?.resumeGame();
  }
  stop(): void {
    this.module?.quitGame();
    this.module = null;
  }

  setAudio(settings: AudioSettings): void {
    this.module?.setVolume(settings.mute ? 0 : Math.round(Math.min(1, Math.max(0, settings.volume)) * 100));
  }

  sendInput(button: GameButton, pressed: boolean): void {
    if (!this.module) return;
    if (pressed) this.module.buttonPress(BTN[button]);
    else this.module.buttonUnpress(BTN[button]);
  }

  setSpeed(_settings: SpeedSettings): void {
    // Fast-forward/rewind mGBA non mappati finché non validati a runtime (capabilities.rewind=false).
  }

  private ensureCanvas(container: HTMLElement): HTMLCanvasElement {
    const existing = container.querySelector("canvas");
    if (existing) return existing;
    const canvas = document.createElement("canvas");
    canvas.className = "mgba-canvas";
    container.appendChild(canvas);
    return canvas;
  }
}
