// TSK-044 (US-036) — Test minimo di wiring per ThemeSelector + useTheme.
//
// Scope: copertura "smoke" della pipa
//   ThemeSelector (UI) ↔ useTheme (stato + DOM + porta)
//
// La copertura estesa (validazione opzioni, persistenza cross-session
// completa, riapplicazione al reload) è di TSK-047 (vedi US-036). Qui ci
// assicuriamo solo che la pipeline non sia "muta": data-theme applicato,
// porta consultata al mount, save invocata al cambio, onThemeChange
// propagata.

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
    const sel = screen.getByLabelText(
      "Tema dell'interfaccia",
    ) as HTMLSelectElement;
    expect(sel.value).toBe("90s-party");
    expect(Array.from(sel.options).map((o) => o.value)).toEqual([
      "90s-party",
      "dark",
      "cyberpunk",
    ]);
    expect(Array.from(sel.options).map((o) => o.textContent)).toEqual([
      "90's Party",
      "Dark",
      "Cyberpunk",
    ]);
  });

  it("change su <select> invoca onThemeChange col nuovo valore", () => {
    const onThemeChange = vi.fn();
    render(<ThemeSelector theme="90s-party" onThemeChange={onThemeChange} />);
    fireEvent.change(screen.getByLabelText("Tema dell'interfaccia"), {
      target: { value: "cyberpunk" },
    });
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
    // mount + load(null) → default canonico applicato
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
