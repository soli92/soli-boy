// TSK-101 (US-053) — Gate di conferma cambio gioco (UX-CF1-02).
//
// Test funzionale del flusso Library → App → Dialog → Player. Coprono i casi
// del TSK:
//   - AC2: tap stessa ROM → nessun dialog, no-op.
//   - AC1+AC3: tap ROM diversa con Player running → dialog → Annulla → nessuno swap.
//   - AC1+AC4: tap ROM diversa con Player running → dialog → "Cambia gioco" →
//             engine.stop + swap + Player avvia la nuova ROM.
//   - AC5: Esc su dialog aperto = Annulla.
//
// Mock strategy:
//   - `selectAdapter` → ritorna un fakeStorage con due ROM precaricate, così la
//     Library mostra i due tile e `getRom(id)` ritorna il `RomRecord` completo
//     (incluso `fileBlob`, materiale) al click.
//   - `wasmboy` → no-op (jsdom non ha AudioContext, side-effect del modulo
//     crasherebbe altrimenti — vedi pattern App.test.tsx originale).
//   - `engine-registry` → ritorna sempre il `StubEngine` deterministico così
//     l'auto-start dalla Library porta il Player a `running` senza dipendere
//     dal vero WasmBoy runtime.

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { StoragePort, ConfigPort, CoverPort } from "./storage/port";
import type { RomRecord } from "./storage/types";

// jsdom non implementa `window.matchMedia` (usato da TouchOverlay
// `isTouchDevice` per rilevare touch pointer). Mock no-op: nei test desktop
// vogliamo l'overlay reso ma non interattivo (la suite non interagisce con
// l'overlay touch). Stub a livello di module-load così tutti i mount lo trovano.
beforeAll(() => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
});

// Stesso pattern di App.test.tsx: il modulo `wasmboy` ha side-effect AudioContext
// che crasha in jsdom; lo neutralizziamo.
vi.mock("wasmboy", () => ({
  WasmBoy: {
    config: vi.fn(async () => {}),
    loadROM: vi.fn(async () => {}),
    play: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    saveState: vi.fn(async () => ({})),
    loadState: vi.fn(async () => {}),
    setJoypadState: vi.fn(),
    setSpeed: vi.fn(),
  },
}));

// Mock IndexedDB per evitare crash del modulo `indexeddb-adapter` durante la
// risoluzione di `selectAdapter`. Il modulo `select-adapter` importa
// `indexeddb-adapter` che tocca `indexedDB` a module-load.
vi.mock("./storage/indexeddb-adapter", () => ({
  indexedDbStorage: {},
  indexedDbConfig: {},
}));

// Storage fake con due ROM precaricate per esercitare il gate.
const ROM_A: RomRecord = {
  id: "rom-a",
  title: "Tetris",
  platform: "GB",
  core: "gambatte",
  fileBlob: new Blob(["AAA"]),
  addedAt: 1,
};
const ROM_B: RomRecord = {
  id: "rom-b",
  title: "Pokemon Red",
  platform: "GB",
  core: "gambatte",
  fileBlob: new Blob(["BBB"]),
  addedAt: 2,
};

function makeFakeStorage(): StoragePort & CoverPort & ConfigPort {
  const rows = [ROM_A, ROM_B];
  return {
    // StoragePort + Cover
    addRom: vi.fn(async () => "x"),
    listRoms: vi.fn(async () => rows),
    listRomsMeta: vi.fn(async () =>
      rows.map(({ fileBlob: _b, ...meta }) => {
        void _b;
        return meta;
      }),
    ),
    getRom: vi.fn(async (id: string) => rows.find((r) => r.id === id)),
    removeRom: vi.fn(async () => {}),
    setCover: vi.fn(async () => {}),
    // ConfigPort (minimal: tutto null/no-op)
    getConfig: vi.fn(async () => null),
    setConfig: vi.fn(async () => {}),
    // SaveStatePort/SramPort/BiosPort sono opzionali nel contratto consumato
    // qui — l'App li tocca solo se l'utente esercita save state; nel flusso
    // gate TSK-101 NON entrano in gioco.
  } as unknown as StoragePort & CoverPort & ConfigPort;
}

const fakeStorage = makeFakeStorage();

vi.mock("./storage/select-adapter", () => ({
  selectAdapter: () => ({ storage: fakeStorage, config: fakeStorage }),
  isDesktopRuntime: () => false,
}));

// Forza l'uso di StubEngine per `engine-registry` (il default per `MODE=test` è
// già STUB_ENGINE in App.tsx, ma teniamo esplicito qui per chiarezza dei test
// funzionali).
vi.mock("./core/engine-registry", async () => {
  const { StubEngine } = await import("./core/stub-engine");
  return {
    selectEngine: () => new StubEngine(),
  };
});

describe("App — TSK-101 (US-053) Gate conferma cambio gioco (UX-CF1-02)", () => {
  it("AC2: tap su STESSA ROM in esecuzione → nessun dialog, no-op", async () => {
    const { App } = await import("./App");
    render(<App />);

    // Naviga in Libreria e avvia ROM_A.
    fireEvent.click(screen.getByRole("tab", { name: /libreria/i }));
    const tileA = await screen.findByRole("button", {
      name: /^tetris gb$/i,
    });
    await act(async () => {
      fireEvent.click(tileA);
    });
    // L'autoStart porta il Player a running (il bottone "Pausa" è visibile solo
    // in running).
    await screen.findByRole("button", { name: /pausa/i });

    // Torna in Libreria e ri-tap'a la stessa ROM.
    fireEvent.click(screen.getByRole("tab", { name: /libreria/i }));
    const tileAagain = await screen.findByTestId("sb-select-rom-rom-a");
    await act(async () => {
      fireEvent.click(tileAagain);
    });

    // NESSUN dialog deve apparire.
    expect(
      screen.queryByTestId("confirm-game-change-dialog"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /cambia gioco\?/i }),
    ).not.toBeInTheDocument();

    // Il Player resta in "running" sulla ROM A.
    expect(
      screen.getByRole("button", { name: /pausa/i }),
    ).toBeInTheDocument();
  });

  it("AC1+AC3: tap ROM diversa in running → dialog → 'Annulla' → no swap", async () => {
    const { App } = await import("./App");
    render(<App />);

    // Avvia ROM_A.
    fireEvent.click(screen.getByRole("tab", { name: /libreria/i }));
    const tileA = await screen.findByTestId("sb-select-rom-rom-a");
    await act(async () => {
      fireEvent.click(tileA);
    });
    await screen.findByRole("button", { name: /pausa/i });

    // Tap'a ROM_B (diversa) → deve apparire il dialog.
    fireEvent.click(screen.getByRole("tab", { name: /libreria/i }));
    const tileB = await screen.findByTestId("sb-select-rom-rom-b");
    await act(async () => {
      fireEvent.click(tileB);
    });

    const dialog = await screen.findByRole("dialog", {
      name: /cambia gioco\?/i,
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveTextContent("Pokemon Red");

    // Click "Annulla" → dialog chiuso, ROM originale ancora attiva.
    const cancelBtn = screen.getByRole("button", { name: /annulla/i });
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: /cambia gioco\?/i }),
      ).not.toBeInTheDocument();
    });

    // Torna a Play per ispezionare l'HUD (il panel Play è `hidden` quando si è
    // in Library — `hidden` rimuove dal a11y tree, e `getByRole` non lo
    // troverebbe). Il Player non è smontato (always-mounted), continua a
    // mantenere lo stato running.
    fireEvent.click(screen.getByRole("tab", { name: /play/i }));

    // HUD del Player mostra ancora "Tetris" (ROM A) e "In esecuzione".
    const hud = await screen.findByLabelText("Stato giocatore");
    expect(hud).toHaveTextContent("Tetris");
    expect(hud).toHaveTextContent("In esecuzione");
  });

  it("AC1+AC4: tap ROM diversa in running → dialog → 'Cambia gioco' → nuova ROM avviata", async () => {
    const { App } = await import("./App");
    render(<App />);

    // Avvia ROM_A.
    fireEvent.click(screen.getByRole("tab", { name: /libreria/i }));
    const tileA = await screen.findByTestId("sb-select-rom-rom-a");
    await act(async () => {
      fireEvent.click(tileA);
    });
    await screen.findByRole("button", { name: /pausa/i });
    expect(
      screen.getByLabelText("Stato giocatore"),
    ).toHaveTextContent("Tetris");

    // Tap'a ROM_B → dialog.
    fireEvent.click(screen.getByRole("tab", { name: /libreria/i }));
    const tileB = await screen.findByTestId("sb-select-rom-rom-b");
    await act(async () => {
      fireEvent.click(tileB);
    });
    await screen.findByRole("dialog", { name: /cambia gioco\?/i });

    // Click "Cambia gioco" → swap + auto-start nuova ROM.
    const confirmBtn = screen.getByRole("button", { name: /^cambia gioco$/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Dialog chiuso.
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: /cambia gioco\?/i }),
      ).not.toBeInTheDocument();
    });

    // Il Player ora mostra "Pokemon Red" e ri-parte (autoStart è ON).
    const hud = await screen.findByLabelText("Stato giocatore");
    await waitFor(() => {
      expect(hud).toHaveTextContent("Pokemon Red");
    });
    // Aspettiamo che il nuovo auto-start porti il Player a running.
    await screen.findByRole("button", { name: /pausa/i });
  });

  it("AC5: Esc su dialog aperto = Annulla (no swap)", async () => {
    const { App } = await import("./App");
    render(<App />);

    // Avvia ROM_A.
    fireEvent.click(screen.getByRole("tab", { name: /libreria/i }));
    const tileA = await screen.findByTestId("sb-select-rom-rom-a");
    await act(async () => {
      fireEvent.click(tileA);
    });
    await screen.findByRole("button", { name: /pausa/i });

    // Tap'a ROM_B → dialog.
    fireEvent.click(screen.getByRole("tab", { name: /libreria/i }));
    const tileB = await screen.findByTestId("sb-select-rom-rom-b");
    await act(async () => {
      fireEvent.click(tileB);
    });
    await screen.findByRole("dialog", { name: /cambia gioco\?/i });

    // Premi Esc.
    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: /cambia gioco\?/i }),
      ).not.toBeInTheDocument();
    });

    // Torna a Play per ispezionare l'HUD (vedi nota su `hidden` sopra).
    fireEvent.click(screen.getByRole("tab", { name: /play/i }));

    // ROM A ancora attiva.
    const hud = await screen.findByLabelText("Stato giocatore");
    expect(hud).toHaveTextContent("Tetris");
    expect(hud).toHaveTextContent("In esecuzione");
  });

  it("AC5: focus iniziale sul bottone 'Cambia gioco' (azione primaria)", async () => {
    const { App } = await import("./App");
    render(<App />);

    // Avvia ROM_A e apri dialog su ROM_B.
    fireEvent.click(screen.getByRole("tab", { name: /libreria/i }));
    const tileA = await screen.findByTestId("sb-select-rom-rom-a");
    await act(async () => {
      fireEvent.click(tileA);
    });
    await screen.findByRole("button", { name: /pausa/i });

    fireEvent.click(screen.getByRole("tab", { name: /libreria/i }));
    const tileB = await screen.findByTestId("sb-select-rom-rom-b");
    await act(async () => {
      fireEvent.click(tileB);
    });
    await screen.findByRole("dialog", { name: /cambia gioco\?/i });

    const confirmBtn = screen.getByRole("button", { name: /^cambia gioco$/i });
    await waitFor(() => {
      expect(document.activeElement).toBe(confirmBtn);
    });
  });
});
