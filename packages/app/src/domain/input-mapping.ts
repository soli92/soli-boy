// TSK-016 — InputMapping: tastiera + Gamepad API → pulsanti di gioco (US-012).
// Mappa input fisici su GameButton e li inoltra a un sink (es. CoreWrapper.sendInput).
// Disaccoppiato dal core per testabilità; i profili sono rimappabili (US-013).

import type { GameButton } from "../core/core-wrapper";

/** Sink che riceve gli eventi di input mappati. */
export type InputSink = (button: GameButton, pressed: boolean) => void;

/** Profilo di mappatura tasto-tastiera → GameButton. */
export type KeyProfile = Record<string, GameButton>;

/** Profilo tastiera di default (frecce + Z/X + Enter/Shift). */
export const DEFAULT_KEY_PROFILE: KeyProfile = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  z: "b",
  x: "a",
  Enter: "start",
  Shift: "select",
};

/** Mappa standard pulsante-gamepad-index → GameButton (layout stile SNES/Xbox). */
export const DEFAULT_GAMEPAD_MAP: Record<number, GameButton> = {
  0: "a",
  1: "b",
  8: "select",
  9: "start",
  12: "up",
  13: "down",
  14: "left",
  15: "right",
};

export class InputMapping {
  private profile: KeyProfile;

  constructor(
    private readonly sink: InputSink,
    profile: KeyProfile = DEFAULT_KEY_PROFILE,
  ) {
    this.profile = { ...profile };
  }

  /** Tasto premuto: se mappato, inoltra al sink e ritorna true. */
  keyDown(key: string): boolean {
    return this.dispatch(key, true);
  }

  /** Tasto rilasciato: se mappato, inoltra al sink e ritorna true. */
  keyUp(key: string): boolean {
    return this.dispatch(key, false);
  }

  /** Input da gamepad (indice pulsante Gamepad API). */
  gamepadButton(index: number, pressed: boolean): boolean {
    const button = DEFAULT_GAMEPAD_MAP[index];
    if (!button) return false;
    this.sink(button, pressed);
    return true;
  }

  /** Rimappa un tasto su un pulsante (US-013). */
  remap(key: string, button: GameButton): void {
    this.profile[key] = button;
  }

  /** Profilo corrente (copia). */
  get keyProfile(): KeyProfile {
    return { ...this.profile };
  }

  private dispatch(key: string, pressed: boolean): boolean {
    const button = this.profile[key];
    if (!button) return false;
    this.sink(button, pressed);
    return true;
  }
}
