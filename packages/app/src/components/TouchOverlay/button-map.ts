// TSK-060 — button-map: mappa core → set di pulsanti virtuali del TouchOverlay (US-026).
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

/**
 * Mappa `Core → VirtualButton[]`: set di pulsanti d'azione (NO D-pad).
 * - GB / GBC / gambatte: A, B, Select, Start.
 * - GBA / mGBA: A, B, L, R, Select, Start.
 * - ARCADE / fbneo / mame: A, B, Select, Start (mapping conservativo;
 *   i titoli arcade hanno layout variabili — si espande in US futura).
 */
export const BUTTON_MAP: Record<Core, VirtualButton[]> = {
  gambatte: [
    { button: "b", label: "B" },
    { button: "a", label: "A" },
    { button: "select", label: "SEL" },
    { button: "start", label: "STA" },
  ],
  mgba: [
    { button: "l", label: "L" },
    { button: "b", label: "B" },
    { button: "a", label: "A" },
    { button: "r", label: "R" },
    { button: "select", label: "SEL" },
    { button: "start", label: "STA" },
  ],
  fbneo: [
    { button: "b", label: "B" },
    { button: "a", label: "A" },
    { button: "select", label: "SEL" },
    { button: "start", label: "STA" },
  ],
  mame: [
    { button: "b", label: "B" },
    { button: "a", label: "A" },
    { button: "select", label: "SEL" },
    { button: "start", label: "STA" },
  ],
};

/** Direzioni D-pad (comuni a tutti i core). */
export const DPAD_DIRECTIONS: Array<{ button: GameButton; label: string }> = [
  { button: "up", label: "↑" },
  { button: "left", label: "←" },
  { button: "down", label: "↓" },
  { button: "right", label: "→" },
];
