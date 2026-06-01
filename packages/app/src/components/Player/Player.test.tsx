// TSK-008 — test del Player con engine fake (US-010).
// TSK-032 — verifica integrazione del pannello "Save state" (US-016) quando
// `saveService` è iniettato dalla composizione.
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EmulatorEngine } from "../../core/core-wrapper";
import type { LoadStateResult } from "../../domain/save-service";
import type { SaveStateRecord } from "../../storage/types";
import { Player } from "./Player";
import type { SaveServicePort } from "./SaveStatePanel";

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

  it("TSK-032: senza saveService il pannello save state NON è reso (backward compat)", () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
      />,
    );
    expect(
      screen.queryByRole("region", { name: /save state/i }),
    ).not.toBeInTheDocument();
  });

  it("TSK-032: con saveService il pannello è reso, e si abilita quando il gioco è in esecuzione (US-016 AC1)", async () => {
    const saveService: SaveServicePort = {
      saveState: vi.fn(async (_e, romId: string, slot: number) => `${romId}:${slot}:0:id`),
      loadState: vi.fn(async (): Promise<LoadStateResult> => ({ ok: true })),
      listSaveStates: vi.fn(async (): Promise<SaveStateRecord[]> => []),
      deleteSaveState: vi.fn(async () => {}),
    };
    const engine = {
      ...fakeEngine(),
      // Override capability: l'engine corrente supporta i save state.
      capabilities: { rewind: false, saveStates: true, sram: false },
    } satisfies EmulatorEngine;

    render(
      <Player
        engine={engine}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Tetris"
        saveService={saveService}
        romId="rom-1"
        currentCore="gambatte"
      />,
    );
    const region = screen.getByRole("region", { name: /save state/i });
    expect(region).toBeInTheDocument();
    // Idle: pannello disabilitato (US-016 AC1).
    expect(screen.getByRole("button", { name: /salva nello slot 1/i })).toBeDisabled();

    // Avvia il gioco → running → il pannello si abilita.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /salva nello slot 1/i })).toBeEnabled();
    });

    // Click Salva: chiama saveService.saveState(engine, romId, slot=0).
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /salva nello slot 1/i }));
    });
    expect(saveService.saveState).toHaveBeenCalledWith(engine, "rom-1", 0);
  });
});
