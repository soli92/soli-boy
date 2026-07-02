// TSK-044 (US-036) — Test di wiring per ThemeSelector + useTheme (smoke + estesi).
// TSK-151 (EP-020) — ThemeSelector migrato a RadioGroup: i test usano
// role="radiogroup" / role="radio" invece di <select>.

import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ThemePort } from "../../storage/port";
import { ThemeSelector } from "./ThemeSelector";
import { DATA_THEME_ATTR, DEFAULT_UI_THEME, useTheme } from "./useTheme";

function makePort(initial: string | null = null): ThemePort & {
  load: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
} {
  return {
    load: vi.fn<ThemePort["load"]>(async () => initial),
    save: vi.fn<ThemePort["save"]>(async () => {}),
  };
}

describe("ThemeSelector (TSK-044 / US-036)", () => {
  it("renderizza le tre opzioni canoniche con label user-facing", () => {
    render(<ThemeSelector theme="90s-party" onThemeChange={vi.fn()} />);
    const group = screen.getByRole("radiogroup", {
      name: "Tema dell'interfaccia",
    });
    expect(group).toHaveAttribute("data-testid", "sb-theme-select");
    expect(screen.getByRole("radio", { name: "90's Party" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Dark" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Cyberpunk" })).not.toBeChecked();
  });

  it("change su radio invoca onThemeChange col nuovo valore", () => {
    const onThemeChange = vi.fn();
    render(<ThemeSelector theme="90s-party" onThemeChange={onThemeChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Cyberpunk" }));
    expect(onThemeChange).toHaveBeenCalledWith("cyberpunk");
  });

  it("render con theme='dark' → radio 'Dark' selezionato", () => {
    render(<ThemeSelector theme="dark" onThemeChange={vi.fn()} />);
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "90's Party" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Cyberpunk" })).toBeInTheDocument();
  });

  it("cambio selezione verso '90s-party' → onThemeChange chiamato con '90s-party'", () => {
    const onThemeChange = vi.fn();
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "90's Party" }));
    expect(onThemeChange).toHaveBeenCalledWith("90s-party");
  });

  it("cambio selezione verso 'cyberpunk' da 'dark' → onThemeChange chiamato con 'cyberpunk'", () => {
    const onThemeChange = vi.fn();
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Cyberpunk" }));
    expect(onThemeChange).toHaveBeenCalledWith("cyberpunk");
  });
});

describe("useTheme (TSK-044 / US-036)", () => {
  it("default = '90s-party' e applica data-theme al mount", async () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe(DEFAULT_UI_THEME);
    await waitFor(() => {
      expect(
        document.documentElement.getAttribute(DATA_THEME_ATTR),
      ).toBe("90s-party");
    });
  });

  it("con porta: idrata da port.load() al mount", async () => {
    const port = makePort("cyberpunk");
    const { result } = renderHook(() => useTheme(port));
    expect(port.load).toHaveBeenCalledOnce();
    await waitFor(() => expect(result.current.theme).toBe("cyberpunk"));
    await waitFor(() => {
      expect(
        document.documentElement.getAttribute(DATA_THEME_ATTR),
      ).toBe("cyberpunk");
    });
  });

  it("setTheme aggiorna data-theme E invoca port.save", async () => {
    const port = makePort(null);
    const { result } = renderHook(() => useTheme(port));
    await waitFor(() => expect(port.load).toHaveBeenCalled());

    await act(async () => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
    await waitFor(() => {
      expect(
        document.documentElement.getAttribute(DATA_THEME_ATTR),
      ).toBe("dark");
    });
    expect(port.save).toHaveBeenLastCalledWith("dark");
  });

  it("port.load() rejected → resta sul default, logga warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const port: ThemePort = {
      load: vi.fn(async () => {
        throw new Error("DB chiuso");
      }),
      save: vi.fn(async () => {}),
    };
    const { result } = renderHook(() => useTheme(port));
    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(result.current.theme).toBe(DEFAULT_UI_THEME);
    warn.mockRestore();
  });
});
