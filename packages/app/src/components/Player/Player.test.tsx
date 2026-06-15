// TSK-008 — test del Player con engine fake (US-010).
// TSK-032 — verifica integrazione del pannello "Save state" (US-016) quando
// `saveService` è iniettato dalla composizione.
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EmulatorEngine } from "../../core/core-wrapper";
import type {
  AutosaveSramResult,
  LoadStateResult,
  RestoreSramResult,
} from "../../domain/save-service";
import type { SaveStateRecord } from "../../storage/types";
import { Player, type SramPort } from "./Player";
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
  afterEach(() => vi.restoreAllMocks());

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

  it("TSK-103: HUD mostra `title` + stato italiano e annuncia via aria-live (UX-018)", async () => {
    const engine = fakeEngine();
    render(
      <Player
        engine={engine}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Pokemon Red"
      />,
    );
    const hud = screen.getByRole("status", { name: /stato giocatore/i });
    expect(hud).toHaveAttribute("aria-live", "polite");
    expect(hud).toHaveAttribute("aria-atomic", "true");
    // Idle: HUD mostra title + "Premi Avvia"
    expect(hud).toHaveTextContent("Pokemon Red");
    expect(hud).toHaveTextContent("Premi Avvia");

    // Avvia → running → HUD: title + "In esecuzione"
    fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    await screen.findByRole("button", { name: /pausa/i });
    expect(hud).toHaveTextContent("Pokemon Red");
    expect(hud).toHaveTextContent("In esecuzione");

    // Pausa → paused → HUD: title + "In pausa" + overlay icona pausa
    fireEvent.click(screen.getByRole("button", { name: /pausa/i }));
    await screen.findByTestId("pause-overlay");
    expect(hud).toHaveTextContent("In pausa");
    const overlay = screen.getByTestId("pause-overlay");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
    expect(overlay).toHaveTextContent("⏸");

    // Riprendi → overlay sparisce
    fireEvent.click(screen.getByRole("button", { name: /riprendi/i }));
    await waitFor(() => {
      expect(screen.queryByTestId("pause-overlay")).not.toBeInTheDocument();
    });
  });

  it("TSK-103: senza title prop l'HUD mostra 'Nessun gioco selezionato' (UX-018 AC1)", () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
      />,
    );
    const hud = screen.getByRole("status", { name: /stato giocatore/i });
    expect(hud).toHaveTextContent("Nessun gioco selezionato");
    expect(hud).toHaveTextContent("Premi Avvia");
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

  describe("TSK-100 (US-053) — autoStart prop: avvio automatico ROM dalla Library", () => {
    it("AC2: con autoStart=true e ROM materiale il Player avvia automaticamente (no click 'Avvia')", async () => {
      const engine = fakeEngine();
      render(
        <Player
          engine={engine}
          rom={{ rom: new Blob(["x"]), core: "gambatte" }}
          title="Pokemon Red"
          autoStart={true}
        />,
      );

      // Nessun click su "Avvia": l'effetto useEffect deve invocare handlePlay
      // al mount. Aspettiamo che lo stato diventi running (presenza del bottone
      // "Pausa" implica state === "running").
      await screen.findByRole("button", { name: /pausa/i });
      expect(engine.load).toHaveBeenCalledOnce();
      expect(engine.start).toHaveBeenCalledOnce();
    });

    it("AC default OFF (backward compat): senza autoStart il Player resta idle (richiede click 'Avvia')", async () => {
      const engine = fakeEngine();
      render(
        <Player
          engine={engine}
          rom={{ rom: new Blob(["x"]), core: "gambatte" }}
          title="Tetris"
        />,
      );

      // Nessun click → Player deve restare idle. Aspettiamo un microtick per
      // assicurarci che nessun useEffect autoStart sia scattato.
      await Promise.resolve();
      expect(engine.load).not.toHaveBeenCalled();
      expect(engine.start).not.toHaveBeenCalled();
      // Bottone "Avvia" ancora presente (state === idle).
      expect(screen.getByRole("button", { name: /avvia/i })).toBeInTheDocument();
    });

    it("F-100-01: autoStart=true con ROM placeholder (Blob vuoto) NON avvia (App stato idle senza ROM)", async () => {
      const engine = fakeEngine();
      render(
        <Player
          engine={engine}
          rom={{ rom: new Blob(), core: "gambatte" }}
          autoStart={true}
        />,
      );
      // Blob vuoto = placeholder App.tsx stato idle senza ROM: NON deve avviare.
      await Promise.resolve();
      expect(engine.load).not.toHaveBeenCalled();
      expect(engine.start).not.toHaveBeenCalled();
    });

    it("F-100-02: autoStart=true non rilancia handlePlay su re-render con stessa ROM (no loop)", async () => {
      const engine = fakeEngine();
      const blob = new Blob(["x"]);
      const { rerender } = render(
        <Player
          engine={engine}
          rom={{ rom: blob, core: "gambatte" }}
          title="Tetris"
          autoStart={true}
        />,
      );
      await screen.findByRole("button", { name: /pausa/i });
      expect(engine.load).toHaveBeenCalledOnce();
      expect(engine.start).toHaveBeenCalledOnce();

      // Re-render con la STESSA identità di Blob: il ref interno
      // `autoStartedForRomRef` deve fare guard → handlePlay NON ri-eseguito.
      // Cambiamo solo una prop ininfluente (title) per forzare il re-render.
      rerender(
        <Player
          engine={engine}
          rom={{ rom: blob, core: "gambatte" }}
          title="Tetris (revised)"
          autoStart={true}
        />,
      );
      await Promise.resolve();
      expect(engine.load).toHaveBeenCalledOnce();
      expect(engine.start).toHaveBeenCalledOnce();
    });

    it("AC4: errore di load con autoStart=true è gestito come esistente (alert area, no crash)", async () => {
      const engine = {
        ...fakeEngine(),
        load: vi.fn<EmulatorEngine["load"]>(async () => {
          throw new Error("ROM non valida");
        }),
      } satisfies EmulatorEngine;

      render(
        <Player
          engine={engine}
          rom={{ rom: new Blob(["x"]), core: "gambatte" }}
          title="Broken ROM"
          autoStart={true}
        />,
      );

      // L'errore di load viene catturato da handlePlay (catch block esistente)
      // e mostrato come alert. Stesso path del click manuale.
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("ROM non valida");
      // Il Player resta in stato idle (bottone "Avvia" ancora visibile).
      expect(screen.getByRole("button", { name: /avvia/i })).toBeInTheDocument();
      expect(engine.start).not.toHaveBeenCalled();
    });
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

  it(
    "TSK-092: restoreSram best-effort — un reject NON imposta `error` né interrompe l'avvio (US-050)",
    async () => {
      // Scenario "ROM caricata, SRAM assente": restoreSram rigetta (es. IDB
      // transitorio o SRAM non trovata). Il Player deve comunque arrivare a
      // `state === "running"`, senza mostrare l'area errore "ROM non trovata"
      // (messaggio che appartiene SOLO a wrapper.load()). Verificato anche il
      // log via console.warn (non console.error, vedi AC2 del TSK).
      const saveService: SaveServicePort & Partial<SramPort> = {
        saveState: vi.fn(async () => "id"),
        loadState: vi.fn(async (): Promise<LoadStateResult> => ({ ok: true })),
        listSaveStates: vi.fn(async (): Promise<SaveStateRecord[]> => []),
        deleteSaveState: vi.fn(async () => {}),
        // restoreSram rigetta con errore "SRAM assente / IDB transitorio".
        restoreSram: vi.fn(
          async (): Promise<RestoreSramResult> => {
            throw new Error("SRAM non disponibile (rom-not-found)");
          },
        ),
        autosaveSram: vi.fn(
          async (): Promise<AutosaveSramResult> => ({
            ok: true,
            persisted: false,
          }),
        ),
      };
      const engine = fakeEngine();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      render(
        <Player
          engine={engine}
          rom={{ rom: new Blob(["x"]), core: "gambatte" }}
          title="Tetris"
          saveService={saveService}
          romId="rom-missing-sram"
          currentCore="gambatte"
        />,
      );

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
      });

      // AC4: arriva a state === "running" — il pulsante "Pausa" è reso solo
      // in `running`, quindi la sua presenza prova lo stato.
      await screen.findByRole("button", { name: /pausa/i });
      expect(engine.start).toHaveBeenCalledOnce();

      // AC3: NESSUN messaggio di errore user-visible (alert role) — il
      // reject di restoreSram NON deve far comparire l'area `.sb-note[role=alert]`.
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      // AC2: il reject è loggato come `console.warn` (non console.error).
      expect(warnSpy).toHaveBeenCalled();
      expect(
        warnSpy.mock.calls.some((args) => String(args[0]).match(/restoreSram/i)),
      ).toBe(true);

      // restoreSram è stato comunque tentato (best-effort, ma invocato).
      expect(saveService.restoreSram).toHaveBeenCalledWith(
        engine,
        "rom-missing-sram",
      );
    },
  );

  describe("TSK-106 — layout slot fissi controlli Player (US-055 UX-020)", () => {
    it("AC1: container controlli usa CSS Grid con 3 slot fissi (primary | secondary | fullscreen)", () => {
      render(
        <Player
          engine={fakeEngine()}
          rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        />,
      );
      const controls = screen.getByTestId("player-controls");
      expect(controls).toBeInTheDocument();
      expect(controls).toHaveClass("sb-player-controls");
      const slots = controls.querySelectorAll<HTMLElement>(":scope > [data-slot]");
      expect(slots).toHaveLength(3);
      expect(slots[0]?.dataset.slot).toBe("primary");
      expect(slots[1]?.dataset.slot).toBe("secondary");
      expect(slots[2]?.dataset.slot).toBe("fullscreen");
    });

    it("AC2: il bottone primario (data-slot=primary) è SEMPRE nello stesso slot in tutti i 3 stati (idle/running/paused)", async () => {
      const engine = fakeEngine();
      render(
        <Player
          engine={engine}
          rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        />,
      );
      const controls = screen.getByTestId("player-controls");
      const primarySlot = controls.querySelector<HTMLElement>(
        '[data-slot="primary"]',
      );
      expect(primarySlot).not.toBeNull();

      const playBtn = primarySlot!.querySelector<HTMLButtonElement>(
        'button[data-action="play"]',
      );
      expect(playBtn).not.toBeNull();
      expect(playBtn).toHaveTextContent(/avvia/i);

      fireEvent.click(playBtn!);
      await screen.findByRole("button", { name: /pausa/i });
      const pauseBtn = primarySlot!.querySelector<HTMLButtonElement>(
        'button[data-action="pause"]',
      );
      expect(pauseBtn).not.toBeNull();
      expect(pauseBtn).toHaveTextContent(/pausa/i);

      fireEvent.click(pauseBtn!);
      await screen.findByRole("button", { name: /riprendi/i });
      const resumeBtn = primarySlot!.querySelector<HTMLButtonElement>(
        'button[data-action="resume"]',
      );
      expect(resumeBtn).not.toBeNull();
      expect(resumeBtn).toHaveTextContent(/riprendi/i);
    });

    it("AC3: in idle lo slot secondary contiene un placeholder con visibility:hidden + aria-hidden (NON display:none)", () => {
      render(
        <Player
          engine={fakeEngine()}
          rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        />,
      );
      const controls = screen.getByTestId("player-controls");
      const secondarySlot = controls.querySelector<HTMLElement>(
        '[data-slot="secondary"]',
      );
      expect(secondarySlot).not.toBeNull();

      const placeholder = secondarySlot!.querySelector<HTMLButtonElement>(
        "button[data-slot-placeholder]",
      );
      expect(placeholder).not.toBeNull();
      expect(placeholder).toHaveAttribute("aria-hidden", "true");
      expect(placeholder).toHaveAttribute("tabindex", "-1");
      expect(placeholder).toBeDisabled();
      expect(placeholder).toHaveAttribute("data-slot-placeholder", "true");
      expect(placeholder?.getAttribute("style") ?? "").not.toMatch(/display\s*:\s*none/);
    });

    it("AC3 bis: in running/paused lo slot secondary contiene il bottone Arresta REALE (no placeholder)", async () => {
      const engine = fakeEngine();
      render(
        <Player
          engine={engine}
          rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        />,
      );
      const controls = screen.getByTestId("player-controls");
      const secondarySlot = controls.querySelector<HTMLElement>(
        '[data-slot="secondary"]',
      );

      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
      await screen.findByRole("button", { name: /pausa/i });
      let stopBtn = secondarySlot!.querySelector<HTMLButtonElement>(
        'button[data-action="stop"]',
      );
      expect(stopBtn).not.toBeNull();
      expect(stopBtn).not.toHaveAttribute("data-slot-placeholder");
      expect(stopBtn).not.toBeDisabled();

      fireEvent.click(screen.getByRole("button", { name: /pausa/i }));
      await screen.findByRole("button", { name: /riprendi/i });
      stopBtn = secondarySlot!.querySelector<HTMLButtonElement>(
        'button[data-action="stop"]',
      );
      expect(stopBtn).not.toBeNull();
      expect(stopBtn).not.toHaveAttribute("data-slot-placeholder");
    });

    it("AC2 (a11y): lo slot fullscreen è SEMPRE presente come terzo slot in tutti i 3 stati", async () => {
      const engine = fakeEngine();
      render(
        <Player
          engine={engine}
          rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        />,
      );
      const controls = screen.getByTestId("player-controls");

      const fsInState = () =>
        controls.querySelector<HTMLElement>(
          '[data-slot="fullscreen"] button[data-action="fullscreen"]',
        );

      expect(fsInState()).not.toBeNull();

      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
      await screen.findByRole("button", { name: /pausa/i });
      expect(fsInState()).not.toBeNull();

      fireEvent.click(screen.getByRole("button", { name: /pausa/i }));
      await screen.findByRole("button", { name: /riprendi/i });
      expect(fsInState()).not.toBeNull();
    });

    it("AC4 (regressione visiva DOM): l'ordine dei direct-children di .sb-player-controls è invariato tra idle/running/paused", async () => {
      const engine = fakeEngine();
      render(
        <Player
          engine={engine}
          rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        />,
      );
      const controls = screen.getByTestId("player-controls");
      const slotOrder = () =>
        Array.from(controls.querySelectorAll<HTMLElement>(":scope > [data-slot]")).map(
          (s) => s.dataset.slot,
        );

      const expected = ["primary", "secondary", "fullscreen"];

      expect(slotOrder()).toEqual(expected);

      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
      await screen.findByRole("button", { name: /pausa/i });
      expect(slotOrder()).toEqual(expected);

      fireEvent.click(screen.getByRole("button", { name: /pausa/i }));
      await screen.findByRole("button", { name: /riprendi/i });
      expect(slotOrder()).toEqual(expected);
    });
  });
});
