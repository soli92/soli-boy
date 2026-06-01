// TSK-047 (US-036) — Test estesi per useTheme: idratazione, persistenza,
// validazione parseTheme (F-044-01) e gestione save-reject (F-044-02).
//
// Separato da ThemeSelector.test.tsx per tenere distinti i test del hook
// (puri, senza rendering JSX) dai test del componente.
//
// Pattern: fake ThemePort in-memory, nessuna dipendenza da IndexedDB reale.
// Ambiente: jsdom (globale in vite.config.ts → test.environment = "jsdom").

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ThemePort } from "../../storage/port";
import {
  DATA_THEME_ATTR,
  DEFAULT_UI_THEME,
  parseTheme,
  UI_THEMES,
  useTheme,
} from "./useTheme";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePort(
  initial: string | null = null,
  saveFn?: () => Promise<void>,
): ThemePort & {
  load: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
} {
  return {
    load: vi.fn<ThemePort["load"]>(async () => initial),
    save: vi.fn<ThemePort["save"]>(saveFn ?? (async () => {})),
  };
}

/** Resetta data-theme dopo ogni test per isolare gli effetti sul documentElement. */
afterEach(() => {
  document.documentElement.removeAttribute(DATA_THEME_ATTR);
});

// ---------------------------------------------------------------------------
// parseTheme — F-044-01 (unit pura, no hook)
// ---------------------------------------------------------------------------

describe("parseTheme (F-044-01, US-036)", () => {
  it("restituisce il valore invariato per temi validi", () => {
    for (const t of UI_THEMES) {
      expect(parseTheme(t)).toBe(t);
    }
  });

  it("cade su DEFAULT_UI_THEME per valori non presenti in UI_THEMES", () => {
    expect(parseTheme("non-existent-theme")).toBe(DEFAULT_UI_THEME);
    expect(parseTheme("")).toBe(DEFAULT_UI_THEME);
    expect(parseTheme("DARK")).toBe(DEFAULT_UI_THEME); // case-sensitive
    expect(parseTheme("unknown")).toBe(DEFAULT_UI_THEME);
  });
});

// ---------------------------------------------------------------------------
// useTheme — idratazione
// ---------------------------------------------------------------------------

describe("useTheme — idratazione (US-036 AC: tema 90s-party applicato)", () => {
  it("idra dal default: port.load()→null ⇒ tema '90s-party'", async () => {
    const port = makePort(null);
    const { result } = renderHook(() => useTheme(port));
    await waitFor(() => expect(port.load).toHaveBeenCalled());
    expect(result.current.theme).toBe(DEFAULT_UI_THEME);
  });

  it("data-theme su documentElement impostato a '90s-party' al mount (senza porta)", async () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe(DEFAULT_UI_THEME);
    await waitFor(() => {
      expect(document.documentElement.getAttribute(DATA_THEME_ATTR)).toBe(
        "90s-party",
      );
    });
  });

  it("idra dalla porta: port.load()→'cyberpunk' ⇒ tema 'cyberpunk'", async () => {
    const port = makePort("cyberpunk");
    const { result } = renderHook(() => useTheme(port));
    await waitFor(() => expect(result.current.theme).toBe("cyberpunk"));
    expect(document.documentElement.getAttribute(DATA_THEME_ATTR)).toBe(
      "cyberpunk",
    );
  });

  it("idra dalla porta: port.load()→'dark' ⇒ tema 'dark'", async () => {
    const port = makePort("dark");
    const { result } = renderHook(() => useTheme(port));
    await waitFor(() => expect(result.current.theme).toBe("dark"));
  });
});

// ---------------------------------------------------------------------------
// useTheme — persistenza (US-036 AC: persistenza tra sessioni)
// ---------------------------------------------------------------------------

describe("useTheme — persistenza (US-036 AC: persistenza tra sessioni)", () => {
  it("setTheme('dark') ⇒ port.save chiamato con 'dark'", async () => {
    const port = makePort(null);
    const { result } = renderHook(() => useTheme(port));
    await waitFor(() => expect(port.load).toHaveBeenCalled());

    await act(async () => {
      result.current.setTheme("dark");
    });

    expect(port.save).toHaveBeenCalledWith("dark");
  });

  it("setTheme('dark') ⇒ data-theme aggiornato a 'dark'", async () => {
    const port = makePort(null);
    const { result } = renderHook(() => useTheme(port));
    await waitFor(() => expect(port.load).toHaveBeenCalled());

    await act(async () => {
      result.current.setTheme("dark");
    });

    await waitFor(() => {
      expect(document.documentElement.getAttribute(DATA_THEME_ATTR)).toBe(
        "dark",
      );
    });
    expect(result.current.theme).toBe("dark");
  });

  it("setTheme('90s-party') ⇒ port.save chiamato con '90s-party'", async () => {
    const port = makePort("dark");
    const { result } = renderHook(() => useTheme(port));
    await waitFor(() => expect(result.current.theme).toBe("dark"));

    await act(async () => {
      result.current.setTheme("90s-party");
    });

    expect(port.save).toHaveBeenCalledWith("90s-party");
    expect(result.current.theme).toBe("90s-party");
  });
});

// ---------------------------------------------------------------------------
// useTheme — validazione parseTheme via setTheme (F-044-01)
// ---------------------------------------------------------------------------

describe("useTheme — validazione input (F-044-01, US-036)", () => {
  it(
    "port.load()→'non-existent-theme' ⇒ tema cade su default '90s-party'" +
      " (data-theme NON impostato a valore non valido)",
    async () => {
      const port = makePort("non-existent-theme");
      const { result } = renderHook(() => useTheme(port));
      await waitFor(() => expect(port.load).toHaveBeenCalled());
      // parseTheme normalizza il valore stale → DEFAULT_UI_THEME
      expect(result.current.theme).toBe(DEFAULT_UI_THEME);
      await waitFor(() => {
        const attr = document.documentElement.getAttribute(DATA_THEME_ATTR);
        expect(attr).toBe(DEFAULT_UI_THEME);
        expect(attr).not.toBe("non-existent-theme");
      });
    },
  );

  it("setTheme con valore non valido → normalizzato a default '90s-party'", async () => {
    const port = makePort(null);
    const { result } = renderHook(() => useTheme(port));
    await waitFor(() => expect(port.load).toHaveBeenCalled());

    await act(async () => {
      result.current.setTheme("invalid-theme-xyz");
    });

    expect(result.current.theme).toBe(DEFAULT_UI_THEME);
    await waitFor(() => {
      expect(document.documentElement.getAttribute(DATA_THEME_ATTR)).toBe(
        DEFAULT_UI_THEME,
      );
    });
    // port.save riceve il valore normalizzato, non quello grezzo
    expect(port.save).toHaveBeenCalledWith(DEFAULT_UI_THEME);
  });
});

// ---------------------------------------------------------------------------
// useTheme — save-reject (F-044-02 / CQRL)
// ---------------------------------------------------------------------------

describe("useTheme — save-reject best-effort (F-044-02, US-036)", () => {
  it(
    "port.save() che rejecta ⇒ console.warn chiamato E stato/data-theme " +
      "resta aggiornato al nuovo valore (no rollback, no crash)",
    async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const saveError = new Error("QuotaExceededError");
      const port = makePort(null, async () => {
        throw saveError;
      });
      const { result } = renderHook(() => useTheme(port));
      await waitFor(() => expect(port.load).toHaveBeenCalled());

      await act(async () => {
        result.current.setTheme("cyberpunk");
      });

      // Stato in memoria e data-theme devono riflettere il nuovo valore
      expect(result.current.theme).toBe("cyberpunk");
      await waitFor(() => {
        expect(document.documentElement.getAttribute(DATA_THEME_ATTR)).toBe(
          "cyberpunk",
        );
      });

      // console.warn deve essere stato chiamato per segnalare il reject
      await waitFor(() => expect(warn).toHaveBeenCalled());
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("[useTheme] port.save() rejected:"),
        saveError,
      );

      warn.mockRestore();
    },
  );
});
