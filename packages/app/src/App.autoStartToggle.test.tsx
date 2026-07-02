// TSK-102 (US-053) — Test funzionale del toggle "Avvio automatico dalla
// libreria" (UX-CF1-01 opt-out).
//
// Coperture:
//  - AC4/AC6: toggle OFF → tap su tile Library seleziona la ROM e cambia tab
//    Play, ma il Player NON avvia automaticamente (resta in idle, mostra il
//    bottone "Avvia").
//  - AC5/AC6: toggle ON (default) → tap su tile Library avvia immediatamente
//    (Player a running, bottone "Pausa" visibile). Parità con TSK-100.
//  - AC2: la preferenza è persistita via ConfigPort sotto la chiave
//    canonica `auto-start-from-library`.
//
// Strategia mock identica a `App.gameChangeDialog.test.tsx` (TSK-101): il
// `selectAdapter` ritorna un fake storage con due ROM precaricate; `wasmboy`
// è neutralizzato; `engine-registry` ritorna sempre StubEngine.

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { StoragePort, ConfigPort, CoverPort } from "./storage/port";
import type { RomRecord } from "./storage/types";
import { AUTO_START_CONFIG_KEY } from "./components/Settings/useAutoStartConfig";

// TSK-143 (US-094 / EP-020) — La primitiva Radix Tabs (solids) attiva le tab
// via `onMouseDown` (non `onClick`), per allineamento al pattern WAI-ARIA APG.
// `fireEvent.click` sintetizza solo l'evento `click` finale: usiamo
// `fireEvent.mouseDown` per innescare l'activation path della primitive.
function clickTab(name: RegExp | string) {
  const tab = screen.getByRole("tab", { name });
  fireEvent.mouseDown(tab);
  return tab;
}

// jsdom non implementa matchMedia (vedi App.gameChangeDialog.test.tsx).
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

vi.mock("./storage/indexeddb-adapter", () => ({
  indexedDbStorage: {},
  indexedDbConfig: {},
}));

const ROM_A: RomRecord = {
  id: "rom-a",
  title: "Tetris",
  platform: "GB",
  core: "gambatte",
  fileBlob: new Blob(["AAA"]),
  addedAt: 1,
};

// Mutable per ciascun test: lo `configStore` permette al fake di restituire una
// preferenza diversa (preset toggle ON/OFF) prima del render.
const configStore: Record<string, unknown> = {};

function makeFakeStorage(): StoragePort & CoverPort & ConfigPort {
  const rows = [ROM_A];
  return {
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
    getConfig: vi.fn(async (key: string) => configStore[key]),
    setConfig: vi.fn(async (key: string, value: unknown) => {
      configStore[key] = value;
    }),
  } as unknown as StoragePort & CoverPort & ConfigPort;
}

const fakeStorage = makeFakeStorage();

vi.mock("./storage/select-adapter", () => ({
  selectAdapter: () => ({ storage: fakeStorage, config: fakeStorage }),
  isDesktopRuntime: () => false,
}));

vi.mock("./core/engine-registry", async () => {
  const { StubEngine } = await import("./core/stub-engine");
  return {
    selectEngine: () => new StubEngine(),
  };
});

beforeEach(() => {
  // Pulisce il configStore fra test (no cross-test pollution sulla preferenza).
  for (const k of Object.keys(configStore)) delete configStore[k];
  vi.clearAllMocks();
});

describe("App — TSK-102 (US-053) Toggle 'Avvio automatico dalla libreria'", () => {
  it("AC5 (default ON): tap tile Library → Player in running (auto-start)", async () => {
    // Nessuna preferenza pre-persistita → useAutoStartConfig idra al default ON.
    const { App } = await import("./App");
    render(<App />);

    clickTab(/libreria/i);
    const tile = await screen.findByTestId("sb-select-rom-rom-a");
    await act(async () => {
      fireEvent.click(tile);
    });

    // Il bottone "Pausa" è visibile solo quando il Player è in running.
    await screen.findByRole("button", { name: /pausa/i });
  });

  it("AC4+AC6 (preferenza OFF): tap tile Library → Player resta idle (mostra 'Avvia')", async () => {
    // Pre-persisto la preferenza OFF nel configStore (simula sessione precedente
    // in cui l'utente ha disabilitato il toggle).
    configStore[AUTO_START_CONFIG_KEY] = "false";

    const { App } = await import("./App");
    render(<App />);

    clickTab(/libreria/i);
    const tile = await screen.findByTestId("sb-select-rom-rom-a");
    await act(async () => {
      fireEvent.click(tile);
    });

    // AC4: il tap deve comunque selezionare la ROM e cambiare tab a Play.
    // Verifico che il tab Play sia ora attivo (aria-selected="true").
    const playTab = await screen.findByRole("tab", { name: /play/i });
    await waitFor(() => {
      expect(playTab).toHaveAttribute("aria-selected", "true");
    });

    // AC4/AC6: il Player NON deve essere avviato → niente bottone "Pausa";
    // il bottone "Avvia" è presente (Player in idle/loaded).
    expect(
      screen.queryByRole("button", { name: /pausa/i }),
    ).not.toBeInTheDocument();
    await screen.findByRole("button", { name: /avvia/i });
  });

  it("AC2: cambiare il toggle in Settings persiste la preferenza via ConfigPort", async () => {
    const { App } = await import("./App");
    render(<App />);

    // Vai in Settings.
    clickTab(/impostazioni/i);

    // TSK-149 (EP-020 / US-097) — Settings usa solids `Accordion` (Radix): la
    // sezione "Avvio" è chiusa di default (contenuto smontato). Apriamo il
    // trigger prima di trovare il toggle interno.
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: /avvio — automatico dalla libreria/i,
        }),
      );
    });

    // Trova il toggle (data-testid canonico) e cliccalo: default ON → OFF.
    const toggle = await screen.findByTestId("sb-auto-start-toggle");
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await act(async () => {
      fireEvent.click(toggle);
    });

    // Lo stato switch passa a OFF.
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-checked", "false");
    });

    // setConfig è stato invocato con la chiave canonica e valore "false".
    await waitFor(() => {
      expect(fakeStorage.setConfig).toHaveBeenCalledWith(
        AUTO_START_CONFIG_KEY,
        "false",
      );
    });
  });

  it("AC2+AC4: cambio toggle a OFF in sessione → successivo tap Library NON auto-avvia", async () => {
    const { App } = await import("./App");
    render(<App />);

    // Disattiva il toggle in Settings.
    clickTab(/impostazioni/i);
    // TSK-149 (EP-020 / US-097) — sezione "Avvio" (Accordion Radix) chiusa
    // di default: apri prima di cercare il toggle interno.
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: /avvio — automatico dalla libreria/i,
        }),
      );
    });
    const toggle = await screen.findByTestId("sb-auto-start-toggle");
    await act(async () => {
      fireEvent.click(toggle);
    });
    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-checked", "false"),
    );

    // Vai in Library e tap'a una ROM.
    clickTab(/libreria/i);
    const tile = await screen.findByTestId("sb-select-rom-rom-a");
    await act(async () => {
      fireEvent.click(tile);
    });

    // Player NON deve essere in running: nessun "Pausa", "Avvia" presente.
    expect(
      screen.queryByRole("button", { name: /pausa/i }),
    ).not.toBeInTheDocument();
    await screen.findByRole("button", { name: /avvia/i });
  });
});
