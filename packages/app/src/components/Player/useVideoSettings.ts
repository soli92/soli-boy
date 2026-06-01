// TSK-036 — Stato e persistenza delle preferenze "video" (US-021):
// fattore di scala + aspect ratio del viewport di gioco.
// TSK-037 — Estensione con il campo `filter` (nearest/smoothing/scanline,
// US-022): condivide lo stesso oggetto `VideoSettings` (e quindi la stessa
// porta + lo stesso wiring App.tsx) introdotto da TSK-036.
//
// Engine-agnostico: la preferenza è applicata via CSS al contenitore `.sb-screen`
// (e, di rimando, al `<canvas>` reso dall'adapter). Nessuna modifica a
// `EmulatorEngine` (vedi design_&_architecture/architecture-overview.md §EP-005).
//
// Persistenza opzionale via `VideoSettingsPort`: l'adapter reale (IndexedDB
// `config` store) è cablato dalla composizione applicativa, fuori scope di
// questo componente; qui consumiamo solo la porta.

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

/**
 * TSK-037 — Filtri base (US-022).
 * - `nearest`: pixel art crisp — `image-rendering: pixelated` sul canvas.
 * - `smoothing`: interpolazione del browser — `image-rendering: auto`.
 * - `scanline`: pixelated + overlay scanline (CSS, sopra il canvas).
 * Default canonico: `nearest` (resa tipica per piattaforme retro come GB/GBA).
 */
export const VIDEO_FILTERS = ["nearest", "smoothing", "scanline"] as const;
export type VideoFilter = (typeof VIDEO_FILTERS)[number];

export interface VideoSettings {
  scale: ScaleFactor;
  aspect: AspectRatio;
  /** TSK-037 — filtro video (US-022). Default: "nearest". */
  filter: VideoFilter;
}

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  scale: "auto",
  aspect: "original",
  filter: "nearest",
};

/**
 * TSK-037 — Backward-compat: applica i default di `DEFAULT_VIDEO_SETTINGS` ai
 * campi mancanti in un valore persistito. È rilevante quando lo schema di
 * `VideoSettings` viene esteso (es. aggiunta del campo `filter` rispetto a
 * TSK-036): un valore salvato da una versione precedente NON contiene il
 * nuovo campo, quindi senza merge l'UI mostrerebbe `undefined` (es. select
 * senza opzione selezionata). Centralizzato qui per evitare drift fra
 * consumatori e per essere riusabile da test.
 *
 * Implementazione: shallow merge, default-first → eventuali campi noti del
 * valore persistito sovrascrivono i default; campi sconosciuti sono ignorati
 * dal type system (TypeScript narrowa a `VideoSettings`).
 */
export function mergeWithDefaults(
  partial: Partial<VideoSettings> | null | undefined,
): VideoSettings {
  if (!partial) return { ...DEFAULT_VIDEO_SETTINGS };
  return { ...DEFAULT_VIDEO_SETTINGS, ...partial };
}

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
        // TSK-037 — backward-compat: un valore persistito da una versione
        // precedente potrebbe non avere `filter` (o altri campi futuri).
        // Merge con i default per evitare `undefined` nei consumatori.
        if (loaded) setValueState(mergeWithDefaults(loaded));
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

/**
 * TSK-037 — Mappa il filtro al valore di `image-rendering` per il `<canvas>`
 * interno (US-022). Engine-agnostico: il filtro si applica via CSS al canvas
 * reso dall'adapter, non tocchiamo `EmulatorEngine`.
 *
 * - `nearest`: `pixelated` (no interpolazione, pixel crispi).
 * - `smoothing`: `auto` (lascia al browser l'interpolazione di default).
 * - `scanline`: `pixelated` come base (la scanline è un overlay CSS sopra,
 *   gestito separatamente da `filterShowsScanlineOverlay`).
 */
export function filterToCanvasImageRendering(
  f: VideoFilter,
): "pixelated" | "auto" {
  // Per la modalità `smoothing` lasciamo `auto`: i browser usano un'interpolazione
  // bilineare/bicubica di default, quindi non serve forzare `smooth` (deprecato
  // in alcuni engine) o vendor-specifics.
  return f === "smoothing" ? "auto" : "pixelated";
}

/**
 * TSK-037 — True se il filtro corrente richiede l'overlay scanline (US-022).
 * L'overlay è un elemento DOM (vuoto, pointer-events:none) reso sopra il
 * canvas dentro `.sb-screen`, con un `repeating-linear-gradient` che simula
 * le linee orizzontali dei CRT. Esposto come helper per testabilità.
 */
export function filterShowsScanlineOverlay(f: VideoFilter): boolean {
  return f === "scanline";
}
