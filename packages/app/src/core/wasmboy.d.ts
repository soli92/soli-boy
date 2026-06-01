// WasmBoy non fornisce dichiarazioni di tipo: shim minimale dell'API usata (TSK-025).
declare module "wasmboy" {
  export interface WasmBoyJoypadState {
    UP?: boolean; DOWN?: boolean; LEFT?: boolean; RIGHT?: boolean;
    A?: boolean; B?: boolean; START?: boolean; SELECT?: boolean;
  }
  /**
   * TSK-030: forma (parziale) dell'oggetto save state restituito da `saveState()`.
   * Vedi `wasmboy/dist/wasmboy.ts.esm.js` (getSaveState): contiene `wasmboyMemory`
   * (incl. `cartridgeRam`), `date`, `isAuto`. Tutti gli array sono `Uint8Array`
   * in memoria ma vengono serializzati come array normali (vedi loadState path).
   */
  export interface WasmBoySaveState {
    wasmboyMemory: {
      wasmBoyInternalState?: Uint8Array | number[];
      wasmBoyPaletteMemory?: Uint8Array | number[];
      gameBoyMemory?: Uint8Array | number[];
      cartridgeRam?: Uint8Array | number[];
    };
    date?: number;
    isAuto?: boolean;
    [k: string]: unknown;
  }
  export const WasmBoy: {
    config(options: Record<string, unknown>, canvas: HTMLCanvasElement): Promise<void>;
    loadROM(rom: Uint8Array): Promise<void>;
    play(): Promise<void>;
    pause(): Promise<void>;
    reset(): Promise<void>;
    setSpeed(multiplier: number): void;
    setJoypadState(state: WasmBoyJoypadState): void;
    disableDefaultJoypad(): void;
    isReady(): boolean;
    /** TSK-030 / US-016 — istantanea dello stato corrente. */
    saveState(): Promise<WasmBoySaveState>;
    /** TSK-030 / US-016 — ripristina lo stato da un oggetto save state. */
    loadState(saveState: WasmBoySaveState): Promise<void>;
  };
}
