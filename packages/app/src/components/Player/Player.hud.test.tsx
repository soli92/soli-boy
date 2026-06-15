// TSK-104 — Test funzionale HUD Player: multi-stato, aria-live, overlay pausa.
// Functional oracle (AC2): sequenza play → pause verifica che [aria-live]
// contenga "In pausa" e che il DOM mostri il pause overlay.
// A11y integration (AC3): verifica che gli attributi ARIA introdotti da TSK-103
// siano corretti in tutti e 3 gli stati (idle, running, paused).
// Visual oracle DOM (AC1 proxy): verifica presenza/assenza overlay per stato.

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EmulatorEngine } from "../../core/core-wrapper";
import { Player } from "./Player";

// ---------------------------------------------------------------------------
// Shared factory: fakeEngine per test isolati dal runtime reale.
// Replica la firma di Player.test.tsx per coerenza interna al test suite.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// TSK-104 AC1 (proxy DOM) — leggibilita HUD nei 3 stati
// L'HUD deve mostrare title + stato italiano corretto in idle, running, paused.
// In assenza di infrastruttura screenshot headless attiva in jsdom, il visual
// oracle e verificato tramite DOM assertions (note in TSK-104 DoD).
// ---------------------------------------------------------------------------
describe("TSK-104 AC1 — HUD Player: stato idle / running / paused (DOM proxy visual oracle)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("stato idle: HUD mostra title + 'Premi Avvia', pulsante Avvia presente, nessun overlay pausa", () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Super Mario Land"
      />,
    );
    const hud = screen.getByRole("status", { name: /stato giocatore/i });
    expect(hud).toHaveTextContent("Super Mario Land");
    expect(hud).toHaveTextContent("Premi Avvia");
    expect(screen.getByRole("button", { name: /avvia/i })).toBeInTheDocument();
    expect(screen.queryByTestId("pause-overlay")).not.toBeInTheDocument();
  });

  it("stato running: HUD mostra title + 'In esecuzione', pulsante Pausa presente, nessun overlay pausa", async () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Tetris"
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await screen.findByRole("button", { name: /pausa/i });

    const hud = screen.getByRole("status", { name: /stato giocatore/i });
    expect(hud).toHaveTextContent("Tetris");
    expect(hud).toHaveTextContent("In esecuzione");
    expect(screen.queryByTestId("pause-overlay")).not.toBeInTheDocument();
  });

  it("stato paused: HUD mostra title + 'In pausa', overlay pausa presente, pulsante Riprendi visibile", async () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Pokemon Yellow"
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await screen.findByRole("button", { name: /pausa/i });
    fireEvent.click(screen.getByRole("button", { name: /pausa/i }));

    await screen.findByTestId("pause-overlay");

    const hud = screen.getByRole("status", { name: /stato giocatore/i });
    expect(hud).toHaveTextContent("Pokemon Yellow");
    expect(hud).toHaveTextContent("In pausa");
    expect(screen.getByRole("button", { name: /riprendi/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TSK-104 AC2 — Functional oracle: sequenza play -> pause
// Verifica che [aria-live] contenga "In pausa" e che il pause overlay sia
// nel DOM con data-testid="pause-overlay" (il testid reale nel Player.tsx).
// ---------------------------------------------------------------------------
describe("TSK-104 AC2 — Functional oracle: play -> pause -> aria-live + overlay DOM", () => {
  afterEach(() => vi.restoreAllMocks());

  it("dopo play -> pause: [aria-live] contiene 'In pausa'", async () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Kirby"
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await screen.findByRole("button", { name: /pausa/i });
    fireEvent.click(screen.getByRole("button", { name: /pausa/i }));

    // AC2 primary assertion: [aria-live] container contiene "In pausa"
    const ariaLiveContainer = screen.getByRole("status", { name: /stato giocatore/i });
    await waitFor(() => {
      expect(ariaLiveContainer).toHaveTextContent("In pausa");
    });
    expect(ariaLiveContainer).toHaveAttribute("aria-live", "polite");
  });

  it("dopo play -> pause: data-testid='pause-overlay' e nel DOM", async () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Kirby"
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await screen.findByRole("button", { name: /pausa/i });
    fireEvent.click(screen.getByRole("button", { name: /pausa/i }));

    // AC2 secondary assertion: pause overlay presente nel DOM
    const overlay = await screen.findByTestId("pause-overlay");
    expect(overlay).toBeInTheDocument();
  });

  it("dopo pause -> riprendi: [aria-live] non contiene piu 'In pausa' e overlay scompare", async () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Link's Awakening"
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await screen.findByRole("button", { name: /pausa/i });
    fireEvent.click(screen.getByRole("button", { name: /pausa/i }));
    await screen.findByTestId("pause-overlay");

    // Riprendi: overlay deve scomparire e HUD deve tornare a "In esecuzione"
    fireEvent.click(screen.getByRole("button", { name: /riprendi/i }));
    await waitFor(() => {
      expect(screen.queryByTestId("pause-overlay")).not.toBeInTheDocument();
    });
    const hud = screen.getByRole("status", { name: /stato giocatore/i });
    expect(hud).toHaveTextContent("In esecuzione");
    expect(hud).not.toHaveTextContent("In pausa");
  });

  it("ciclo completo play -> pause -> riprendi -> stop: stati HUD corretti in sequenza", async () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Zelda"
      />,
    );
    const hud = screen.getByRole("status", { name: /stato giocatore/i });

    // idle
    expect(hud).toHaveTextContent("Premi Avvia");
    expect(screen.queryByTestId("pause-overlay")).not.toBeInTheDocument();

    // -> running
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await screen.findByRole("button", { name: /pausa/i });
    expect(hud).toHaveTextContent("In esecuzione");
    expect(screen.queryByTestId("pause-overlay")).not.toBeInTheDocument();

    // -> paused
    fireEvent.click(screen.getByRole("button", { name: /pausa/i }));
    await screen.findByTestId("pause-overlay");
    expect(hud).toHaveTextContent("In pausa");

    // -> running again
    fireEvent.click(screen.getByRole("button", { name: /riprendi/i }));
    await waitFor(() => expect(screen.queryByTestId("pause-overlay")).not.toBeInTheDocument());
    expect(hud).toHaveTextContent("In esecuzione");

    // -> idle (stop)
    fireEvent.click(screen.getByRole("button", { name: /arresta/i }));
    await screen.findByText("Premi Avvia");
    expect(hud).toHaveTextContent("Premi Avvia");
    expect(screen.queryByTestId("pause-overlay")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TSK-104 AC3 — A11y DOM assertions (proxy axe, senza infrastruttura browser)
// Verifica gli attributi ARIA introdotti da TSK-103: role="status", aria-live,
// aria-atomic, aria-hidden sull'overlay pausa, aria-label sullo schermo.
// L'axe-playwright headless viene eseguito nell'e2e (player-hud-oracle.e2e.ts).
// ---------------------------------------------------------------------------
describe("TSK-104 AC3 — A11y attributi ARIA: struttura post-TSK-103 (proxy DOM)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("HUD: role='status', aria-live='polite', aria-atomic='true'", () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Test"
      />,
    );
    const hud = screen.getByRole("status", { name: /stato giocatore/i });
    expect(hud).toHaveAttribute("role", "status");
    expect(hud).toHaveAttribute("aria-live", "polite");
    expect(hud).toHaveAttribute("aria-atomic", "true");
    expect(hud).toHaveAttribute("aria-label", "Stato giocatore");
  });

  it("schermo di gioco: aria-label='Schermo di gioco', data-state='idle' all'avvio", () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
      />,
    );
    const gameScreen = screen.getByLabelText("Schermo di gioco");
    expect(gameScreen).toHaveAttribute("aria-label", "Schermo di gioco");
    expect(gameScreen).toHaveAttribute("data-state", "idle");
  });

  it("schermo di gioco: data-state cambia a 'running' dopo avvio", async () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await screen.findByRole("button", { name: /pausa/i });
    expect(screen.getByLabelText("Schermo di gioco")).toHaveAttribute("data-state", "running");
  });

  it("schermo di gioco: data-state cambia a 'paused' dopo pausa", async () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await screen.findByRole("button", { name: /pausa/i });
    fireEvent.click(screen.getByRole("button", { name: /pausa/i }));
    await screen.findByTestId("pause-overlay");
    expect(screen.getByLabelText("Schermo di gioco")).toHaveAttribute("data-state", "paused");
  });

  it("overlay pausa: aria-hidden='true' (non annunciato, HUD annuncia gia)", async () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await screen.findByRole("button", { name: /pausa/i });
    fireEvent.click(screen.getByRole("button", { name: /pausa/i }));
    const overlay = await screen.findByTestId("pause-overlay");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });

  it("overlay pausa: contiene l'icona pausa visiva (non testo accessibile)", async () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await screen.findByRole("button", { name: /pausa/i });
    fireEvent.click(screen.getByRole("button", { name: /pausa/i }));
    const overlay = await screen.findByTestId("pause-overlay");
    expect(overlay).toHaveTextContent("⏸");
  });
});

// ---------------------------------------------------------------------------
// TSK-104 AC1 proxy — HUD_STATE_LABELS esaustivita: tutti e 4 gli stati
// Il mapping centralizzato in Player.tsx esporta i 4 stati possibili.
// Lo stato `loaded` e trattato come idle dall'utente (stessa label).
// ---------------------------------------------------------------------------
describe("TSK-104 AC1 proxy — HUD_STATE_LABELS: copertura stati idle/loaded/running/paused", () => {
  afterEach(() => vi.restoreAllMocks());

  it("HUD_STATE_LABELS: idle -> 'Premi Avvia'", () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Test"
      />,
    );
    const hud = screen.getByRole("status", { name: /stato giocatore/i });
    expect(hud).toHaveTextContent("Premi Avvia");
  });

  it("HUD_STATE_LABELS: running -> 'In esecuzione'", async () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Test"
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await screen.findByRole("button", { name: /pausa/i });
    const hud = screen.getByRole("status", { name: /stato giocatore/i });
    expect(hud).toHaveTextContent("In esecuzione");
  });

  it("HUD_STATE_LABELS: paused -> 'In pausa'", async () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
        title="Test"
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /avvia/i }));
    });
    await screen.findByRole("button", { name: /pausa/i });
    fireEvent.click(screen.getByRole("button", { name: /pausa/i }));
    await waitFor(() => {
      const hud = screen.getByRole("status", { name: /stato giocatore/i });
      expect(hud).toHaveTextContent("In pausa");
    });
  });

  it("senza title prop: HUD mostra 'Nessun gioco selezionato' (HUD_TITLE_IDLE)", () => {
    render(
      <Player
        engine={fakeEngine()}
        rom={{ rom: new Blob(["x"]), core: "gambatte" }}
      />,
    );
    const hud = screen.getByRole("status", { name: /stato giocatore/i });
    expect(hud).toHaveTextContent("Nessun gioco selezionato");
  });
});
