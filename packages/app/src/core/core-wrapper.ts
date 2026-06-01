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
  /** Sospende l'esecuzione mantenendo lo stato. TSK-015 / US-011. */
  pause(): void;
  /** Riprende l'esecuzione dopo una pausa. TSK-015 / US-011. */
  resume(): void;
  /** Arresta l'esecuzione e libera la sessione. TSK-015 / US-011. */
  stop(): void;
  /** Imposta volume (0..1) e mute sul core. TSK-009 / US-015. */
  setAudio(settings: AudioSettings): void;
}

/** Impostazioni audio. `volume` normalizzato 0..1. */
export interface AudioSettings {
  volume: number;
  mute: boolean;
}

export type SessionState = "idle" | "loaded" | "running" | "paused";

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

  /** Sospende l'esecuzione (no-op se non in running). TSK-015 / US-011. */
  pause(): void {
    if (this.state !== "running") return;
    this.engine.pause();
    this.state = "paused";
  }

  /** Riprende dopo una pausa (no-op se non in paused). TSK-015 / US-011. */
  resume(): void {
    if (this.state !== "paused") return;
    this.engine.resume();
    this.state = "running";
  }

  /** Arresta l'esecuzione e riporta lo stato a idle. TSK-015 / US-011. */
  stop(): void {
    if (this.state === "idle") return;
    this.engine.stop();
    this.state = "idle";
  }

  /** Imposta volume/mute. Il volume è clampato in [0,1]. TSK-009 / US-015. */
  setAudio(settings: AudioSettings): void {
    const volume = Math.min(1, Math.max(0, settings.volume));
    this.audio = { volume, mute: settings.mute };
    this.engine.setAudio(this.audio);
  }

  get audioSettings(): AudioSettings {
    return this.audio;
  }

  private audio: AudioSettings = { volume: 1, mute: false };
}
