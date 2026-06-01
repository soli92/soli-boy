// TSK-044 (US-036) — Adapter concreto del `ThemePort`.
//
// Wrapper sottile sopra `ConfigPort` (store IndexedDB `config`, keyPath "key"):
// - load  → getConfig<string>("ui-theme")
// - save  → setConfig<string>("ui-theme", theme)
//
// Chiave canonica `"ui-theme"` (ref. JSDoc su `ThemePort` in `storage/port.ts`).
// Allineato al pattern di `makeVideoSettingsPort` (TSK-036, F-036-01): il
// componente sa solo della porta astratta; il wiring concreto vive qui.

import type { ConfigPort, ThemePort } from "../../storage/port";

/** Chiave canonica usata nello store `config` (single source of truth). */
export const UI_THEME_KEY = "ui-theme";

/**
 * Crea un `ThemePort` concreto su un `ConfigPort`.
 *
 * - `load()` ritorna `null` se la chiave non è presente (primo avvio): semantica
 *   richiesta da `useTheme` per restare sul default canonico senza setState.
 * - `save(theme)` propaga i reject del `ConfigPort` (il chiamante decide se
 *   logarli; `useTheme` li intercetta con `console.warn`).
 */
export function makeThemePort(config: ConfigPort): ThemePort {
  return {
    async load(): Promise<string | null> {
      const v = await config.getConfig<string>(UI_THEME_KEY);
      return v ?? null;
    },
    async save(theme: string): Promise<void> {
      await config.setConfig<string>(UI_THEME_KEY, theme);
    },
  };
}
