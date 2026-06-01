// TSK-017 — Settings: rimappatura comandi + profili (US-013).
// TSK-036 — Settings: scala + aspect ratio (US-021). Persistenza opzionale via
// `VideoSettingsPort` (cfr. components/Player/useVideoSettings.ts); stesso pattern
// del profilo comandi (callback `onSaveProfile`): qui il consumatore può sia
// gestire lo stato esternamente (modalità controllata) sia delegare la
// persistenza alla porta.
// UI della sezione Controlli su classi solids. La persistenza del profilo è delegata
// via callback (onSaveProfile) → store config a livello applicativo.

import { useState } from "react";
import type { GameButton } from "../../core/core-wrapper";
import type { KeyProfile } from "../../domain/input-mapping";
import {
  ASPECT_RATIOS,
  SCALE_FACTORS,
  useVideoSettings,
  type AspectRatio,
  type ScaleFactor,
  type VideoSettings,
  type VideoSettingsPort,
} from "../Player/useVideoSettings";

const BUTTONS: GameButton[] = ["up", "down", "left", "right", "a", "b", "start", "select"];

export interface SettingsProps {
  profile: KeyProfile;
  /** Rimappa un tasto su un pulsante (US-013). */
  onRemap: (key: string, button: GameButton) => void;
  /** Persiste il profilo corrente (es. store config). */
  onSaveProfile?: () => void;
  /**
   * TSK-036 — preferenze video correnti (US-021). Se passate, il componente è
   * controllato dall'esterno (parent owns state). Altrimenti la sezione si
   * auto-gestisce e opzionalmente persiste tramite `videoConfigPort`.
   */
  videoSettings?: VideoSettings;
  /** Callback invocata ad ogni cambio scala/aspect (modalità controllata). */
  onVideoSettingsChange?: (next: VideoSettings) => void;
  /** Porta di persistenza opzionale (US-021), usata se il componente è auto-gestito. */
  videoConfigPort?: VideoSettingsPort;
}

/** Etichette user-facing per i valori di scala. */
function scaleLabel(s: ScaleFactor): string {
  return s === "auto" ? "Adatta" : `${s}x`;
}

/** Etichette user-facing per gli aspect ratio. */
function aspectLabel(a: AspectRatio): string {
  switch (a) {
    case "original":
      return "Originale";
    case "4:3":
      return "4:3";
    case "stretch":
      return "Stretch";
  }
}

export function Settings({
  profile,
  onRemap,
  onSaveProfile,
  videoSettings,
  onVideoSettingsChange,
  videoConfigPort,
}: SettingsProps) {
  const [saved, setSaved] = useState(false);

  // TSK-036 — stato video. Modalità controllata se `videoSettings` è passata;
  // altrimenti usiamo l'hook con eventuale porta di persistenza.
  const internal = useVideoSettings(videoConfigPort);
  const controlled = videoSettings !== undefined;
  const effective: VideoSettings = controlled
    ? (videoSettings as VideoSettings)
    : internal.value;

  function updateVideo(next: VideoSettings) {
    if (controlled) {
      onVideoSettingsChange?.(next);
    } else {
      internal.setValue(next);
      onVideoSettingsChange?.(next);
    }
  }

  function handleScaleChange(raw: string) {
    const next: ScaleFactor =
      raw === "auto" ? "auto" : (Number(raw) as Exclude<ScaleFactor, "auto">);
    updateVideo({ ...effective, scale: next });
  }

  function handleAspectChange(raw: string) {
    updateVideo({ ...effective, aspect: raw as AspectRatio });
  }

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

      {/* TSK-036 — Resa video (US-021): scala + aspect ratio. Persistenza via
          `videoConfigPort` (opzionale); stessa porta consumata da Player. */}
      <p className="sb-lbl">Resa video — scala e proporzioni</p>
      <ul className="sb-keymap" aria-label="Impostazioni resa video">
        <li className="sb-row">
          <span className="sb-key">Fattore di scala</span>
          <select
            className="sb-sel"
            aria-label="Fattore di scala"
            value={String(effective.scale)}
            onChange={(e) => handleScaleChange(e.target.value)}
          >
            <option value="auto">{scaleLabel("auto")}</option>
            {SCALE_FACTORS.map((s) => (
              <option key={s} value={String(s)}>
                {scaleLabel(s)}
              </option>
            ))}
          </select>
        </li>
        <li className="sb-row">
          <span className="sb-key">Aspect ratio</span>
          <select
            className="sb-sel"
            aria-label="Aspect ratio"
            value={effective.aspect}
            onChange={(e) => handleAspectChange(e.target.value)}
          >
            {ASPECT_RATIOS.map((a) => (
              <option key={a} value={a}>
                {aspectLabel(a)}
              </option>
            ))}
          </select>
        </li>
      </ul>
    </section>
  );
}
