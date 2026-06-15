// TSK-096 (US-051) — Regressione P3-01: se `selectAdapter()` lancia a
// module-load, l'app non deve produrre white screen. Renderizza invece il
// fallback di emergenza `StorageInitErrorFallback` con messaggio canonico.
//
// Il modulo `App.tsx` invoca `selectAdapter()` a top-level (module-load),
// quindi il mock di `./storage/select-adapter` deve essere registrato PRIMA
// che `App` venga importato. Usiamo `vi.mock` (hoisted) e `await import` per
// rispettare l'ordine.

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// `App` importa la engine-registry che a sua volta carica `wasmboy`. In jsdom
// non esiste `window.AudioContext`, quindi il side-effect di `wasmboy/audio.js`
// crasha al module-load. Replichiamo il pattern già usato in
// `core/wasmboy-engine.test.ts` per neutralizzare l'import.
vi.mock("wasmboy", () => ({
  WasmBoy: {
    config: vi.fn(async () => {}),
    loadROM: vi.fn(async () => {}),
    play: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    saveState: vi.fn(async () => ({})),
    loadState: vi.fn(async () => {}),
    setJoypadState: vi.fn(),
    setSpeed: vi.fn(),
  },
}));

vi.mock("./storage/select-adapter", () => ({
  selectAdapter: () => {
    throw new Error("simulated storage init failure");
  },
  isDesktopRuntime: () => false,
}));

describe("App — TSK-096 (US-051, P3-01) selectAdapter crash fallback", () => {
  it("mostra il fallback di emergenza invece di una pagina bianca quando selectAdapter lancia", async () => {
    const { App, STORAGE_INIT_ERROR_MESSAGE } = await import("./App");

    render(<App />);

    const fallback = screen.getByTestId("sb-storage-init-error");
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveAttribute("role", "alert");
    expect(fallback).toHaveTextContent(STORAGE_INIT_ERROR_MESSAGE);
    // Il dettaglio dell'errore originale è mostrato per facilitare il triage
    // (no swallowed error: l'utente sa che è uno storage-init failure).
    expect(
      screen.getByTestId("sb-storage-init-error-detail"),
    ).toHaveTextContent("simulated storage init failure");
  });
});
