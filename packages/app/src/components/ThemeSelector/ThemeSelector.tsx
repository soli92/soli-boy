// TSK-044 (US-036) — ThemeSelector: <select> controllato per scegliere il tema UI.
//
// Componente "puro": riceve `theme` corrente e una `onThemeChange` callback.
// La persistenza (IndexedDB `config` store, chiave `"ui-theme"`) è gestita
// fuori da qui — tipicamente da `useTheme(makeThemePort(indexedDbConfig))`
// in `App.tsx`. Stesso pattern controllato delle `Resa video` (Settings.tsx).
//
// Opzioni canoniche (US-036 §Acceptance Criteria): `90s-party`, `dark`,
// `cyberpunk`. Le label user-facing sono "90's Party", "Dark", "Cyberpunk".

import { UI_THEMES, type UiTheme } from "./useTheme";

export interface ThemeSelectorProps {
  /** Tema correntemente applicato (string per non vincolare i consumer ai soli `UiTheme`). */
  theme: string;
  /** Callback invocata ad ogni cambio. */
  onThemeChange: (theme: string) => void;
}

/** Etichette user-facing per i valori dei temi (US-036). */
function themeLabel(t: UiTheme): string {
  switch (t) {
    case "90s-party":
      return "90's Party";
    case "dark":
      return "Dark";
    case "cyberpunk":
      return "Cyberpunk";
  }
}

/**
 * Renderizza la riga `Tema` con una `<select>` controllata. Riusa le stesse
 * classi del `Resa video` (sb-row / sb-key / sb-sel) per coerenza visiva nella
 * sezione "Aspetto" di Settings.
 *
 * NB: il `<select>` è un'unica fonte di verità per il tema corrente; il
 * `data-theme` sul `<html>` viene aggiornato dall'hook `useTheme` (App-level),
 * non da questo componente — questo evita doppia applicazione e mantiene il
 * componente facilmente testabile senza side-effect sul DOM globale.
 */
export function ThemeSelector({ theme, onThemeChange }: ThemeSelectorProps) {
  return (
    <li className="sb-row">
      <span className="sb-key">Tema</span>
      <select
        className="sb-sel"
        aria-label="Tema dell'interfaccia"
        value={theme}
        onChange={(e) => onThemeChange(e.target.value)}
        data-testid="sb-theme-select"
      >
        {UI_THEMES.map((t) => (
          <option key={t} value={t}>
            {themeLabel(t)}
          </option>
        ))}
      </select>
    </li>
  );
}
