// TSK-037 — Test Player: applicazione real-time del filtro (nearest/smoothing/
// scanline) sul canvas + overlay scanline (US-022).
// Engine-agnostico: nessuna chiamata al `EmulatorEngine` per via del cambio
// filtro; agiamo via CSS scoped sul canvas + un overlay DOM dentro `.sb-screen`.

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EmulatorEngine } from "../../core/core-wrapper";
import { Player } from "./Player";
import {
  DEFAULT_VIDEO_SETTINGS,
  filterShowsScanlineOverlay,
  filterToCanvasImageRendering,
  mergeWithDefaults,
  type VideoSettings,
  type VideoSettingsPort,
} from "./useVideoSettings";

function fakeEngine(): EmulatorEngine {
  return {
    load: vi.fn<EmulatorEngine["load"]>(async () => {}),
    start: vi.fn<EmulatorEngine["start"]>(() => {}),
    pause: vi.fn<EmulatorEngine["pause"]>(() => {}),
    resume: vi.fn<EmulatorEngine["resume"]>(() => {}),
    stop: vi.fn<EmulatorEngine["stop"]>(() => {}),
    setAudio: vi.fn<EmulatorEngine["setAudio"]>(() => {}),
    sendInput: vi.fn<EmulatorEngine["sendInput"]>(() => {}),
    setSpeed: vi.fn<EmulatorEngine["setSpeed"]>(() => {}),
    snapshot: vi.fn<EmulatorEngine["snapshot"]>(async () => new Uint8Array()),
    restore: vi.fn<EmulatorEngine["restore"]>(async () => {}),
    getSram: vi.fn<EmulatorEngine["getSram"]>(async () => null),
    loadSram: vi.fn<EmulatorEngine["loadSram"]>(async () => {}),
    capabilities: { rewind: false, saveStates: false, sram: false },
  } satisfies EmulatorEngine;
}

function makePort(
  initial: VideoSettings | null,
): VideoSettingsPort & {
  load: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
} {
  return {
    load: vi.fn<VideoSettingsPort["load"]>(async () => initial),
    save: vi.fn<VideoSettingsPort["save"]>(async () => {}),
  };
}

describe("Player — Filtri base (TSK-037 / US-022)", () => {
  it("default: filter=nearest → image-rendering:pixelated nel CSS scoped, NESSUN overlay", () => {
    const { container } = render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
      />,
    );
    const screenDiv = screen.getByLabelText("Schermo di gioco") as HTMLDivElement;
    expect(screenDiv.getAttribute("data-filter")).toBe("nearest");

    const css = Array.from(container.querySelectorAll("style"))
      .map((s) => s.textContent ?? "")
      .join("\n");
    expect(css).toMatch(/image-rendering:\s*pixelated/);

    expect(screen.queryByTestId("scanline-overlay")).not.toBeInTheDocument();
  });

  it("filter=smoothing → image-rendering:auto e nessun overlay", () => {
    const { container } = render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
        videoSettings={{ scale: "auto", aspect: "original", filter: "smoothing" }}
      />,
    );
    const screenDiv = screen.getByLabelText("Schermo di gioco") as HTMLDivElement;
    expect(screenDiv.getAttribute("data-filter")).toBe("smoothing");

    const css = Array.from(container.querySelectorAll("style"))
      .map((s) => s.textContent ?? "")
      .join("\n");
    expect(css).toMatch(/image-rendering:\s*auto/);
    // L'overlay è esclusivo di scanline.
    expect(screen.queryByTestId("scanline-overlay")).not.toBeInTheDocument();
  });

  it("filter=scanline → image-rendering:pixelated + overlay scanline reso dentro .sb-screen", () => {
    const { container } = render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
        videoSettings={{ scale: "auto", aspect: "original", filter: "scanline" }}
      />,
    );
    const screenDiv = screen.getByLabelText("Schermo di gioco") as HTMLDivElement;
    expect(screenDiv.getAttribute("data-filter")).toBe("scanline");

    const css = Array.from(container.querySelectorAll("style"))
      .map((s) => s.textContent ?? "")
      .join("\n");
    expect(css).toMatch(/image-rendering:\s*pixelated/);
    // La regola dell'overlay è iniettata nel CSS scoped.
    expect(css).toMatch(/\.sb-scanline/);
    expect(css).toMatch(/repeating-linear-gradient/);
    expect(css).toMatch(/pointer-events:\s*none/);

    // Overlay presente nel DOM, dentro `.sb-screen`, e accessibilmente nascosto.
    const overlay = screen.getByTestId("scanline-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay.getAttribute("aria-hidden")).toBe("true");
    expect(screenDiv.contains(overlay)).toBe(true);
  });

  it("cambio filtro in tempo reale: rerender aggiorna image-rendering e presenza dell'overlay (engine NON coinvolto)", () => {
    const engine = fakeEngine();
    const { container, rerender } = render(
      <Player
        engine={engine}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
        videoSettings={{ scale: "auto", aspect: "original", filter: "nearest" }}
      />,
    );

    // Snapshot iniziale: pixelated, no overlay.
    let css = Array.from(container.querySelectorAll("style"))
      .map((s) => s.textContent ?? "")
      .join("\n");
    expect(css).toMatch(/image-rendering:\s*pixelated/);
    expect(screen.queryByTestId("scanline-overlay")).not.toBeInTheDocument();

    // smoothing → auto, no overlay.
    rerender(
      <Player
        engine={engine}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
        videoSettings={{ scale: "auto", aspect: "original", filter: "smoothing" }}
      />,
    );
    css = Array.from(container.querySelectorAll("style"))
      .map((s) => s.textContent ?? "")
      .join("\n");
    expect(css).toMatch(/image-rendering:\s*auto/);
    expect(screen.queryByTestId("scanline-overlay")).not.toBeInTheDocument();

    // scanline → pixelated + overlay presente.
    rerender(
      <Player
        engine={engine}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
        videoSettings={{ scale: "auto", aspect: "original", filter: "scanline" }}
      />,
    );
    css = Array.from(container.querySelectorAll("style"))
      .map((s) => s.textContent ?? "")
      .join("\n");
    expect(css).toMatch(/image-rendering:\s*pixelated/);
    expect(screen.getByTestId("scanline-overlay")).toBeInTheDocument();

    // Engine-agnostico: nessuna chiamata core invocata per il cambio filtro.
    expect(engine.start).not.toHaveBeenCalled();
    expect(engine.setSpeed).not.toHaveBeenCalled();
    expect(engine.pause).not.toHaveBeenCalled();
    expect(engine.resume).not.toHaveBeenCalled();
  });

  it("backward-compat: valore persistito SENZA `filter` viene completato con il default (nearest)", async () => {
    // Simula una preferenza salvata da una versione precedente (TSK-036), che
    // non conosceva ancora il campo `filter`. Il cast forzato riflette
    // realisticamente il contenuto di IndexedDB di un'installazione esistente.
    const legacy = { scale: 3, aspect: "4:3" } as unknown as VideoSettings;
    const port = makePort(legacy);

    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
        videoConfigPort={port}
      />,
    );
    const screenDiv = screen.getByLabelText("Schermo di gioco") as HTMLDivElement;
    await waitFor(() => {
      expect(screenDiv.getAttribute("data-scale")).toBe("3");
      expect(screenDiv.getAttribute("data-aspect")).toBe("4:3");
      // Il default del nuovo campo è stato applicato → nearest.
      expect(screenDiv.getAttribute("data-filter")).toBe("nearest");
    });
  });
});

describe("useVideoSettings helpers — filtri (TSK-037)", () => {
  it("DEFAULT_VIDEO_SETTINGS espone filter=nearest", () => {
    expect(DEFAULT_VIDEO_SETTINGS.filter).toBe("nearest");
  });

  it("filterToCanvasImageRendering mappa correttamente i tre filtri", () => {
    expect(filterToCanvasImageRendering("nearest")).toBe("pixelated");
    expect(filterToCanvasImageRendering("smoothing")).toBe("auto");
    // scanline usa pixelated come base (l'effetto è l'overlay).
    expect(filterToCanvasImageRendering("scanline")).toBe("pixelated");
  });

  it("filterShowsScanlineOverlay è true SOLO per scanline", () => {
    expect(filterShowsScanlineOverlay("nearest")).toBe(false);
    expect(filterShowsScanlineOverlay("smoothing")).toBe(false);
    expect(filterShowsScanlineOverlay("scanline")).toBe(true);
  });

  it("mergeWithDefaults: valore parziale legacy senza filter riceve il default", () => {
    const legacy = { scale: 2, aspect: "4:3" } as unknown as Partial<VideoSettings>;
    expect(mergeWithDefaults(legacy)).toEqual({
      scale: 2,
      aspect: "4:3",
      filter: "nearest",
    });
  });

  it("mergeWithDefaults: null/undefined ritorna una copia dei default (non lo stesso reference)", () => {
    const fromNull = mergeWithDefaults(null);
    const fromUndef = mergeWithDefaults(undefined);
    expect(fromNull).toEqual(DEFAULT_VIDEO_SETTINGS);
    expect(fromUndef).toEqual(DEFAULT_VIDEO_SETTINGS);
    // Non leak del singleton (mutarlo non corrompe DEFAULT_VIDEO_SETTINGS).
    expect(fromNull).not.toBe(DEFAULT_VIDEO_SETTINGS);
  });

  it("mergeWithDefaults: valori espliciti vincono sul default (no clobber)", () => {
    expect(
      mergeWithDefaults({ scale: 5, aspect: "stretch", filter: "smoothing" }),
    ).toEqual({ scale: 5, aspect: "stretch", filter: "smoothing" });
  });
});
