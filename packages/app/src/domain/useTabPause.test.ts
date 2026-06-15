// TSK-099 (EP-014 / US-052) — Test isolamento `useTabPause`.
//
// Strategia:
// - Stub del PausableEngine (mock vitest) con metodi `pause` e `resume`.
// - renderHook + act per pilotare i cambi di `activeTab`.
// - Verifica: pause su uscita da playTab, resume su ritorno a playTab, no-op senza ROM.

import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTabPause } from "./useTabPause";
import type { PausableEngine } from "./useTabPause";

// --------------------------------------------------------------------------
// Helper: engine stub
// --------------------------------------------------------------------------

function makeEngine(): PausableEngine {
  return {
    pause: vi.fn(),
    resume: vi.fn(),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// --------------------------------------------------------------------------
// TSK-099 — useTabPause
// --------------------------------------------------------------------------

describe("useTabPause", () => {
  const PLAY_TAB = "play" as const;
  type Tab = "play" | "library" | "settings";

  it("mount senza cambio tab: nessuna chiamata a pause/resume", () => {
    const engine = makeEngine();
    const selected = { romId: "rom1" };
    renderHook(() =>
      useTabPause<Tab>(engine, PLAY_TAB, selected, PLAY_TAB),
    );
    expect(engine.pause).not.toHaveBeenCalled();
    expect(engine.resume).not.toHaveBeenCalled();
  });

  it("tab change play → library con ROM selezionata: pause() chiamato", () => {
    const engine = makeEngine();
    const selected = { romId: "rom1" };
    let activeTab: Tab = PLAY_TAB;

    const { rerender } = renderHook(() =>
      useTabPause<Tab>(engine, activeTab, selected, PLAY_TAB),
    );

    act(() => {
      activeTab = "library";
    });
    rerender();

    expect(engine.pause).toHaveBeenCalledTimes(1);
    expect(engine.resume).not.toHaveBeenCalled();
  });

  it("tab change library → play con ROM selezionata: resume() chiamato", () => {
    const engine = makeEngine();
    const selected = { romId: "rom1" };
    let activeTab: Tab = "library";

    const { rerender } = renderHook(() =>
      useTabPause<Tab>(engine, activeTab, selected, PLAY_TAB),
    );

    act(() => {
      activeTab = PLAY_TAB;
    });
    rerender();

    expect(engine.resume).toHaveBeenCalledTimes(1);
    expect(engine.pause).not.toHaveBeenCalled();
  });

  it("tab change play → settings con ROM selezionata: pause() chiamato", () => {
    const engine = makeEngine();
    const selected = { romId: "rom1" };
    let activeTab: Tab = PLAY_TAB;

    const { rerender } = renderHook(() =>
      useTabPause<Tab>(engine, activeTab, selected, PLAY_TAB),
    );

    act(() => {
      activeTab = "settings";
    });
    rerender();

    expect(engine.pause).toHaveBeenCalledTimes(1);
  });

  it("tab change library → settings (non-play → non-play): nessuna chiamata", () => {
    const engine = makeEngine();
    const selected = { romId: "rom1" };
    let activeTab: Tab = "library";

    const { rerender } = renderHook(() =>
      useTabPause<Tab>(engine, activeTab, selected, PLAY_TAB),
    );

    act(() => {
      activeTab = "settings";
    });
    rerender();

    expect(engine.pause).not.toHaveBeenCalled();
    expect(engine.resume).not.toHaveBeenCalled();
  });

  it("tab change play → library senza ROM (selected=null): no-op, pause NON chiamato", () => {
    const engine = makeEngine();
    let activeTab: Tab = PLAY_TAB;

    const { rerender } = renderHook(() =>
      useTabPause<Tab>(engine, activeTab, null, PLAY_TAB),
    );

    act(() => {
      activeTab = "library";
    });
    rerender();

    expect(engine.pause).not.toHaveBeenCalled();
    expect(engine.resume).not.toHaveBeenCalled();
  });

  it("tab change library → play senza ROM (selected=null): no-op, resume NON chiamato", () => {
    const engine = makeEngine();
    let activeTab: Tab = "library";

    const { rerender } = renderHook(() =>
      useTabPause<Tab>(engine, activeTab, null, PLAY_TAB),
    );

    act(() => {
      activeTab = PLAY_TAB;
    });
    rerender();

    expect(engine.resume).not.toHaveBeenCalled();
    expect(engine.pause).not.toHaveBeenCalled();
  });

  it("ciclo completo play → library → play: prima pause poi resume", () => {
    const engine = makeEngine();
    const selected = { romId: "rom1" };
    let activeTab: Tab = PLAY_TAB;

    const { rerender } = renderHook(() =>
      useTabPause<Tab>(engine, activeTab, selected, PLAY_TAB),
    );

    // Lascia la tab play
    act(() => {
      activeTab = "library";
    });
    rerender();
    expect(engine.pause).toHaveBeenCalledTimes(1);

    // Ritorna a play
    act(() => {
      activeTab = PLAY_TAB;
    });
    rerender();
    expect(engine.resume).toHaveBeenCalledTimes(1);
  });

  it("stesso tab senza cambio: nessuna chiamata anche con ROM", () => {
    const engine = makeEngine();
    const selected = { romId: "rom1" };

    const { rerender } = renderHook(() =>
      useTabPause<Tab>(engine, PLAY_TAB, selected, PLAY_TAB),
    );

    // Re-render senza cambio tab
    rerender();
    rerender();

    expect(engine.pause).not.toHaveBeenCalled();
    expect(engine.resume).not.toHaveBeenCalled();
  });
});
