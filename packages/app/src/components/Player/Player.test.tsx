// TSK-008 — test del Player con engine fake (US-010).
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EmulatorEngine } from "../../core/core-wrapper";
import { Player } from "./Player";

function fakeEngine() {
  return {
    load: vi.fn<EmulatorEngine["load"]>(async () => {}),
    start: vi.fn<EmulatorEngine["start"]>(() => {}),
    setAudio: vi.fn<EmulatorEngine["setAudio"]>(() => {}),
  } satisfies EmulatorEngine;
}

describe("Player", () => {
  it("monta il viewport e all'Avvia carica+avvia il core", async () => {
    const engine = fakeEngine();
    render(<Player engine={engine} rom={{ rom: new Blob(["x"]), core: "mgba" }} title="World 1-1" />);
    expect(screen.getByLabelText("Schermo di gioco")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /avvia/i }));

    // attende il microtask del load async
    await screen.findByText("World 1-1");
    expect(engine.load).toHaveBeenCalledOnce();
    expect(engine.start).toHaveBeenCalledOnce();
  });
});
