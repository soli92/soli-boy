// TSK-060 — TouchOverlay: D-pad + pulsanti virtuali per mobile (US-026).
// TSK-061 — Config posizione/dimensione/opacità persistita (US-027).
// TSK-064 — Layout responsivo: classi landscape + safe-area CSS (US-030).
// TSK-066 — Feedback aptico opzionale via Capacitor Haptics (US-032).
//
// Visibile solo su touch device (`window.matchMedia('(pointer: coarse)')`).
// `aria-hidden="true"`: elemento puramente touch, non nel tab order.
// Stile via token solids (CSS custom properties, classi sb-/sd-).
// Persistenza config via ConfigPort (store `config`, chiave `touch-overlay`).

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useHaptics } from "./useHaptics";
import type { Core } from "../../domain/types";
import type { InputMapping } from "../../domain/input-mapping";
import type { GameButton } from "../../core/core-wrapper";
import type { ConfigPort } from "../../storage/port";
import { BUTTON_MAP, DPAD_DIRECTIONS } from "./button-map";
import {
  useTouchOverlayConfig,
  type TouchOverlayConfig,
} from "./useTouchOverlayConfig";

/** TSK-155 (EP-020) — stile visivo D-pad su Tailwind; posizionamento in solids-theme.css */
const DPAD_BTN_VISUAL =
  "flex items-center justify-center text-xl cursor-pointer select-none touch-none bg-[var(--sd-color-bg-elevated)] border border-[var(--sd-color-border-strong)] rounded-[var(--sd-radius-sm)] text-[var(--sd-color-text-secondary)] active:opacity-80";

/** TSK-155 — classi visive per pulsanti azione (posizionamento via .ab-* in CSS) */
function abButtonVisualClass(button: string): string {
  const base =
    "flex items-center justify-center cursor-pointer select-none touch-none border-0 font-[family-name:var(--sd-font-heading)] active:opacity-80";
  switch (button) {
    case "l":
    case "r":
      return cn(
        base,
        "rounded-[var(--sd-radius-sm)] bg-[var(--sd-color-bg-elevated)] border border-[var(--sd-color-border-strong)] text-[var(--sd-color-text-secondary)] text-sm font-semibold",
      );
    case "a":
      return cn(
        base,
        "rounded-full text-lg font-semibold bg-[var(--sd-color-pad-a-bg)] text-[var(--sd-color-pad-a)]",
      );
    case "b":
      return cn(
        base,
        "rounded-full text-lg font-semibold bg-[var(--sd-color-pad-b-bg)] text-[var(--sd-color-pad-b)]",
      );
    case "select":
    case "start":
      return cn(
        base,
        "rounded-[var(--sd-radius-sm)] bg-[var(--sd-color-bg-elevated)] border border-[var(--sd-color-border-strong)] text-[var(--sd-color-text-secondary)] text-[10px] font-semibold",
      );
    default:
      return cn(
        base,
        "rounded-full text-lg font-semibold bg-[var(--sd-color-bg-elevated)] text-[var(--sd-color-text-secondary)]",
      );
  }
}

export interface TouchOverlayProps {
  /** Core della sessione corrente: determina il set di pulsanti. */
  core: Core;
  /** InputMapping a cui instradare gli eventi touch. */
  inputMapping: InputMapping;
  /**
   * Porta di persistenza opzionale (ConfigPort). Se assente, la config
   * vive solo nello stato locale (no crash — backward compat).
   */
  storage?: ConfigPort;
  /**
   * TSK-066 — Feedback aptico abilitato (default: false).
   * Valore derivato da `useHapticsConfig(storage)` a livello App; passato come
   * prop per rendere il componente testabile senza Capacitor.
   */
  hapticsEnabled?: boolean;
  /**
   * TSK-062 — Nasconde l'overlay quando un gamepad Bluetooth è connesso
   * (default: true). Impostare a `false` per mostrare sempre l'overlay
   * anche con gamepad attivo (toggle "Nascondi overlay con gamepad" in Settings).
   */
  hideWhenGamepad?: boolean;
  /**
   * TSK-062 — true se ≥1 gamepad è attualmente connesso.
   * Propagato da `useGamepadDetection` a livello Player/App.
   */
  gamepadConnected?: boolean;
  /**
   * Variante B — true quando il Player è in modalità schermo intero.
   * In fullscreen l'overlay usa `position:absolute; inset:0` ancorato a
   * `.sb-screen` (comportamento INCREMENT 3 invariato).
   * In non-fullscreen portrait l'overlay è reso nel flusso normale (sotto
   * lo schermo); in landscape usa il layout a 3 colonne via CSS.
   * Default: false (portrait non-fullscreen).
   */
  isFullscreen?: boolean;
}

/** Determina se il dispositivo è touch-primary. */
function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * TSK-064 — Hook che osserva il media query `(orientation: landscape)`.
 * Ritorna `true` quando il dispositivo è in landscape.
 * Usa `matchMedia` + listener per aggiornare lo stato alla rotazione.
 */
function useLandscape(): boolean {
  const [landscape, setLandscape] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(orientation: landscape)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(orientation: landscape)");
    const handler = (e: MediaQueryListEvent) => setLandscape(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return landscape;
}

/** Stile CSS inline derivato dalla `TouchOverlayConfig` (CSS custom properties). */
function configToCssVars(cfg: TouchOverlayConfig): React.CSSProperties {
  return {
    // Casting necessario per proprietà custom non riconosciute da CSSProperties.
    ["--sb-touch-opacity" as string]: String(cfg.opacity),
    ["--sb-touch-scale" as string]: String(cfg.scale),
    ["--sb-touch-dpad-x" as string]: `${cfg.dpadOffsetX}%`,
    ["--sb-touch-dpad-y" as string]: `${cfg.dpadOffsetY}%`,
    ["--sb-touch-btns-x" as string]: `${cfg.buttonsOffsetX}%`,
    ["--sb-touch-btns-y" as string]: `${cfg.buttonsOffsetY}%`,
  } as React.CSSProperties;
}

/**
 * Handler touch riutilizzabile che chiama `inputMapping.sendTouchInput`.
 * TSK-066: il parametro `onTouchStart` opzionale viene invocato prima di
 * `sendTouchInput` (es. triggerImpact per haptics).
 */
function useTouchHandlers(
  inputMapping: InputMapping,
  onTouchStartExtra?: () => void,
) {
  const handleTouchStart = useCallback(
    (button: GameButton) => (e: React.TouchEvent) => {
      e.preventDefault();
      onTouchStartExtra?.();
      inputMapping.sendTouchInput(button, true);
    },
    [inputMapping, onTouchStartExtra],
  );
  const handleTouchEnd = useCallback(
    (button: GameButton) => (e: React.TouchEvent) => {
      e.preventDefault();
      inputMapping.sendTouchInput(button, false);
    },
    [inputMapping],
  );
  // onTouchCancel: l'OS può cancellare il touch in corso (es. long-press che
  // apre il menu nativo, gesture di sistema, chiamata in arrivo). In quel caso
  // `touchend` NON arriva e il pulsante resterebbe "premuto" → il personaggio
  // continua a camminare nella direzione del tasto tenuto. Rilasciamo qui con
  // la stessa logica del touchend (rilascio del pulsante).
  return { handleTouchStart, handleTouchEnd, handleTouchCancel: handleTouchEnd };
}

/** Blocca il menu contestuale nativo (copia/condividi) sul long-press. */
function preventContextMenu(e: React.MouseEvent) {
  e.preventDefault();
}

export function TouchOverlay({
  core,
  inputMapping,
  storage,
  hapticsEnabled = false,
  hideWhenGamepad = true,
  gamepadConnected = false,
  isFullscreen = false,
}: TouchOverlayProps) {
  // Solo su touch device.
  if (!isTouchDevice()) return null;
  // TSK-062 — auto-hide: se un gamepad è connesso e `hideWhenGamepad` è true,
  // l'overlay non viene reso (CSS `display: none` equivalente — no DOM overhead).
  if (hideWhenGamepad && gamepadConnected) return null;

  return (
    <TouchOverlayInner
      core={core}
      inputMapping={inputMapping}
      storage={storage}
      hapticsEnabled={hapticsEnabled}
      isFullscreen={isFullscreen}
    />
  );
}

/**
 * Componente interno separato per permettere agli hook di girare
 * SEMPRE (no conditional hook call sopra il guard `isTouchDevice`).
 * Il guard rimane nel `TouchOverlay` wrapper, che è il componente
 * pubblico. Gli hook possono essere chiamati condizionalmente QUI
 * perché questo componente è reso solo su touch device.
 *
 * Variante B — tre modalità di layout:
 * 1. fullscreen: position:absolute; inset:0 — overlay copre .sb-screen (INCREMENT 3 invariato)
 * 2. landscape non-fullscreen: overlay sibling di .sb-screen, CSS 3-col gestisce il posizionamento
 * 3. portrait non-fullscreen: overlay in flusso normale sotto .sb-screen (position:static)
 */
function TouchOverlayInner({
  core,
  inputMapping,
  storage,
  hapticsEnabled = false,
  isFullscreen = false,
}: TouchOverlayProps) {
  const { config, setConfig, save } = useTouchOverlayConfig(storage);
  const [showConfig, setShowConfig] = useState(false);
  // TSK-066 — feedback aptico opzionale.
  const { triggerImpact } = useHaptics(hapticsEnabled);
  const { handleTouchStart, handleTouchEnd, handleTouchCancel } = useTouchHandlers(inputMapping, triggerImpact);
  // TSK-064 — orientamento landscape.
  const landscape = useLandscape();
  const buttons = BUTTON_MAP[core] ?? BUTTON_MAP["gambatte"];

  // Variante B — layout mode derivato da isFullscreen + landscape.
  // fullscreen: overlay assoluto dentro .sb-screen (comportamento originale)
  // landscape non-fs: layout a 3 colonne via CSS (.sb-player-layout wrapper in Player.tsx)
  // portrait non-fs: overlay nel flusso normale sotto .sb-screen (position:static)
  const isAbsoluteOverlay = isFullscreen || landscape;

  const overlayStyle: React.CSSProperties = isAbsoluteOverlay
    ? {
        // Fullscreen / landscape: overlay assoluto ancorato al containing block.
        ...configToCssVars(config),
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10,
        opacity: config.opacity,
      }
    : {
        // Portrait non-fullscreen: flusso normale, nessun overlay.
        // Il posizionamento dei tasti è gestito via flexbox nel .sb-player-layout.
        ...configToCssVars(config),
        position: "relative",
        pointerEvents: "none",
        opacity: config.opacity,
        // Padding safe-area bottom per iPhone notch/home indicator.
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      };

  // INCREMENT 3 — safe-area-inset-bottom viene sommato al bottom offset dell'elemento
  // posizionato in assoluto: `padding-bottom` sul wrapper overlay non influenza
  // `position:absolute` dei figli (il padding non fa parte del containing block height
  // per il calcolo di `bottom`). Usiamo `calc()` per garantire che D-pad e pulsanti
  // non finiscano sotto il home indicator / notch inferiore su iPhone.
  // Su browser senza supporto env() l'espressione torna al solo `${X}%` (fallback 0px).
  const dpadStyle: React.CSSProperties = isAbsoluteOverlay
    ? {
        position: "absolute",
        left: `${config.dpadOffsetX}%`,
        bottom: `calc(${config.dpadOffsetY}% + env(safe-area-inset-bottom, 0px))`,
        pointerEvents: "auto",
        transform: `scale(${config.scale})`,
        transformOrigin: "bottom left",
      }
    : {
        // Portrait non-fullscreen: position nel flusso, gestito da flexbox parent.
        position: "relative",
        pointerEvents: "auto",
        transform: `scale(${config.scale})`,
        transformOrigin: "bottom left",
      };

  const buttonsStyle: React.CSSProperties = isAbsoluteOverlay
    ? {
        position: "absolute",
        right: `${config.buttonsOffsetX}%`,
        bottom: `calc(${config.buttonsOffsetY}% + env(safe-area-inset-bottom, 0px))`,
        pointerEvents: "auto",
        transform: `scale(${config.scale})`,
        transformOrigin: "bottom right",
      }
    : {
        // Portrait non-fullscreen: position nel flusso, gestito da flexbox parent.
        position: "relative",
        pointerEvents: "auto",
        transform: `scale(${config.scale})`,
        transformOrigin: "bottom right",
      };

  const configButtonStyle: React.CSSProperties = isAbsoluteOverlay
    ? {
        position: "absolute",
        top: 8,
        right: 8,
        pointerEvents: "auto",
        zIndex: 11,
        opacity: config.opacity,
      }
    : {
        // Portrait non-fullscreen: posizionato in flusso, allineato a destra.
        position: "relative",
        pointerEvents: "auto",
        opacity: config.opacity,
        alignSelf: "flex-end",
      };

  // TSK-064 — classe condizionale per il layout landscape.
  // Variante B — classe portrait-flow per layout a colonna (non-fullscreen portrait).
  const overlayClassName = [
    "sb-touch-overlay",
    landscape ? "sb-touch-landscape" : "",
    !isAbsoluteOverlay ? "sb-touch-portrait-flow" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={overlayClassName}
      aria-hidden={showConfig ? undefined : true}
      data-testid="sb-touch-overlay"
      data-landscape={landscape ? "true" : "false"}
      data-fullscreen={isFullscreen ? "true" : "false"}
      style={overlayStyle}
    >
      {/* Config toggle: pulsante pill in alto a destra */}
      <button
        type="button"
        className="sb-pill"
        style={configButtonStyle}
        data-testid="sb-touch-config-toggle"
        onClick={() => setShowConfig((v) => !v)}
        aria-hidden="true"
        tabIndex={-1}
      >
        {showConfig ? "Chiudi" : "Configura overlay"}
      </button>

      {/* Pannello di configurazione */}
      {showConfig && (
        <TouchOverlayConfigPanel
          config={config}
          onChange={setConfig}
          onSave={save}
          onClose={() => setShowConfig(false)}
        />
      )}

      {/* D-pad */}
      <div
        className="sb-dpad"
        style={dpadStyle}
        data-testid="sb-touch-dpad"
      >
        {DPAD_DIRECTIONS.map(({ button, label }) => (
          // TSK-114 (UX-035) — padding 8px trasparente su tutti i lati per
          // touch target ≥44px (WCAG 2.5.5 Target Size; le aree toccabili
          // erano borderline su dispositivi entry-level). Il padding è
          // invisibile (sfondo trasparente, overflow:visible sul parent).
          <button
            key={button}
            type="button"
            className={cn("dp", `dp-${button}`, DPAD_BTN_VISUAL)}
            aria-hidden="true"
            tabIndex={-1}
            data-testid={`sb-touch-dpad-${button}`}
            style={{ padding: "8px" }}
            onTouchStart={handleTouchStart(button)}
            onTouchEnd={handleTouchEnd(button)}
            onTouchCancel={handleTouchCancel(button)}
            onContextMenu={preventContextMenu}
          >
            {label}
          </button>
        ))}
        <div
          className="dp-center bg-[var(--sd-color-bg-surface)]"
          aria-hidden="true"
        />
      </div>

      {/* Pulsanti azione */}
      <div
        className="sb-ab"
        style={buttonsStyle}
        data-testid="sb-touch-buttons"
      >
        {buttons.map(({ button, label }) => (
          <button
            key={button}
            type="button"
            className={cn("ab", `ab-${button}`, abButtonVisualClass(button))}
            aria-hidden="true"
            tabIndex={-1}
            data-testid={`sb-touch-btn-${button}`}
            onTouchStart={handleTouchStart(button)}
            onTouchEnd={handleTouchEnd(button)}
            onTouchCancel={handleTouchCancel(button)}
            onContextMenu={preventContextMenu}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Config panel (TSK-061 + TSK-114)
// TSK-114 (US-059, EP-016):
//   1. Rimosso aria-hidden="true" dal wrapper — il pannello deve essere
//      accessibile a screen reader e navigazione tastiera.
//   2. Aggiunto aria-labelledby sull'heading interno (h3, già nel DOM).
//   3. Focus iniziale sull'heading al mount: screen reader annuncia il contesto.
//   4. I range input hanno già aria-label (verificato: "Opacità overlay" etc.).
// --------------------------------------------------------------------------

interface TouchOverlayConfigPanelProps {
  config: TouchOverlayConfig;
  onChange: (next: Partial<TouchOverlayConfig>) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
}

function TouchOverlayConfigPanel({
  config,
  onChange,
  onSave,
  onClose,
}: TouchOverlayConfigPanelProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // TSK-114 — heading ref per il focus iniziale (annuncia contesto al mount).
  const headingRef = useRef<HTMLHeadingElement>(null);

  // TSK-114 — focus iniziale sull'heading quando il pannello viene montato.
  // Consente a screen reader (VoiceOver/NVDA) di annunciare il contesto del
  // pannello senza che l'utente debba esplorare manualmente.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    top: 48,
    right: 8,
    width: 260,
    zIndex: 12,
    pointerEvents: "auto",
    padding: "var(--sd-space-md, 12px)",
    background: "var(--sd-color-bg-surface)",
    border: "1px solid var(--sd-color-border-muted)",
    borderRadius: "var(--sd-radius-lg, 14px)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--sd-space-sm, 8px)",
  };

  // TSK-114 — id stabile per aria-labelledby del wrapper.
  const panelHeadingId = "sb-touch-config-heading";

  return (
    <div
      ref={panelRef}
      className="sd-card"
      style={panelStyle}
      data-testid="sb-touch-config-panel"
      role="region"
      aria-labelledby={panelHeadingId}
    >
      <h3
        id={panelHeadingId}
        ref={headingRef}
        className="sb-lbl"
        tabIndex={-1}
        style={{ margin: 0, outline: "none" }}
      >
        Configurazione overlay touch
      </h3>

      {/* Opacità */}
      <label className="sb-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <span className="sb-key">
          Opacità: {Math.round(config.opacity * 100)}%
        </span>
        <input
          type="range"
          className="sb-range"
          min={0.2}
          max={1}
          step={0.05}
          value={config.opacity}
          data-testid="sb-touch-config-opacity"
          aria-label="Opacità overlay"
          onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
        />
      </label>

      {/* Dimensione */}
      <label className="sb-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <span className="sb-key">
          Dimensione: {Math.round(config.scale * 100)}%
        </span>
        <input
          type="range"
          className="sb-range"
          min={0.5}
          max={1.5}
          step={0.05}
          value={config.scale}
          data-testid="sb-touch-config-scale"
          aria-label="Dimensione overlay"
          onChange={(e) => onChange({ scale: parseFloat(e.target.value) })}
        />
      </label>

      {/* Posizione D-pad (X) */}
      <label className="sb-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <span className="sb-key">D-pad sinistra: {config.dpadOffsetX}%</span>
        <input
          type="range"
          className="sb-range"
          min={0}
          max={40}
          step={1}
          value={config.dpadOffsetX}
          data-testid="sb-touch-config-dpad-x"
          aria-label="Posizione D-pad orizzontale"
          onChange={(e) => onChange({ dpadOffsetX: parseInt(e.target.value, 10) })}
        />
      </label>

      {/* Posizione D-pad (Y) */}
      <label className="sb-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <span className="sb-key">D-pad basso: {config.dpadOffsetY}%</span>
        <input
          type="range"
          className="sb-range"
          min={0}
          max={40}
          step={1}
          value={config.dpadOffsetY}
          data-testid="sb-touch-config-dpad-y"
          aria-label="Posizione D-pad verticale"
          onChange={(e) => onChange({ dpadOffsetY: parseInt(e.target.value, 10) })}
        />
      </label>

      {/* Posizione pulsanti (X) */}
      <label className="sb-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <span className="sb-key">Pulsanti destra: {config.buttonsOffsetX}%</span>
        <input
          type="range"
          className="sb-range"
          min={0}
          max={40}
          step={1}
          value={config.buttonsOffsetX}
          data-testid="sb-touch-config-btns-x"
          aria-label="Posizione pulsanti orizzontale"
          onChange={(e) => onChange({ buttonsOffsetX: parseInt(e.target.value, 10) })}
        />
      </label>

      {/* Posizione pulsanti (Y) */}
      <label className="sb-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <span className="sb-key">Pulsanti basso: {config.buttonsOffsetY}%</span>
        <input
          type="range"
          className="sb-range"
          min={0}
          max={40}
          step={1}
          value={config.buttonsOffsetY}
          data-testid="sb-touch-config-btns-y"
          aria-label="Posizione pulsanti verticale"
          onChange={(e) => onChange({ buttonsOffsetY: parseInt(e.target.value, 10) })}
        />
      </label>

      <div className="sd-flex sd-gap-sm">
        <button
          type="button"
          className="sb-btn sb-btn-primary"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={handleSave}
          disabled={saving}
          data-testid="sb-touch-config-save"
        >
          {saving ? "Salvataggio…" : "Salva"}
        </button>
        <button
          type="button"
          className="sb-btn"
          onClick={onClose}
          data-testid="sb-touch-config-close"
        >
          Chiudi
        </button>
      </div>

      {saved && (
        <p className="sb-note" role="status" data-testid="sb-touch-config-saved">
          Config salvata.
        </p>
      )}
    </div>
  );
}
