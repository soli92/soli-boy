// TSK-025 — registry multi-engine (ADR-005): mappa il core risolto all'adapter reale.
import type { Core } from "../domain/types";
import type { EmulatorEngine, LoadOptions } from "./core-wrapper";
import { WasmBoyEngine } from "./wasmboy-engine";

/** Engine per piattaforme non ancora supportate (GBA finché TSK-028, arcade → EP-009). */
class UnsupportedEngine implements EmulatorEngine {
  readonly capabilities = { rewind: false };
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
}

/** Seleziona l'EmulatorEngine reale per il core risolto. */
export function selectEngine(core: Core): EmulatorEngine {
  switch (core) {
    case "gambatte":
      return new WasmBoyEngine(); // GB/GBC
    case "mgba":
      return new UnsupportedEngine(
        "GBA non ancora supportato (adapter mGBA in arrivo — TSK-028).",
      );
    case "fbneo":
    case "mame":
      return new UnsupportedEngine(
        "Arcade non ancora supportato (rinviato a EP-009).",
      );
    default:
      return new UnsupportedEngine("Core non supportato.");
  }
}
