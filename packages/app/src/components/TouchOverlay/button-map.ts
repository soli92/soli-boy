// TSK-060 — button-map: mappa core → set di pulsanti virtuali del TouchOverlay (US-026).
// TSK-122 — L/R su tutti i core (EP-018 / US-063): overlay uniforme; engine GB
// ignora L/R (no-op hardware) via wasmboy-engine.
// Per ogni piattaforma espone i soli pulsanti d'azione (esclusi i D-pad,
// che sono comuni a tutti i core e gestiti separatamente nel componente).

import type { Core } from "../../domain/types";
import type { GameButton } from "../../core/core-wrapper";

/** Descrittore di un pulsante virtuale con label user-facing. */
export interface VirtualButton {
  button: GameButton;
  /** Etichetta resa sull'elemento touch (es. "A", "B", "L", "R"). */
  label: string;
}

/** Set azione con shoulder L/R (layout GBA-style, tutti i core EP-018). */
const ACTION_BUTTONS_WITH_SHOULDERS: VirtualButton[] = [
  { button: "l", label: "L" },
  { button: "b", label: "B" },
  { button: "a", label: "A" },
  { button: "r", label: "R" },
  { button: "select", label: "SEL" },
  { button: "start", label: "STA" },
];

/**
 * Mappa `Core → VirtualButton[]`: set di pulsanti d'azione (NO D-pad).
 * Tutti i core espongono L/R nell'overlay (TSK-122); l'engine GB/GBC
 * tratta L/R come no-op (WasmBoy — hardware senza shoulder).
 */
export const BUTTON_MAP: Record<Core, VirtualButton[]> = {
  gambatte: ACTION_BUTTONS_WITH_SHOULDERS,
  mgba: ACTION_BUTTONS_WITH_SHOULDERS,
  fbneo: ACTION_BUTTONS_WITH_SHOULDERS,
  mame: ACTION_BUTTONS_WITH_SHOULDERS,
};

/** Direzioni D-pad (comuni a tutti i core). */
export const DPAD_DIRECTIONS: Array<{ button: GameButton; label: string }> = [
  { button: "up", label: "↑" },
  { button: "left", label: "←" },
  { button: "down", label: "↓" },
  { button: "right", label: "→" },
];
