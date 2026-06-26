// TSK-032 — test del pannello Save state (US-016 / US-018, ADR-006 §Decisione p.4).
// Copre:
// - Salva su slot chiama SaveService.saveState(engine, romId, slot).
// - Lista mostra SOLO i save state della ROM corrente (US-018 AC2).
// - Carica chiama SaveService.loadState(engine, id, currentCore).
// - Gestione `engine-mismatch` (ADR-006 §Conseguenze): messaggio chiaro, no crash.
// - Pannello disabilitato se non c'è romId (US-018: senza ROM non si salva).
// - Pannello disabilitato se isRunning=false (US-016 AC1: "durante l'esecuzione").
// - Pannello disabilitato + nota onesta se capabilities.saveStates=false.
// - Refresh della lista dopo Salva / Carica / Elimina.

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EmulatorEngine } from "../../core/core-wrapper";
import type { LoadStateResult } from "../../domain/save-service";
import type { SaveStateRecord } from "../../storage/types";
import { SaveStatePanel, type SaveServicePort } from "./SaveStatePanel";

function fakeEngine(opts: { saveStates?: boolean } = {}): EmulatorEngine {
  const saveStates = opts.saveStates ?? true;
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
    capabilities: { rewind: false, saveStates, sram: false },
  } satisfies EmulatorEngine;
}

function makeSave(romId: string, slot: number, id?: string): SaveStateRecord {
  return {
    id: id ?? `${romId}:${slot}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    romId,
    slot,
    snapshotBlob: new Blob(["snap"]),
    core: "gambatte",
    createdAt: Date.now(),
  };
}

/**
 * Factory di un fake `SaveServicePort` con storage interno in-memory. Riproduce
 * il contratto richiesto (TSK-031 sottoinsieme) senza dipendere dal SaveService
 * reale: si possono iniettare comportamenti specifici (es. `loadResult`) per
 * stressare i rami `engine-mismatch` / `not-found`.
 */
function makeService(
  initial: SaveStateRecord[] = [],
  opts: { loadResult?: LoadStateResult } = {},
): SaveServicePort & {
  saveState: ReturnType<typeof vi.fn>;
  loadState: ReturnType<typeof vi.fn>;
  listSaveStates: ReturnType<typeof vi.fn>;
  deleteSaveState: ReturnType<typeof vi.fn>;
  _store: SaveStateRecord[];
} {
  const store: SaveStateRecord[] = [...initial];
  const svc = {
    _store: store,
    saveState: vi.fn(async (_engine, romId: string, slot: number) => {
      const rec = makeSave(romId, slot);
      store.push(rec);
      return rec.id;
    }),
    loadState: vi.fn(async (): Promise<LoadStateResult> => {
      return opts.loadResult ?? { ok: true };
    }),
    listSaveStates: vi.fn(async (romId: string) => {
      // Mimo il contratto reale: già filtra per romId (TSK-031).
      return store.filter((r) => r.romId === romId).sort((a, b) => a.slot - b.slot);
    }),
    deleteSaveState: vi.fn(async (id: string) => {
      const idx = store.findIndex((r) => r.id === id);
      if (idx >= 0) store.splice(idx, 1);
    }),
  };
  return svc as ReturnType<typeof makeService>;
}

describe("SaveStatePanel — US-016 / US-018", () => {
  it("rende una region etichettata 'Save state' (a11y)", async () => {
    const svc = makeService();
    render(
      <SaveStatePanel
        engine={fakeEngine()}
        saveService={svc}
        romId="rom-1"
        currentCore="gambatte"
        isRunning
      />,
    );
    expect(screen.getByRole("region", { name: /save state/i })).toBeInTheDocument();
    // Attendi la settle del primo refresh asincrono (useEffect) per evitare
    // warning act() spuri al teardown.
    await waitFor(() => expect(svc.listSaveStates).toHaveBeenCalled());
  });

  it("Salva su slot chiama saveService.saveState(engine, romId, slot) e aggiorna la lista", async () => {
    const engine = fakeEngine();
    const svc = makeService();
    render(
      <SaveStatePanel
        engine={engine}
        saveService={svc}
        romId="rom-1"
        currentCore="gambatte"
        isRunning
      />,
    );
    // Lista vuota all'inizio.
    await waitFor(() => expect(svc.listSaveStates).toHaveBeenCalledWith("rom-1"));

    const saveBtn = screen.getByRole("button", { name: /salva nello slot 1/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(svc.saveState).toHaveBeenCalledWith(engine, "rom-1", 0);
    // Dopo il save la lista è ri-letta (refresh).
    await waitFor(() => {
      expect(svc.listSaveStates).toHaveBeenCalledTimes(2);
    });
    // Lo slot 1 mostra ora un timestamp (non 'vuoto').
    await waitFor(() => {
      expect(screen.getByTestId("sb-savestate-meta-0").textContent).not.toMatch(
        /vuoto/i,
      );
    });
  });

  it("US-018 AC2: lista mostra SOLO i save della ROM corrente", async () => {
    const svc = makeService([
      makeSave("rom-1", 0, "ss-A"),
      makeSave("rom-2", 0, "ss-B"), // altra ROM → non deve apparire
      makeSave("rom-1", 1, "ss-C"),
    ]);
    render(
      <SaveStatePanel
        engine={fakeEngine()}
        saveService={svc}
        romId="rom-1"
        currentCore="gambatte"
        isRunning
      />,
    );
    // Aspettiamo l'idratazione iniziale.
    await waitFor(() => {
      expect(screen.getByTestId("sb-savestate-meta-0").textContent).not.toMatch(
        /vuoto/i,
      );
      expect(screen.getByTestId("sb-savestate-meta-1").textContent).not.toMatch(
        /vuoto/i,
      );
    });
    // Slot 2 (index 2) non c'è in rom-1 → 'vuoto' (l'eventuale rom-2:slot0 NON deve mostrarsi).
    expect(screen.getByTestId("sb-savestate-meta-2").textContent).toMatch(/vuoto/i);

    // Carica e Elimina di rom-2 non sono accessibili (mai resi: gli slot vuoti
    // hanno i bottoni disabilitati).
    expect(screen.getByTestId("sb-savestate-load-2")).toBeDisabled();
    expect(screen.getByTestId("sb-savestate-delete-2")).toBeDisabled();
  });

  it("Carica chiama saveService.loadState(engine, id, currentCore)", async () => {
    const engine = fakeEngine();
    const existing = makeSave("rom-1", 0, "ss-load");
    const svc = makeService([existing]);
    render(
      <SaveStatePanel
        engine={engine}
        saveService={svc}
        romId="rom-1"
        currentCore="gambatte"
        isRunning
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("sb-savestate-meta-0").textContent).not.toMatch(
        /vuoto/i,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /carica slot 1/i }));
    });

    expect(svc.loadState).toHaveBeenCalledWith(engine, "ss-load", "gambatte");
    await waitFor(() => {
      expect(screen.getByTestId("sb-savestate-message").textContent).toMatch(
        /caricato slot 1/i,
      );
    });
  });

  it("Gestione engine-mismatch (ADR-006): messaggio chiaro, no crash", async () => {
    const existing = makeSave("rom-1", 0, "ss-x");
    const svc = makeService([existing], {
      loadResult: {
        ok: false,
        reason: "engine-mismatch",
        detail: 'Save state prodotto da core "gambatte", engine corrente "mgba".',
      },
    });
    render(
      <SaveStatePanel
        engine={fakeEngine()}
        saveService={svc}
        romId="rom-1"
        currentCore="mgba"
        isRunning
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("sb-savestate-meta-0").textContent).not.toMatch(
        /vuoto/i,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /carica slot 1/i }));
    });

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/gambatte/);
    expect(alert.textContent).toMatch(/mgba/);
    // Region resta nel DOM (no crash).
    expect(screen.getByRole("region", { name: /save state/i })).toBeInTheDocument();
  });

  it("Elimina rimuove l'entry e ri-legge la lista", async () => {
    const existing = makeSave("rom-1", 0, "ss-del");
    const svc = makeService([existing]);
    render(
      <SaveStatePanel
        engine={fakeEngine()}
        saveService={svc}
        romId="rom-1"
        currentCore="gambatte"
        isRunning
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("sb-savestate-meta-0").textContent).not.toMatch(
        /vuoto/i,
      );
    });

    // TSK-111: click Elimina apre il dialog di conferma (non elimina direttamente).
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /elimina slot 1/i }));
    });

    // Confirma il dialog — il bottone "Elimina" nel dialog ha data-testid specifico.
    await act(async () => {
      fireEvent.click(screen.getByTestId("sb-savestate-delete-dialog-confirm"));
    });

    expect(svc.deleteSaveState).toHaveBeenCalledWith("ss-del");
    await waitFor(() => {
      expect(screen.getByTestId("sb-savestate-meta-0").textContent).toMatch(/vuoto/i);
    });
  });

  it("pannello disabilitato senza romId (US-018: salvataggi associati al gioco)", async () => {
    const svc = makeService();
    render(
      <SaveStatePanel
        engine={fakeEngine()}
        saveService={svc}
        romId={undefined}
        currentCore="gambatte"
        isRunning
      />,
    );
    expect(screen.getByTestId("sb-savestate-disabled-note").textContent).toMatch(
      /nessuna rom/i,
    );
    // Tutti i bottoni di salvataggio sono disabilitati.
    expect(screen.getByTestId("sb-savestate-save-0")).toBeDisabled();
    expect(screen.getByTestId("sb-savestate-save-1")).toBeDisabled();
    // Senza romId, nessun fetch della lista deve essere stato fatto.
    expect(svc.listSaveStates).not.toHaveBeenCalled();
  });

  it("pannello disabilitato se non running (US-016 AC1: 'durante l'esecuzione')", async () => {
    const svc = makeService();
    render(
      <SaveStatePanel
        engine={fakeEngine()}
        saveService={svc}
        romId="rom-1"
        currentCore="gambatte"
        isRunning={false}
      />,
    );
    expect(screen.getByTestId("sb-savestate-disabled-note").textContent).toMatch(
      /avvia il gioco/i,
    );
    expect(screen.getByTestId("sb-savestate-save-0")).toBeDisabled();
    // Settle del primo refresh (con romId definito è atteso) per evitare warning act().
    await waitFor(() => expect(svc.listSaveStates).toHaveBeenCalledWith("rom-1"));
  });

  it("capabilities.saveStates=false → pannello disabilitato con nota onesta (no claim falsi)", async () => {
    const svc = makeService();
    render(
      <SaveStatePanel
        engine={fakeEngine({ saveStates: false })}
        saveService={svc}
        romId="rom-1"
        currentCore="gambatte"
        isRunning
      />,
    );
    const region = screen.getByRole("region", { name: /save state/i });
    expect(region).toHaveAttribute("data-supported", "false");
    expect(region).toHaveAttribute("data-disabled", "true");
    expect(screen.getByTestId("sb-savestate-disabled-note").textContent).toMatch(
      /non supportati/i,
    );
    expect(screen.getByTestId("sb-savestate-save-0")).toBeDisabled();
    // Settle del primo refresh (romId definito) per evitare warning act() al teardown.
    await waitFor(() => expect(svc.listSaveStates).toHaveBeenCalledWith("rom-1"));
  });
});
