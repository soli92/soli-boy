// TSK-007 — CoreWrapper: resolveCore + lifecycle load/start (ADR-003, api_specs/core-wrapper.md).
// Incapsula il motore di emulazione (EmulatorJS in runtime) dietro un'interfaccia stabile,
// così il dominio resta agnostico rispetto al core specifico. Esegue solo file dell'utente (US-006).

import type { RtcBridge } from "../domain/rtc-service";
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
  /** Nodo DOM in cui montare l'emulatore (TSK-022; usato dagli engine reali es. WasmBoy, ignorato da StubEngine). */
  container?: HTMLElement;
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
  /** Inoltra un input di gioco al core. TSK-016 / US-012. */
  sendInput(button: GameButton, pressed: boolean): void;
  /** Imposta velocità (fast-forward / rewind). TSK-018 / US-014. */
  setSpeed(settings: SpeedSettings): void;
  /**
   * Cattura un'istantanea dello stato corrente dell'emulatore (save state).
   * TSK-030 / US-016. Il payload è opaco per il dominio: serializzato come
   * Uint8Array così la persistenza (ADR-002 / store `saveStates`) può trattarlo
   * come blob senza conoscere il formato specifico dell'engine.
   * Reject onesto se l'engine non supporta i save state in runtime.
   */
  snapshot(): Promise<Uint8Array>;
  /**
   * Ripristina lo stato dell'emulatore da uno snapshot precedente.
   * TSK-030 / US-016. Il formato è specifico per engine/versione (vedi
   * conseguenze in ADR-006): un payload prodotto da WasmBoy NON è
   * caricabile da mGBA — è responsabilità del livello dominio/storage
   * memorizzare `core`/`engine` ed evitare cross-load.
   * Reject onesto se l'engine non supporta i save state in runtime.
   */
  restore(state: Uint8Array): Promise<void>;
  /**
   * Legge la SRAM corrente della cartuccia (save in-game). TSK-030 / US-017.
   * Ritorna `null` se non c'è SRAM (es. cartuccia senza battery RAM o nessuna
   * ROM caricata). Reject onesto se l'engine non espone la SRAM in runtime.
   */
  getSram(): Promise<Uint8Array | null>;
  /**
   * Inietta dati SRAM nella cartuccia caricata. TSK-030 / US-017.
   * Reject onesto se l'engine non espone la SRAM in runtime.
   */
  loadSram(data: Uint8Array): Promise<void>;
  /** Capacità del core (es. rewind dipende dalla piattaforma). TSK-018 / US-014. */
  readonly capabilities: EngineCapabilities;
  /**
   * TSK-128 / ADR-009 §4 — bridge engine↔dominio per l'orologio interno (RTC).
   *
   * Campo opzionale: `null` significa "questo engine non espone (ancora) un
   * RTC concreto" — il dominio (`GameSession`) si attende `null`-safety e
   * degrada a no-op silenzioso per persist-on-stop / restore-on-start
   * (best-effort by-spec, ADR-009 §4 "no-op silenzioso, comportamento già
   * pianificato come best-effort"). I bridge concreti `WasmBoyRtcBridge` /
   * `MgbaRtcBridge` sono pianificati Sprint 16 (TSK separati): finché non
   * sono implementati, gli adapter espongono `rtcBridge = null` come stub.
   */
  readonly rtcBridge?: RtcBridge | null;
}

/** Impostazioni audio. `volume` normalizzato 0..1. */
export interface AudioSettings {
  volume: number;
  mute: boolean;
}

/** Pulsanti di gioco logici (mappati dall'InputMapping). TSK-016.
 * TSK-060: aggiunti "l" e "r" per i shoulder button GBA (US-026). */
export type GameButton =
  | "up" | "down" | "left" | "right"
  | "a" | "b" | "start" | "select"
  | "l" | "r";

/** Impostazioni di velocità. TSK-018 / US-014. */
export interface SpeedSettings {
  fastForward: boolean;
  rewind: boolean;
}

export interface EngineCapabilities {
  /** true se il core supporta il rewind (US-014). */
  rewind: boolean;
  /** true se il core supporta i save state (snapshot/restore). TSK-030 / US-016. */
  saveStates: boolean;
  /** true se il core espone la SRAM cartuccia (getSram/loadSram). TSK-030 / US-017. */
  sram: boolean;
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

  /** Inoltra un input al core (no-op se non in running). TSK-016 / US-012. */
  sendInput(button: GameButton, pressed: boolean): void {
    if (this.state !== "running") return;
    this.engine.sendInput(button, pressed);
  }

  /**
   * Imposta la velocità. Il rewind è applicato solo se il core lo supporta
   * (capability); altrimenti viene forzato a false. TSK-018 / US-014.
   */
  setSpeed(settings: SpeedSettings): SpeedSettings {
    const rewind = settings.rewind && this.engine.capabilities.rewind;
    const effective: SpeedSettings = { fastForward: settings.fastForward, rewind };
    this.engine.setSpeed(effective);
    return effective;
  }

  /** True se il core supporta il rewind. TSK-018 / US-014. */
  get supportsRewind(): boolean {
    return this.engine.capabilities.rewind;
  }

  private audio: AudioSettings = { volume: 1, mute: false };
}
