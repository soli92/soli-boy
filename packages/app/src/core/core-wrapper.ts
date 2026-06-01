// TSK-007 — CoreWrapper: resolveCore + lifecycle load/start (ADR-003, api_specs/core-wrapper.md).
// Incapsula il motore di emulazione (EmulatorJS in runtime) dietro un'interfaccia stabile,
// così il dominio resta agnostico rispetto al core specifico. Esegue solo file dell'utente (US-006).

import type { Core, Platform } from "../domain/types";
import { recognizePlatform } from "../domain/platform-recognition";

export interface ResolvedCore {
  platform: Platform;
  core: Core;
}

export interface LoadOptions {
  rom: Blob;
  core: Core;
  /** BIOS opzionale, richiesto da alcune piattaforme (es. GBA). */
  bios?: Blob;
}

/**
 * Motore di emulazione astratto. In runtime è implementato da EmulatorJS (WASM);
 * astratto qui per testabilità (ADR-003) e per non accoppiare il dominio alla lib.
 */
export interface EmulatorEngine {
  load(opts: LoadOptions): Promise<void>;
  start(): void;
}

export type SessionState = "idle" | "loaded" | "running";

/** Risolve piattaforma + core dal file caricato (riusa PlatformRecognition, TSK-004). */
export function resolveCore(
  fileName: string,
  headerBytes?: Uint8Array,
): ResolvedCore | { unsupported: true; reason: string } {
  const rec = recognizePlatform(fileName, headerBytes);
  if (!rec.supported || !rec.platform || !rec.core) {
    return { unsupported: true, reason: rec.reason ?? "Piattaforma non supportata." };
  }
  return { platform: rec.platform, core: rec.core };
}

export class CoreWrapper {
  private state: SessionState = "idle";

  constructor(private readonly engine: EmulatorEngine) {}

  get currentState(): SessionState {
    return this.state;
  }

  /** Carica una ROM nel core appropriato. Non avvia l'esecuzione. */
  async load(opts: LoadOptions): Promise<void> {
    await this.engine.load(opts);
    this.state = "loaded";
  }

  /** Avvia l'esecuzione. Richiede una ROM caricata. */
  start(): void {
    if (this.state === "idle") {
      throw new Error("CoreWrapper.start: nessuna ROM caricata (chiamare load prima).");
    }
    this.engine.start();
    this.state = "running";
  }
}
