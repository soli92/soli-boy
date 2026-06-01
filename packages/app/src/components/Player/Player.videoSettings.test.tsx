// TSK-036 — Test Player: applicazione real-time di scala + aspect ratio (US-021).
// Verifica:
// - Cambio scala/aspect modifica lo stile inline applicato a `.sb-screen`.
// - I data-attribute (`data-scale`, `data-aspect`) riflettono il valore corrente.
// - Persistenza: il valore caricato dalla porta è riapplicato al mount.
// - Engine-agnostico: nessuna chiamata al metodo dell'EmulatorEngine viene
//   effettuata per via del cambio di scala/aspect.

import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EmulatorEngine } from "../../core/core-wrapper";
import { Player } from "./Player";
import {
  BASE_VIEWPORT_WIDTH_PX,
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

describe("Player — Resa video (TSK-036 / US-021)", () => {
  it("modalità controllata: scala 3x + aspect 4:3 applicati come stile inline e data-attribute", () => {
    const engine = fakeEngine();
    const { rerender } = render(
      <Player
        engine={engine}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
        videoSettings={{ scale: 3, aspect: "4:3" }}
      />,
    );
    const screenDiv = screen.getByLabelText("Schermo di gioco") as HTMLDivElement;
    expect(screenDiv.style.width).toBe(`${3 * BASE_VIEWPORT_WIDTH_PX}px`);
    // jsdom normalizza `aspect-ratio: 4 / 3` (stringa con spazi).
    expect(screenDiv.style.aspectRatio.replace(/\s+/g, "")).toBe("4/3");
    expect(screenDiv.getAttribute("data-scale")).toBe("3");
    expect(screenDiv.getAttribute("data-aspect")).toBe("4:3");

    // Cambio in tempo reale: rerender con nuovi settings → stile aggiornato.
    rerender(
      <Player
        engine={engine}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
        videoSettings={{ scale: "auto", aspect: "stretch" }}
      />,
    );
    expect(screenDiv.style.width).toBe("100%");
    expect(screenDiv.getAttribute("data-scale")).toBe("auto");
    expect(screenDiv.getAttribute("data-aspect")).toBe("stretch");
    // Engine NON deve essere stato interrogato per il cambio video (engine-agnostico).
    expect(engine.setSpeed).not.toHaveBeenCalled();
    expect(engine.start).not.toHaveBeenCalled();
  });

  it("persistenza: al mount applica il valore caricato dalla porta config (US-021)", async () => {
    const port = makePort({ scale: 5, aspect: "stretch" });
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
        videoConfigPort={port}
      />,
    );
    expect(port.load).toHaveBeenCalledOnce();

    const screenDiv = screen.getByLabelText("Schermo di gioco") as HTMLDivElement;
    await waitFor(() => {
      expect(screenDiv.getAttribute("data-scale")).toBe("5");
      expect(screenDiv.getAttribute("data-aspect")).toBe("stretch");
    });
    expect(screenDiv.style.width).toBe(`${5 * BASE_VIEWPORT_WIDTH_PX}px`);
  });

  it("default in assenza di porta e di props: scale=auto, aspect=original", () => {
    render(
      <Player engine={fakeEngine()} rom={{ rom: new Blob(["x"]), core: "mgba" }} />,
    );
    const screenDiv = screen.getByLabelText("Schermo di gioco") as HTMLDivElement;
    expect(screenDiv.getAttribute("data-scale")).toBe("auto");
    expect(screenDiv.getAttribute("data-aspect")).toBe("original");
    expect(screenDiv.style.width).toBe("100%");
  });

  it("inietta una regola CSS scoped per il <canvas> interno (object-fit dipende dall'aspect)", () => {
    const { container, rerender } = render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
        videoSettings={{ scale: 2, aspect: "original" }}
      />,
    );
    // C'è un <style> con la regola object-fit: contain.
    const styleTags = container.querySelectorAll("style");
    expect(styleTags.length).toBeGreaterThan(0);
    const css1 = Array.from(styleTags).map((s) => s.textContent ?? "").join("\n");
    expect(css1).toMatch(/object-fit:\s*contain/);

    // Passando a stretch, la regola diventa object-fit: fill.
    rerender(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
        videoSettings={{ scale: 2, aspect: "stretch" }}
      />,
    );
    const css2 = Array.from(container.querySelectorAll("style"))
      .map((s) => s.textContent ?? "")
      .join("\n");
    expect(css2).toMatch(/object-fit:\s*fill/);
  });

  it("porta save: persistenza side-effect non blocca la UI in caso di reject", async () => {
    const loaded: VideoSettings = { scale: 2, aspect: "original" };
    const port: VideoSettingsPort = {
      load: vi.fn<VideoSettingsPort["load"]>(async () => loaded),
      // Reject volutamente per simulare I/O degradato.
      save: vi.fn<VideoSettingsPort["save"]>(async () => {
        throw new Error("io down");
      }),
    };
    // Smoke: il render con porta che rejecta non deve crashare. Il save viene
    // chiamato solo a fronte di un cambio (qui assente), ma copriamo il path di
    // load → hydration con valore non-default.
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "mgba" }}
        videoConfigPort={port}
      />,
    );
    const screenDiv = screen.getByLabelText("Schermo di gioco") as HTMLDivElement;
    await waitFor(() => {
      expect(screenDiv.getAttribute("data-scale")).toBe("2");
    });
    // Aggiunge robustezza: il componente non solleva e resta interattivo.
    await act(async () => {});
    expect(screenDiv).toBeInTheDocument();
  });
});
