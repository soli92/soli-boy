// TSK-008 — test del Player con engine fake (US-010).
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EmulatorEngine } from "../../core/core-wrapper";
import { Player } from "./Player";

function fakeEngine() {
  return {
    load: vi.fn<EmulatorEngine["load"]>(async () => {}),
    start: vi.fn<EmulatorEngine["start"]>(() => {}),
    pause: vi.fn<EmulatorEngine["pause"]>(() => {}),
    resume: vi.fn<EmulatorEngine["resume"]>(() => {}),
    stop: vi.fn<EmulatorEngine["stop"]>(() => {}),
    setAudio: vi.fn<EmulatorEngine["setAudio"]>(() => {}),
    sendInput: vi.fn<EmulatorEngine["sendInput"]>(() => {}),
    setSpeed: vi.fn<EmulatorEngine["setSpeed"]>(() => {}),
    // TSK-030: no-op per soddisfare il contratto esteso (UI Player non li chiama ancora).
    snapshot: vi.fn<EmulatorEngine["snapshot"]>(async () => new Uint8Array()),
    restore: vi.fn<EmulatorEngine["restore"]>(async () => {}),
    getSram: vi.fn<EmulatorEngine["getSram"]>(async () => null),
    loadSram: vi.fn<EmulatorEngine["loadSram"]>(async () => {}),
    capabilities: { rewind: false, saveStates: false, sram: false },
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

  it("TSK-014: controlli pausa → riprendi → arresta (US-011)", async () => {
    const engine = fakeEngine();
    render(<Player engine={engine} rom={{ rom: new Blob(["x"]), core: "gambatte" }} />);
    fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    await screen.findByRole("button", { name: /pausa/i });

    fireEvent.click(screen.getByRole("button", { name: /pausa/i }));
    expect(engine.pause).toHaveBeenCalledOnce();
    await screen.findByText("In pausa");

    fireEvent.click(screen.getByRole("button", { name: /riprendi/i }));
    expect(engine.resume).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: /arresta/i }));
    expect(engine.stop).toHaveBeenCalledOnce();
    await screen.findByText("Premi Avvia");
  });
});
