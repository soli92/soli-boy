// TSK-036 — Test Settings: scala + aspect ratio (US-021).
// TSK-150 (EP-020) — Select Radix al posto dei <select> nativi.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

describe("Settings — Resa video (TSK-036 / US-021)", () => {
  it("espone i controlli fattore di scala e aspect ratio con default", () => {
    render(
      <Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} />,
    );
    const scaleTrigger = screen.getByLabelText("Fattore di scala");
    const aspectTrigger = screen.getByLabelText("Aspect ratio");
    expect(scaleTrigger).toHaveTextContent("2x");
    expect(aspectTrigger).toHaveTextContent("Originale");

    openSelect("Fattore di scala");
    expect(screen.getByRole("option", { name: "Adatta" })).toBeInTheDocument();
    for (const factor of ["1x", "2x", "3x", "4x", "5x"]) {
      expect(screen.getByRole("option", { name: factor })).toBeInTheDocument();
    }
    fireEvent.keyDown(document.body, { key: "Escape" });

    openSelect("Aspect ratio");
    expect(screen.getByRole("option", { name: "Originale" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "4:3" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Stretch" })).toBeInTheDocument();
  });

  it("modalità controllata: il cambio scala/aspect invoca onVideoSettingsChange", async () => {
    const onChange = vi.fn();
    const current: VideoSettings = {
      scale: "auto",
      aspect: "original",
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

    await pickRadixSelectOption("Fattore di scala", "3x");
    expect(onChange).toHaveBeenLastCalledWith({
      scale: 3,
      aspect: "original",
      filter: "nearest",
    });

    await pickRadixSelectOption("Aspect ratio", "4:3");
    expect(onChange).toHaveBeenLastCalledWith({
      scale: "auto",
      aspect: "4:3",
      filter: "nearest",
    });
  });

  it("auto-gestito con porta: carica al mount e persiste il cambio (US-021 persistenza)", async () => {
    const port = makePort({ scale: 4, aspect: "4:3", filter: "nearest" });

    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        videoConfigPort={port}
      />,
    );

    expect(port.load).toHaveBeenCalledOnce();

    await waitFor(() => {
      expect(screen.getByLabelText("Fattore di scala")).toHaveTextContent("4x");
      expect(screen.getByLabelText("Aspect ratio")).toHaveTextContent("4:3");
    });

    await pickRadixSelectOption("Fattore di scala", "2x");
    expect(port.save).toHaveBeenLastCalledWith({
      scale: 2,
      aspect: "4:3",
      filter: "nearest",
    });

    await pickRadixSelectOption("Aspect ratio", "Stretch");
    expect(port.save).toHaveBeenLastCalledWith({
      scale: 2,
      aspect: "stretch",
      filter: "nearest",
    });
  });

  it("porta che ritorna null al load: resta sui default senza fallire", async () => {
    const port = makePort(null);
    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        videoConfigPort={port}
      />,
    );
    await waitFor(() => expect(port.load).toHaveBeenCalled());
    expect(screen.getByLabelText("Fattore di scala")).toHaveTextContent("2x");
    expect(screen.getByLabelText("Aspect ratio")).toHaveTextContent("Originale");
  });
});
