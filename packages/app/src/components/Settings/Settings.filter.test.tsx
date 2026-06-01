// TSK-037 — Test Settings: select "Filtro" (US-022).
// Verifica:
// - Presenza e accessibilità del select "Filtro" con le tre opzioni.
// - Default = nearest quando non c'è valore persistito né prop controllata.
// - Modalità controllata: cambio del filtro invoca onVideoSettingsChange.
// - Auto-gestito con porta: il valore caricato viene mostrato; il cambio
//   invoca port.save con il nuovo `filter` (e preserva scale/aspect).
// - Backward-compat: porta che ritorna un valore legacy (senza `filter`) →
//   il select mostra il default `nearest`.

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_KEY_PROFILE } from "../../domain/input-mapping";
import type {
  VideoSettings,
  VideoSettingsPort,
} from "../Player/useVideoSettings";
import { Settings } from "./Settings";

function makePort(initial: VideoSettings | null = null): VideoSettingsPort & {
  load: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
} {
  return {
    load: vi.fn<VideoSettingsPort["load"]>(async () => initial),
    save: vi.fn<VideoSettingsPort["save"]>(async () => {}),
  };
}

describe("Settings — Filtro (TSK-037 / US-022)", () => {
  it("espone un select Filtro accessibile con le tre opzioni base", () => {
    render(
      <Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} />,
    );
    // AC US-022 #1: deve essere selezionabile almeno nearest/smoothing/scanline.
    const filterSel = screen.getByLabelText(/filtro video/i) as HTMLSelectElement;
    expect(filterSel).toBeInTheDocument();
    expect(Array.from(filterSel.options).map((o) => o.value)).toEqual([
      "nearest",
      "smoothing",
      "scanline",
    ]);
    // Default: nearest (resa tipica pixel-art).
    expect(filterSel.value).toBe("nearest");
  });

  it("modalità controllata: il cambio filtro invoca onVideoSettingsChange preservando scale/aspect", () => {
    const onChange = vi.fn();
    const current: VideoSettings = {
      scale: 2,
      aspect: "4:3",
      filter: "nearest",
    };
    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        videoSettings={current}
        onVideoSettingsChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/filtro video/i), {
      target: { value: "scanline" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      scale: 2,
      aspect: "4:3",
      filter: "scanline",
    });

    fireEvent.change(screen.getByLabelText(/filtro video/i), {
      target: { value: "smoothing" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      scale: 2,
      aspect: "4:3",
      filter: "smoothing",
    });
  });

  it("auto-gestito con porta: carica il filtro salvato e persiste il cambio (US-022 AC2 persistenza)", async () => {
    const port = makePort({ scale: "auto", aspect: "original", filter: "scanline" });
    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        videoConfigPort={port}
      />,
    );

    expect(port.load).toHaveBeenCalledOnce();
    await waitFor(() => {
      const sel = screen.getByLabelText(/filtro video/i) as HTMLSelectElement;
      expect(sel.value).toBe("scanline");
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/filtro video/i), {
        target: { value: "smoothing" },
      });
    });
    expect(port.save).toHaveBeenLastCalledWith({
      scale: "auto",
      aspect: "original",
      filter: "smoothing",
    });
  });

  it("backward-compat: valore persistito legacy (senza filter) → il select mostra il default nearest", async () => {
    const legacy = { scale: 3, aspect: "4:3" } as unknown as VideoSettings;
    const port = makePort(legacy);
    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        videoConfigPort={port}
      />,
    );

    await waitFor(() => {
      const sel = screen.getByLabelText(/filtro video/i) as HTMLSelectElement;
      // Il default è stato applicato dal merge in `useVideoSettings`.
      expect(sel.value).toBe("nearest");
      // scale/aspect dal valore legacy sono preservati.
      const scaleSel = screen.getByLabelText("Fattore di scala") as HTMLSelectElement;
      const aspectSel = screen.getByLabelText("Aspect ratio") as HTMLSelectElement;
      expect(scaleSel.value).toBe("3");
      expect(aspectSel.value).toBe("4:3");
    });
  });
});
