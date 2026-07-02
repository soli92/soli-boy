// TSK-044 (US-036) — ThemeSelector: scelta tema UI.
// TSK-151 (EP-020) — Migrato da <select> a RadioGroup (Radix): le 3 opzioni
// mutualmente esclusive sono tutte visibili contemporaneamente (semantica
// corretta). `data-testid="sb-theme-select"` sul RadioGroup root; contratto
// hook `useTheme` invariato (theme + setTheme).
//
// La persistenza (IndexedDB `config`, chiave `"ui-theme"`) è gestita fuori da
// qui — tipicamente da `useTheme(makeThemePort(indexedDbConfig))` in App.tsx.

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
 * RadioGroup controllato per la scelta del tema. Il `data-theme` su `<html>`
 * viene aggiornato dall'hook `useTheme` (App-level), non da questo componente.
 */
export function ThemeSelector({ theme, onThemeChange }: ThemeSelectorProps) {
  return (
    <RadioGroup
      value={theme}
      onValueChange={onThemeChange}
      className="flex flex-col gap-2"
      aria-label="Tema dell'interfaccia"
      data-testid="sb-theme-select"
    >
      {UI_THEMES.map((t) => (
        <div key={t} className="flex items-center gap-2">
          <RadioGroupItem value={t} id={`theme-${t}`} />
          <Label htmlFor={`theme-${t}`} className="cursor-pointer font-normal">
            {themeLabel(t)}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
