// TSK-065 — test useAppLifecycle: pausa/ripresa emulazione in background (US-031).
//
// Strategia:
// - Stubbaggio di `document.hidden` e dispatch di `visibilitychange`.
// - Mock del LifecycleTarget (pause/resume/currentState).
// - Verifica che pause venga chiamato quando `hidden=true` e il target è running,
//   e resume quando `hidden=false` e il target è paused.
// - Guard: null/undefined target non crasha; senza Capacitor nativo non crasha.

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppLifecycle } from "./useAppLifecycle";
import type { SessionState } from "../core/core-wrapper";

// --------------------------------------------------------------------------
// Helper: target mock
// --------------------------------------------------------------------------

function makeTarget(initial: SessionState = "running") {
  let state: SessionState = initial;
  const pause = vi.fn(() => {
    state = "paused";
  });
  const resume = vi.fn(() => {
    state = "running";
  });
  const target = {
    pause,
    resume,
    get currentState() {
      return state;
    },
  };
  return target;
}

// --------------------------------------------------------------------------
// Helper: imposta document.hidden
// --------------------------------------------------------------------------

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    writable: true,
    configurable: true,
    value: hidden,
  });
}

// --------------------------------------------------------------------------
// Setup / teardown
// --------------------------------------------------------------------------

beforeEach(() => {
  setDocumentHidden(false);
  // Assicurarsi che Capacitor non sia simulato come nativo nei test base.
  Object.defineProperty(window, "Capacitor", {
    writable: true,
    configurable: true,
    value: undefined,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// --------------------------------------------------------------------------
// TSK-065 — useAppLifecycle
// --------------------------------------------------------------------------

describe("useAppLifecycle", () => {
  it("null target: non crasha", () => {
    expect(() => renderHook(() => useAppLifecycle(null))).not.toThrow();
  });

  it("undefined target: non crasha", () => {
    expect(() => renderHook(() => useAppLifecycle(undefined))).not.toThrow();
  });

  it("visibilitychange hidden=true → pause() chiamato se running", () => {
    const target = makeTarget("running");
    renderHook(() => useAppLifecycle(target));

    act(() => {
      setDocumentHidden(true);
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(target.pause).toHaveBeenCalledTimes(1);
    expect(target.resume).not.toHaveBeenCalled();
  });

  it("visibilitychange hidden=false → resume() chiamato se paused", () => {
    const target = makeTarget("paused");
    renderHook(() => useAppLifecycle(target));

    act(() => {
      setDocumentHidden(false);
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(target.resume).toHaveBeenCalledTimes(1);
    expect(target.pause).not.toHaveBeenCalled();
  });

  it("visibilitychange hidden=true ma stato non running → pause NON chiamato", () => {
    const target = makeTarget("paused"); // già in pausa
    renderHook(() => useAppLifecycle(target));

    act(() => {
      setDocumentHidden(true);
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(target.pause).not.toHaveBeenCalled();
  });

  it("visibilitychange hidden=false ma stato non paused → resume NON chiamato", () => {
    const target = makeTarget("running"); // già in running
    renderHook(() => useAppLifecycle(target));

    act(() => {
      setDocumentHidden(false);
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(target.resume).not.toHaveBeenCalled();
  });

  it("ciclo completo: hidden=true → pause, poi hidden=false → resume", () => {
    const target = makeTarget("running");
    renderHook(() => useAppLifecycle(target));

    // Vai in background
    act(() => {
      setDocumentHidden(true);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(target.pause).toHaveBeenCalledTimes(1);
    expect(target.currentState).toBe("paused");

    // Torna in foreground
    act(() => {
      setDocumentHidden(false);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(target.resume).toHaveBeenCalledTimes(1);
    expect(target.currentState).toBe("running");
  });

  it("cleanup al unmount: il listener viene rimosso", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const target = makeTarget("running");

    const { unmount } = renderHook(() => useAppLifecycle(target));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
  });

  it("senza Capacitor nativo: non invoca import dinamico, funziona solo con visibility", () => {
    // Capacitor è undefined → isCapacitorNative() = false → nessun import dinamico.
    // Verifica che il comportamento con visibility sia comunque corretto.
    const target = makeTarget("running");
    renderHook(() => useAppLifecycle(target));

    act(() => {
      setDocumentHidden(true);
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(target.pause).toHaveBeenCalledTimes(1);
  });
});
