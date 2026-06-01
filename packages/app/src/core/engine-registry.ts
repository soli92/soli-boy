// TSK-025 — registry multi-engine (ADR-005): mappa il core risolto all'adapter reale.
// TSK-030 (ADR-006) — UnsupportedEngine esteso con reject onesto su snapshot/SRAM.
import type { Core } from "../domain/types";
import type { EmulatorEngine, EngineCapabilities, LoadOptions } from "./core-wrapper";
import { WasmBoyEngine } from "./wasmboy-engine";
import { MgbaEngine } from "./mgba-engine";

/** Engine per piattaforme non ancora supportate (arcade → EP-009). */
class UnsupportedEngine implements EmulatorEngine {
  readonly capabilities: EngineCapabilities = {
    rewind: false,
    saveStates: false,
    sram: false,
  };
  constructor(private readonly reason: string) {}
  load(_opts: LoadOptions): Promise<void> {
    return Promise.reject(new Error(this.reason));
  }
  start(): void {}
  pause(): void {}
  resume(): void {}
  stop(): void {}
  setAudio(): void {}
  sendInput(): void {}
  setSpeed(): void {}
  // TSK-030 — reject onesto: nessun claim falso, il core non è supportato.
  snapshot(): Promise<Uint8Array> {
    return Promise.reject(new Error(this.reason));
  }
  restore(_state: Uint8Array): Promise<void> {
    return Promise.reject(new Error(this.reason));
  }
  getSram(): Promise<Uint8Array | null> {
    return Promise.reject(new Error(this.reason));
  }
  loadSram(_data: Uint8Array): Promise<void> {
    return Promise.reject(new Error(this.reason));
  }
}

/** Seleziona l'EmulatorEngine reale per il core risolto. */
export function selectEngine(core: Core): EmulatorEngine {
  switch (core) {
    case "gambatte":
      return new WasmBoyEngine(); // GB/GBC
    case "mgba":
      return new MgbaEngine(); // GBA (mGBA wasm) — adapter non ancora verificato a runtime (TSK-028)
    case "fbneo":
    case "mame":
      return new UnsupportedEngine(
        "Arcade non ancora supportato (rinviato a EP-009).",
      );
    default:
      return new UnsupportedEngine("Core non supportato.");
  }
}
