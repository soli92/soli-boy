// WasmBoy non fornisce dichiarazioni di tipo: shim minimale dell'API usata (TSK-025).
declare module "wasmboy" {
  export interface WasmBoyJoypadState {
    UP?: boolean; DOWN?: boolean; LEFT?: boolean; RIGHT?: boolean;
    A?: boolean; B?: boolean; START?: boolean; SELECT?: boolean;
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
  };
}
