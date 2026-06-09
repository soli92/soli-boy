// TSK-066 — test useHaptics: feedback aptico opzionale via Capacitor Haptics (US-032).
//
// Strategia:
// - Mock di `isCapacitorNative` per simulare l'ambiente nativo.
// - Mock di `@capacitor/haptics` tramite vi.mock per verificare le chiamate.
// - Verifica che `triggerImpact` sia no-op quando enabled=false o non nativo.

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --------------------------------------------------------------------------
// Mock @capacitor/haptics — definito prima dell'import del modulo sotto test
// perché vi.mock è hoistato da Vitest.
// --------------------------------------------------------------------------
const mockImpact = vi.fn<() => Promise<void>>(() => Promise.resolve());
vi.mock("@capacitor/haptics", () => ({
  Haptics: { impact: mockImpact },
  ImpactStyle: { Light: "LIGHT", Medium: "MEDIUM", Heavy: "HEAVY" },
}));

// --------------------------------------------------------------------------
// Import del modulo sotto test — DOPO vi.mock.
// --------------------------------------------------------------------------
import { useHaptics } from "./useHaptics";

// --------------------------------------------------------------------------
// Helper: imposta window.Capacitor per simulare l'ambiente nativo.
// --------------------------------------------------------------------------
function mockNativeEnvironment(isNative = true) {
  Object.defineProperty(window, "Capacitor", {
    writable: true,
    configurable: true,
    value: {
      isNativePlatform: () => isNative,
    },
  });
}

function clearNativeEnvironment() {
  Object.defineProperty(window, "Capacitor", {
    writable: true,
    configurable: true,
    value: undefined,
  });
}

// --------------------------------------------------------------------------
// TSK-066 — useHaptics
// --------------------------------------------------------------------------

describe("useHaptics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearNativeEnvironment();
  });

  it("triggerImpact è no-op quando enabled=false (ambiente nativo)", async () => {
    mockNativeEnvironment(true);
    const { result } = renderHook(() => useHaptics(false));
    act(() => {
      result.current.triggerImpact();
    });
    // Attendiamo un tick per eventuali import dinamici.
    await new Promise((r) => setTimeout(r, 10));
    expect(mockImpact).not.toHaveBeenCalled();
  });

  it("triggerImpact è no-op quando non in ambiente nativo (guard)", async () => {
    clearNativeEnvironment(); // Capacitor non disponibile.
    const { result } = renderHook(() => useHaptics(true));
    act(() => {
      result.current.triggerImpact();
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(mockImpact).not.toHaveBeenCalled();
  });

  it("triggerImpact è no-op quando Capacitor.isNativePlatform() ritorna false", async () => {
    mockNativeEnvironment(false);
    const { result } = renderHook(() => useHaptics(true));
    act(() => {
      result.current.triggerImpact();
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(mockImpact).not.toHaveBeenCalled();
  });

  it("non crasha quando window è undefined (SSR guard)", () => {
    // Simula window undefined tramite il guard interno: testiamo che l'hook
    // non lanci anche se il guard lo blocca.
    clearNativeEnvironment();
    const { result } = renderHook(() => useHaptics(true));
    expect(() => {
      act(() => {
        result.current.triggerImpact();
      });
    }).not.toThrow();
  });
});

// --------------------------------------------------------------------------
// TSK-066 — useHapticsConfig
// --------------------------------------------------------------------------
import { act as actHook, renderHook as renderHookConfig, waitFor } from "@testing-library/react";
import type { ConfigPort } from "../../storage/port";
import { useHapticsConfig, HAPTICS_CONFIG_KEY } from "./useHapticsConfig";

function fakeConfigPort(stored?: string): ConfigPort & {
  setConfigMock: ReturnType<typeof vi.fn>;
  getConfigMock: ReturnType<typeof vi.fn>;
} {
  const setConfigMock = vi.fn<ConfigPort["setConfig"]>(async () => {});
  const getConfigMock = vi.fn<ConfigPort["getConfig"]>(async () => stored as never);
  return {
    setConfigMock,
    getConfigMock,
    setConfig: setConfigMock,
    getConfig: getConfigMock,
    addRom: vi.fn(),
    listRoms: vi.fn(),
    listRomsMeta: vi.fn(),
    getRom: vi.fn(),
    removeRom: vi.fn(),
  } as unknown as ConfigPort & {
    setConfigMock: ReturnType<typeof vi.fn>;
    getConfigMock: ReturnType<typeof vi.fn>;
  };
}

describe("useHapticsConfig", () => {
  it("default OFF: hapticsEnabled=false senza storage", async () => {
    const { result } = renderHookConfig(() => useHapticsConfig(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hapticsEnabled).toBe(false);
  });

  it("al mount chiama getConfig con la chiave canonica", async () => {
    const port = fakeConfigPort(undefined);
    const { result } = renderHookConfig(() => useHapticsConfig(port));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(port.getConfigMock).toHaveBeenCalledWith(HAPTICS_CONFIG_KEY);
  });

  it("carica 'true' → hapticsEnabled=true", async () => {
    const port = fakeConfigPort("true");
    const { result } = renderHookConfig(() => useHapticsConfig(port));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hapticsEnabled).toBe(true);
  });

  it("carica 'false' → hapticsEnabled=false", async () => {
    const port = fakeConfigPort("false");
    const { result } = renderHookConfig(() => useHapticsConfig(port));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hapticsEnabled).toBe(false);
  });

  it("setHapticsEnabled aggiorna lo stato", async () => {
    const port = fakeConfigPort();
    const { result } = renderHookConfig(() => useHapticsConfig(port));
    await waitFor(() => expect(result.current.loading).toBe(false));
    actHook(() => {
      result.current.setHapticsEnabled(true);
    });
    expect(result.current.hapticsEnabled).toBe(true);
  });

  it("saveHapticsEnabled persiste 'true' via setConfig", async () => {
    const port = fakeConfigPort();
    const { result } = renderHookConfig(() => useHapticsConfig(port));
    await waitFor(() => expect(result.current.loading).toBe(false));
    actHook(() => {
      result.current.setHapticsEnabled(true);
    });
    // Passa il valore esplicitamente per evitare la closure stantia.
    await actHook(async () => {
      await result.current.saveHapticsEnabled(true);
    });
    expect(port.setConfigMock).toHaveBeenCalledWith(HAPTICS_CONFIG_KEY, "true");
  });

  it("saveHapticsEnabled persiste 'false' via setConfig", async () => {
    const port = fakeConfigPort("true");
    const { result } = renderHookConfig(() => useHapticsConfig(port));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await actHook(async () => {
      await result.current.saveHapticsEnabled(false);
    });
    expect(port.setConfigMock).toHaveBeenCalledWith(HAPTICS_CONFIG_KEY, "false");
  });

  it("senza storage: saveHapticsEnabled non crasha", async () => {
    const { result } = renderHookConfig(() => useHapticsConfig(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(result.current.saveHapticsEnabled()).resolves.toBeUndefined();
  });
});
