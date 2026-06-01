// TSK-017 — Settings: rimappatura comandi + profili (US-013).
// UI della sezione Controlli su classi solids. La persistenza del profilo è delegata
// via callback (onSaveProfile) → store config a livello applicativo.

import { useState } from "react";
import type { GameButton } from "../../core/core-wrapper";
import type { KeyProfile } from "../../domain/input-mapping";

const BUTTONS: GameButton[] = ["up", "down", "left", "right", "a", "b", "start", "select"];

export interface SettingsProps {
  profile: KeyProfile;
  /** Rimappa un tasto su un pulsante (US-013). */
  onRemap: (key: string, button: GameButton) => void;
  /** Persiste il profilo corrente (es. store config). */
  onSaveProfile?: () => void;
}

export function Settings({ profile, onRemap, onSaveProfile }: SettingsProps) {
  const [saved, setSaved] = useState(false);

  return (
    <section className="sd-card sb-sec" aria-label="Impostazioni controlli">
      <p className="sb-lbl">Controlli — rimappatura</p>
      <ul className="sb-keymap">
        {Object.entries(profile).map(([key, button]) => (
          <li key={key} className="sb-row">
            <span className="sb-key">{key}</span>
            <select
              className="sb-sel"
              aria-label={`Pulsante per ${key}`}
              value={button}
              onChange={(e) => onRemap(key, e.target.value as GameButton)}
            >
              {BUTTONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      <button
        className="sb-btn sb-full"
        onClick={() => {
          onSaveProfile?.();
          setSaved(true);
        }}
      >
        Salva profilo
      </button>
      {saved && (
        <p className="sb-note" role="status">
          Profilo salvato.
        </p>
      )}
    </section>
  );
}
