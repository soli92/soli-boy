// TSK-036 (F-036-01) — Adapter concreto del `VideoSettingsPort`.
//
// Wrapper sottile sopra `ConfigPort` (store IndexedDB `config`, keyPath "key"):
// - load  → getConfig<VideoSettings>("video-settings")
// - save  → setConfig<VideoSettings>("video-settings", s)
//
// Chiave canonica `video-settings` (ref. JSDoc su `VideoSettingsPort` in
// `useVideoSettings.ts`). Allineato al pattern del modulo `storage/bios.ts`:
// componente sa solo della porta astratta; il wiring concreto vive qui.

import type { ConfigPort } from "../../storage/port";
import type { VideoSettings, VideoSettingsPort } from "./useVideoSettings";

/** Chiave canonica usata nello store `config` (single source of truth). */
export const VIDEO_SETTINGS_KEY = "video-settings";

/**
 * Crea un `VideoSettingsPort` concreto su un `ConfigPort`.
 *
 * - `load()` ritorna `null` se la chiave non è presente (primo avvio): semantica
 *   richiesta da `useVideoSettings` per restare sui default senza setState.
 * - `save(s)` propaga i reject del `ConfigPort` (il chiamante decide se logarli).
 */
export function makeVideoSettingsPort(config: ConfigPort): VideoSettingsPort {
  return {
    async load(): Promise<VideoSettings | null> {
      const v = await config.getConfig<VideoSettings>(VIDEO_SETTINGS_KEY);
      return v ?? null;
    },
    async save(settings: VideoSettings): Promise<void> {
      await config.setConfig<VideoSettings>(VIDEO_SETTINGS_KEY, settings);
    },
  };
}
