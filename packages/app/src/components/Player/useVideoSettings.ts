// TSK-036 — Stato e persistenza delle preferenze "video" (US-021):
// fattore di scala + aspect ratio del viewport di gioco.
//
// Engine-agnostico: la preferenza è applicata via CSS al contenitore `.sb-screen`
// (e, di rimando, al `<canvas>` reso dall'adapter). Nessuna modifica a
// `EmulatorEngine` (vedi design_&_architecture/architecture-overview.md §EP-005).
//
// Persistenza opzionale via `VideoSettingsPort`: l'adapter reale (IndexedDB
// `config` store) è cablato dalla composizione applicativa, fuori scope di
// questo componente; qui consumiamo solo la porta. Filtri nearest/smoothing/
// scanline NON sono coperti da questo TSK (vedi TSK-037).

import { useCallback, useEffect, useState, type CSSProperties } from "react";

/** Fattori di scala discreti supportati (1x..5x) più la modalità "adatta" (auto). */
export const SCALE_FACTORS = [1, 2, 3, 4, 5] as const;
export type ScaleFactor = (typeof SCALE_FACTORS)[number] | "auto";

/**
 * Aspect ratio del viewport:
 * - `original`: rispetta l'aspect intrinseco del frame (object-fit: contain).
 * - `4:3`: forza 4/3 (TV CRT classico) con letterbox (object-fit: contain).
 * - `stretch`: riempie il box contenitore, può deformare (object-fit: fill).
 */
export const ASPECT_RATIOS = ["original", "4:3", "stretch"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export interface VideoSettings {
  scale: ScaleFactor;
  aspect: AspectRatio;
}

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  scale: "auto",
  aspect: "original",
};

/**
 * Larghezza base di riferimento (px) usata quando `scale` è un fattore numerico.
 * Valore allineato alla risoluzione tipica dei core GB/GBA scalata, sufficiente
 * a esprimere 1x..5x in viewport desktop senza superare il container del Player.
 */
export const BASE_VIEWPORT_WIDTH_PX = 160;

/**
 * Porta di persistenza opzionale. Stessa forma usata altrove nel progetto
 * (cfr. storage/bios.ts che usa la key `bios:<platform>` sullo store `config`):
 * qui la chiave canonica suggerita è `video-settings`.
 *
 * - `load()` ritorna `null` se non c'è preferenza salvata (primo avvio).
 * - `save(s)` persiste in modo idempotente; gli errori sono propagati per
 *   permettere al chiamante di mostrare un warning, ma NON degradano lo stato
 *   in memoria (la UI continua a riflettere `s`).
 */
export interface VideoSettingsPort {
  load(): Promise<VideoSettings | null>;
  save(settings: VideoSettings): Promise<void>;
}

export interface UseVideoSettingsResult {
  /** Valore corrente (sempre definito; default applicato in attesa del load). */
  value: VideoSettings;
  /** Aggiorna il valore e, se disponibile la porta, lo persiste. */
  setValue: (next: VideoSettings) => void;
  /** True dopo che `port.load()` ha completato (o se la porta è assente). */
  hydrated: boolean;
}

/**
 * Hook condiviso da Player e Settings per leggere/scrivere le preferenze video.
 *
 * Comportamento:
 * - Senza `port`: stato puramente in-memory inizializzato ai default.
 * - Con `port`: al mount invoca `port.load()`; se ritorna un valore lo applica.
 *   Ad ogni `setValue(next)` aggiorna lo stato e invoca `port.save(next)`
 *   (best-effort: un eventuale reject NON rolla back la UI, ma è loggato).
 */
export function useVideoSettings(
  port?: VideoSettingsPort,
  initial: VideoSettings = DEFAULT_VIDEO_SETTINGS,
): UseVideoSettingsResult {
  const [value, setValueState] = useState<VideoSettings>(initial);
  const [hydrated, setHydrated] = useState<boolean>(!port);

  useEffect(() => {
    let cancelled = false;
    if (!port) {
      setHydrated(true);
      return;
    }
    port
      .load()
      .then((loaded) => {
        if (cancelled) return;
        if (loaded) setValueState(loaded);
        setHydrated(true);
      })
      .catch((err) => {
        if (cancelled) return;
        // Persistenza degradata: continuiamo con i default in memoria.
        // Diagnostico (F-036-03): rende visibile il degradamento in dev/console
        // senza propagare l'errore alla UI (lo stato in memoria resta valido).
        console.warn("[useVideoSettings] port.load() rejected:", err);
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [port]);

  const setValue = useCallback(
    (next: VideoSettings) => {
      setValueState(next);
      if (port) {
        // Best-effort: non blocchiamo la UI sull'I/O.
        port.save(next).catch((err) => {
          // Diagnostico (F-036-03): la UI resta su `next`; logghiamo perché la
          // persistenza è fallita per facilitare il debug (quota piena, DB
          // chiuso da un altro tab, ecc.).
          console.warn("[useVideoSettings] port.save() rejected:", err);
        });
      }
    },
    [port],
  );

  return { value, setValue, hydrated };
}

/**
 * Calcola lo stile CSS da applicare al contenitore del viewport (`.sb-screen`)
 * in funzione di scala/aspect ratio. Engine-agnostico: agiamo sul box che
 * contiene il `<canvas>` reso dall'adapter.
 *
 * Mappatura:
 * - `scale = N` (1..5): width = N * BASE_VIEWPORT_WIDTH_PX. Container fisso.
 * - `scale = "auto"`: width = 100% (adatta al contenitore parent).
 * - `aspect = "original"`: aspect-ratio lasciato auto (canvas conserva il proprio).
 * - `aspect = "4:3"`: aspect-ratio: 4 / 3.
 * - `aspect = "stretch"`: aspect-ratio: auto + height: 100% (riempie). In pratica
 *   lasciamo il box libero e demandiamo all'inner canvas via `object-fit: fill`.
 */
export function videoSettingsToContainerStyle(
  s: VideoSettings,
): CSSProperties {
  const style: CSSProperties = {};
  if (s.scale === "auto") {
    style.width = "100%";
  } else {
    style.width = `${s.scale * BASE_VIEWPORT_WIDTH_PX}px`;
  }
  if (s.aspect === "4:3") {
    style.aspectRatio = "4 / 3";
  } else if (s.aspect === "original") {
    // Lasciamo che il canvas determini la propria aspect intrinseca.
    style.aspectRatio = "auto";
  } else {
    // stretch: nessun vincolo di aspect; l'inner canvas verrà steso via object-fit.
    style.aspectRatio = "auto";
  }
  return style;
}

/**
 * Calcola il valore di `object-fit` da propagare al `<canvas>` interno
 * (engine-agnostico). Per "stretch" usiamo `fill` (deforma a riempire),
 * per gli altri valori `contain` (rispetta proporzioni con eventuale letterbox).
 */
export function aspectToCanvasObjectFit(a: AspectRatio): "contain" | "fill" {
  return a === "stretch" ? "fill" : "contain";
}
