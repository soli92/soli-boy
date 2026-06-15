// TSK-102 (US-053) — Test useAutoStartConfig: idratazione, persistenza,
// gestione save-reject. Pattern speculare a `useTheme.test.ts` (TSK-047) ma
// agisce sulla porta generica `ConfigPort` (store `config`, chiave
// `auto-start-from-library`).
//
// Ambiente: jsdom (globale in vite.config.ts → test.environment = "jsdom").

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ConfigPort } from "../../storage/port";
import {
  AUTO_START_CONFIG_KEY,
  DEFAULT_AUTO_START_FROM_LIBRARY,
  useAutoStartConfig,
} from "./useAutoStartConfig";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(
  initial: string | undefined | null = undefined,
  setFn?: (key: string, value: unknown) => Promise<void>,
): ConfigPort & {
  getConfig: ReturnType<typeof vi.fn>;
  setConfig: ReturnType<typeof vi.fn>;
} {
  return {
    getConfig: vi.fn(async (key: string) => {
      // Restituisce il valore preconfigurato SOLO per la chiave canonica
      // del hook; per altre chiavi torna undefined (rispecchia il
      // comportamento di un ConfigPort store-singolo).
      if (key === AUTO_START_CONFIG_KEY) return initial;
      return undefined;
    }) as ConfigPort["getConfig"],
    setConfig: vi.fn(
      setFn ?? (async () => {}),
    ) as ConfigPort["setConfig"],
  };
}

// ---------------------------------------------------------------------------
// useAutoStartConfig — idratazione
// ---------------------------------------------------------------------------

describe("useAutoStartConfig — idratazione (US-053 AC1 default ON)", () => {
  it("default ON quando la chiave non è mai stata persistita (getConfig→undefined)", async () => {
    const config = makeConfig(undefined);
    const { result } = renderHook(() => useAutoStartConfig(config));
    await waitFor(() => expect(config.getConfig).toHaveBeenCalled());
    expect(result.current.autoStartFromLibrary).toBe(true);
    expect(result.current.autoStartFromLibrary).toBe(
      DEFAULT_AUTO_START_FROM_LIBRARY,
    );
  });

  it("default ON anche quando il backend restituisce null (parità IDB/NativeFs)", async () => {
    const config = makeConfig(null);
    const { result } = renderHook(() => useAutoStartConfig(config));
    await waitFor(() => expect(config.getConfig).toHaveBeenCalled());
    expect(result.current.autoStartFromLibrary).toBe(true);
  });

  it("idra a OFF se la preferenza salvata è 'false'", async () => {
    const config = makeConfig("false");
    const { result } = renderHook(() => useAutoStartConfig(config));
    await waitFor(() =>
      expect(result.current.autoStartFromLibrary).toBe(false),
    );
  });

  it("idra a ON se la preferenza salvata è 'true'", async () => {
    const config = makeConfig("true");
    const { result } = renderHook(() => useAutoStartConfig(config));
    await waitFor(() => expect(config.getConfig).toHaveBeenCalled());
    expect(result.current.autoStartFromLibrary).toBe(true);
  });

  it("nessuna porta → default ON (backward compat)", async () => {
    const { result } = renderHook(() => useAutoStartConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.autoStartFromLibrary).toBe(true);
  });

  it("legge dalla chiave canonica 'auto-start-from-library'", async () => {
    const config = makeConfig(undefined);
    renderHook(() => useAutoStartConfig(config));
    await waitFor(() => expect(config.getConfig).toHaveBeenCalled());
    expect(config.getConfig).toHaveBeenCalledWith(AUTO_START_CONFIG_KEY);
  });
});

// ---------------------------------------------------------------------------
// useAutoStartConfig — persistenza
// ---------------------------------------------------------------------------

describe("useAutoStartConfig — persistenza (US-053 AC2)", () => {
  it("saveAutoStartFromLibrary(false) ⇒ setConfig chiamato con 'false'", async () => {
    const config = makeConfig(undefined);
    const { result } = renderHook(() => useAutoStartConfig(config));
    await waitFor(() => expect(config.getConfig).toHaveBeenCalled());

    await act(async () => {
      await result.current.saveAutoStartFromLibrary(false);
    });

    expect(config.setConfig).toHaveBeenCalledWith(
      AUTO_START_CONFIG_KEY,
      "false",
    );
  });

  it("saveAutoStartFromLibrary(true) ⇒ setConfig chiamato con 'true'", async () => {
    const config = makeConfig("false");
    const { result } = renderHook(() => useAutoStartConfig(config));
    await waitFor(() =>
      expect(result.current.autoStartFromLibrary).toBe(false),
    );

    await act(async () => {
      await result.current.saveAutoStartFromLibrary(true);
    });

    expect(config.setConfig).toHaveBeenCalledWith(
      AUTO_START_CONFIG_KEY,
      "true",
    );
  });

  it("setAutoStartFromLibrary aggiorna lo stato in memoria", async () => {
    const config = makeConfig(undefined);
    const { result } = renderHook(() => useAutoStartConfig(config));
    await waitFor(() => expect(config.getConfig).toHaveBeenCalled());

    await act(async () => {
      result.current.setAutoStartFromLibrary(false);
    });

    expect(result.current.autoStartFromLibrary).toBe(false);
  });

  it("saveAutoStartFromLibrary() senza arg usa lo stato corrente", async () => {
    const config = makeConfig("true");
    const { result } = renderHook(() => useAutoStartConfig(config));
    await waitFor(() => expect(result.current.autoStartFromLibrary).toBe(true));

    await act(async () => {
      result.current.setAutoStartFromLibrary(false);
      // Senza il `value` esplicito, prima di TSK-066 la closure stantia
      // avrebbe persistito il valore PRECEDENTE; ora deve persistere lo
      // stato corrente — la chiamata avviene fuori dallo stesso tick
      // (await), quindi vediamo `false`.
    });
    await act(async () => {
      await result.current.saveAutoStartFromLibrary();
    });

    expect(config.setConfig).toHaveBeenCalledWith(
      AUTO_START_CONFIG_KEY,
      "false",
    );
  });

  it("no storage → save è no-op (non lancia, non crash)", async () => {
    const { result } = renderHook(() => useAutoStartConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(
      result.current.saveAutoStartFromLibrary(false),
    ).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// useAutoStartConfig — save-reject best-effort (parità con useTheme F-044-02)
// ---------------------------------------------------------------------------

describe("useAutoStartConfig — save-reject best-effort", () => {
  it("setConfig() che rejecta ⇒ console.warn chiamato, no crash, no unhandled rejection", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const saveError = new Error("QuotaExceededError");
    const config = makeConfig(undefined, async () => {
      throw saveError;
    });
    const { result } = renderHook(() => useAutoStartConfig(config));
    await waitFor(() => expect(config.getConfig).toHaveBeenCalled());

    await act(async () => {
      await result.current.saveAutoStartFromLibrary(false);
    });

    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("[auto-start] persistenza preferenza fallita:"),
      saveError,
    );

    warn.mockRestore();
  });
});
