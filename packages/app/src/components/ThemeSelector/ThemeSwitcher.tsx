// EP-021 — Quick theme toggle in app header (prototype parity).
// Cycles cyberpunk ↔ 90s-party; "dark" stays in Settings RadioGroup only.

import type { UiTheme } from "./useTheme";

/** Temi esposti nel toggle rapido header (allineato al prototipo EP-020). */
export const QUICK_TOGGLE_THEMES = ["cyberpunk", "90s-party"] as const;
export type QuickToggleTheme = (typeof QUICK_TOGGLE_THEMES)[number];

const THEME_LABELS: Record<QuickToggleTheme, string> = {
  cyberpunk: "CYBERPUNK",
  "90s-party": "90S PARTY",
};

const THEME_NEXT: Record<QuickToggleTheme, QuickToggleTheme> = {
  cyberpunk: "90s-party",
  "90s-party": "cyberpunk",
};

/** Normalizza un tema UI al pair del quick toggle (dark → cyberpunk). */
export function toQuickToggleTheme(theme: UiTheme): QuickToggleTheme {
  return theme === "90s-party" ? "90s-party" : "cyberpunk";
}

export interface ThemeSwitcherProps {
  theme: UiTheme;
  onThemeChange: (next: string) => void;
}

export function ThemeSwitcher({ theme, onThemeChange }: ThemeSwitcherProps) {
  const current = toQuickToggleTheme(theme);
  const next = THEME_NEXT[current];

  return (
    <button
      type="button"
      className="theme-switcher"
      onClick={() => onThemeChange(next)}
      aria-label={`Tema corrente: ${THEME_LABELS[current]}. Clicca per passare a ${THEME_LABELS[next]}`}
    >
      <span className="theme-dot" aria-hidden="true" />
      <span>{THEME_LABELS[current]}</span>
      <span className="theme-switcher-sep" aria-hidden="true">
        ↔
      </span>
      <span>{THEME_LABELS[next]}</span>
    </button>
  );
}
