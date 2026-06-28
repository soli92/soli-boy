// TSK-060 — button-map: mappa core → set di pulsanti virtuali del TouchOverlay (US-026).
// TSK-122 — refactor: helper `coreHasShoulderButtons` + allineamento esplicito a US-063.
//
// REGOLA US-063 (Acceptance Criteria):
//   L'overlay touch espone i pulsanti shoulder L e R SOLO per le piattaforme
//   che li prevedono in hardware (oggi: solo GBA / core `mgba`).
//   Per le piattaforme che NON espongono L/R in hardware (gambatte GB/GBC,
//   fbneo, mame) i pulsanti L/R NON compaiono nell'overlay, evitando di
//   mostrare comandi privi di effetto.
//   [^src: management/kanban/EP-018-controlli-shoulder-l-r/US-063-touch-l-r-tutte-piattaforme/US-063.md §Business Rules]
//
// Per ogni piattaforma sono esposti i SOLI pulsanti d'azione (esclusi i D-pad,
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
 * TSK-122 — Lista canonica dei core che espongono i pulsanti shoulder L/R in
 * hardware sulla piattaforma emulata.
 *
 * Oggi popolata dal solo `mgba` (Nintendo Game Boy Advance). Aggiornare se in
 * futuro un nuovo core/piattaforma con shoulder hardware viene introdotto
 * (la regola US-063 di neutralità verso i no-op hardware resta invariante).
 */
const CORES_WITH_SHOULDER_BUTTONS: ReadonlySet<Core> = new Set<Core>(["mgba"]);

/**
 * TSK-122 — Helper: il `core` espone i pulsanti shoulder L/R in hardware?
 *
 * Single source of truth per la regola US-063: ogni decisione di rendering /
 * mapping touch su L/R deve passare di qui (evita drift fra button-map e
 * eventuali check downstream — es. UI di rimappatura, Settings, e2e).
 *
 * @example
 *   if (coreHasShoulderButtons(core)) { ...mostra L/R nell'overlay... }
 */
export function coreHasShoulderButtons(core: Core): boolean {
  return CORES_WITH_SHOULDER_BUTTONS.has(core);
}

/**
 * Mappa `Core → VirtualButton[]`: set di pulsanti d'azione (NO D-pad).
 *
 * - GB / GBC / `gambatte`: A, B, Select, Start. (no shoulder hardware → no L/R)
 * - GBA / `mgba`:          A, B, L, R, Select, Start. (shoulder L/R hardware)
 * - ARCADE / `fbneo`:      A, B, Select, Start. (no shoulder hardware → no L/R)
 * - ARCADE / `mame`:       A, B, Select, Start. (no shoulder hardware → no L/R;
 *                          i titoli arcade hanno layout variabili — mapping
 *                          conservativo, espandibile in US futura).
 *
 * Invariante US-063: `BUTTON_MAP[core]` include L/R sse `coreHasShoulderButtons(core)`.
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
