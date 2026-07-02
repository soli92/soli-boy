// TSK-037 — Test Settings: select "Filtro" (US-022).
// TSK-150 (EP-020) — Select Radix al posto dei <select> nativi.

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_KEY_PROFILE } from "../../domain/input-mapping";
import type {
  VideoSettings,
  VideoSettingsPort,
} from "../Player/useVideoSettings";
import { Settings } from "./Settings";
import { openRadixSelect, pickRadixSelectOption } from "../../test-radix-select";

function makePort(initial: VideoSettings | null = null): VideoSettingsPort & {
  load: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
} {
  return {
    load: vi.fn<VideoSettingsPort["load"]>(async () => initial),
    save: vi.fn<VideoSettingsPort["save"]>(async () => {}),
  };
}

function openSelect(label: string | RegExp) {
  return openRadixSelect(label);
}

describe("Settings — Filtro (TSK-037 / US-022)", () => {
  it("espone un select Filtro accessibile con le tre opzioni base", () => {
    render(
      <Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} />,
    );
    const filterTrigger = screen.getByLabelText(/filtro video/i);
    expect(filterTrigger).toBeInTheDocument();
    expect(filterTrigger).toHaveTextContent("Nearest");

    openSelect(/filtro video/i);
    expect(screen.getByRole("option", { name: "Nearest" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Smoothing" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Scanline" })).toBeInTheDocument();
  });

  it("modalità controllata: il cambio filtro invoca onVideoSettingsChange preservando scale/aspect", async () => {
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

    await pickRadixSelectOption(/filtro video/i, "Scanline");
    expect(onChange).toHaveBeenLastCalledWith({
      scale: 2,
      aspect: "4:3",
      filter: "scanline",
    });

    await pickRadixSelectOption(/filtro video/i, "Smoothing");
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
      expect(screen.getByLabelText(/filtro video/i)).toHaveTextContent("Scanline");
    });

    await pickRadixSelectOption(/filtro video/i, "Smoothing");
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
      expect(screen.getByLabelText(/filtro video/i)).toHaveTextContent("Nearest");
      expect(screen.getByLabelText("Fattore di scala")).toHaveTextContent("3x");
      expect(screen.getByLabelText("Aspect ratio")).toHaveTextContent("4:3");
    });
  });
});
