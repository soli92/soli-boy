// TSK-036 — Test Settings: scala + aspect ratio (US-021).
// Verifica:
// - Esposizione dei controlli (scala + aspect) come elementi accessibili.
// - Cambio scala/aspect invoca onVideoSettingsChange in modalità controllata.
// - In modalità auto-gestita (con `videoConfigPort`), il valore caricato dalla
//   porta è riapplicato al mount; il cambio invoca `port.save(next)`.

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

describe("Settings — Resa video (TSK-036 / US-021)", () => {
  it("espone i controlli fattore di scala e aspect ratio con default", () => {
    render(
      <Settings profile={DEFAULT_KEY_PROFILE} onRemap={vi.fn()} />,
    );
    const scaleSel = screen.getByLabelText("Fattore di scala") as HTMLSelectElement;
    const aspectSel = screen.getByLabelText("Aspect ratio") as HTMLSelectElement;
    // Default: scale=auto, aspect=original.
    expect(scaleSel.value).toBe("auto");
    expect(aspectSel.value).toBe("original");
    // Le opzioni includono i fattori 1x..5x e gli aspect richiesti.
    expect(
      Array.from(scaleSel.options).map((o) => o.value),
    ).toEqual(["auto", "1", "2", "3", "4", "5"]);
    expect(
      Array.from(aspectSel.options).map((o) => o.value),
    ).toEqual(["original", "4:3", "stretch"]);
  });

  it("modalità controllata: il cambio scala/aspect invoca onVideoSettingsChange", () => {
    const onChange = vi.fn();
    const current: VideoSettings = { scale: "auto", aspect: "original" };
    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        videoSettings={current}
        onVideoSettingsChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Fattore di scala"), {
      target: { value: "3" },
    });
    expect(onChange).toHaveBeenLastCalledWith({ scale: 3, aspect: "original" });

    fireEvent.change(screen.getByLabelText("Aspect ratio"), {
      target: { value: "4:3" },
    });
    expect(onChange).toHaveBeenLastCalledWith({ scale: "auto", aspect: "4:3" });
  });

  it("auto-gestito con porta: carica al mount e persiste il cambio (US-021 persistenza)", async () => {
    const port = makePort({ scale: 4, aspect: "4:3" });

    render(
      <Settings
        profile={DEFAULT_KEY_PROFILE}
        onRemap={vi.fn()}
        videoConfigPort={port}
      />,
    );

    // load invocata al mount.
    expect(port.load).toHaveBeenCalledOnce();

    // Attendiamo l'hydration: i select riflettono i valori salvati.
    await waitFor(() => {
      const scale = screen.getByLabelText("Fattore di scala") as HTMLSelectElement;
      const aspect = screen.getByLabelText("Aspect ratio") as HTMLSelectElement;
      expect(scale.value).toBe("4");
      expect(aspect.value).toBe("4:3");
    });

    // Modifica → save invocata con il nuovo valore.
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Fattore di scala"), {
        target: { value: "2" },
      });
    });
    expect(port.save).toHaveBeenLastCalledWith({ scale: 2, aspect: "4:3" });

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Aspect ratio"), {
        target: { value: "stretch" },
      });
    });
    expect(port.save).toHaveBeenLastCalledWith({ scale: 2, aspect: "stretch" });
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
    const scale = screen.getByLabelText("Fattore di scala") as HTMLSelectElement;
    const aspect = screen.getByLabelText("Aspect ratio") as HTMLSelectElement;
    expect(scale.value).toBe("auto");
    expect(aspect.value).toBe("original");
  });
});
