// TSK-060 — test TouchOverlay: D-pad + pulsanti virtuali (US-026).
// TSK-061 — test useTouchOverlayConfig: config persistita (US-027).
//
// Strategia di test: jsdom non supporta matchMedia. Il guard `isTouchDevice()`
// è sovrascritto via `vi.spyOn(window, 'matchMedia')` per simulare un touch device.
// `sendTouchInput` è spiato sull'`InputMapping` per verificare che gli eventi
// touchstart/touchend instradino il pulsante corretto.

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InputMapping } from "../../domain/input-mapping";
import type { ConfigPort } from "../../storage/port";
import { TouchOverlay } from "./TouchOverlay";
import { useTouchOverlayConfig } from "./useTouchOverlayConfig";
import { renderHook } from "@testing-library/react";

// --------------------------------------------------------------------------
// Helper: simula un touch device (matchMedia pointer:coarse → true).
// jsdom non definisce window.matchMedia → usiamo Object.defineProperty.
// --------------------------------------------------------------------------
function mockTouchDevice(isTouchDevice = true) {
  const impl = (query: string): MediaQueryList =>
    ({
      matches: isTouchDevice && query === "(pointer: coarse)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: impl,
  });
}

// --------------------------------------------------------------------------
// Helper: fake InputMapping con sendTouchInput spiato.
// --------------------------------------------------------------------------
function fakeInputMapping() {
  const im = new InputMapping(vi.fn());
  vi.spyOn(im, "sendTouchInput");
  return im;
}

// --------------------------------------------------------------------------
// Helper: fake ConfigPort.
// --------------------------------------------------------------------------
function fakeConfigPort(stored?: string): ConfigPort & {
  setConfigMock: ReturnType<typeof vi.fn>;
  getConfigMock: ReturnType<typeof vi.fn>;
} {
  const setConfigMock = vi.fn<ConfigPort["setConfig"]>(async () => {});
  const getConfigMock = vi.fn<ConfigPort["getConfig"]>(async () => stored as never);
  return {
    setConfigMock,
    getConfigMock,
    setConfig: setConfigMock,
    getConfig: getConfigMock,
    // StoragePort stub — non usato da useTouchOverlayConfig.
    addRom: vi.fn(),
    listRoms: vi.fn(),
    listRomsMeta: vi.fn(),
    getRom: vi.fn(),
    removeRom: vi.fn(),
  } as unknown as ConfigPort & {
    setConfigMock: ReturnType<typeof vi.fn>;
    getConfigMock: ReturnType<typeof vi.fn>;
  };
}

// --------------------------------------------------------------------------
// TSK-060 — TouchOverlay render
// --------------------------------------------------------------------------

describe("TouchOverlay", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("non viene reso su desktop (pointer: fine)", () => {
    mockTouchDevice(false);
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    expect(screen.queryByTestId("sb-touch-overlay")).not.toBeInTheDocument();
  });

  it("viene reso su touch device (pointer: coarse)", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    expect(screen.getByTestId("sb-touch-overlay")).toBeInTheDocument();
  });

  it("è aria-hidden (non nel tab order)", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    const overlay = screen.getByTestId("sb-touch-overlay");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });

  it("rende il D-pad con 4 direzioni", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    expect(screen.getByTestId("sb-touch-dpad-up")).toBeInTheDocument();
    expect(screen.getByTestId("sb-touch-dpad-down")).toBeInTheDocument();
    expect(screen.getByTestId("sb-touch-dpad-left")).toBeInTheDocument();
    expect(screen.getByTestId("sb-touch-dpad-right")).toBeInTheDocument();
  });

  it("touchstart D-pad su → sendTouchInput('up', true)", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    const upBtn = screen.getByTestId("sb-touch-dpad-up");
    fireEvent.touchStart(upBtn);
    expect(im.sendTouchInput).toHaveBeenCalledWith("up", true);
  });

  it("touchend D-pad su → sendTouchInput('up', false)", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    const upBtn = screen.getByTestId("sb-touch-dpad-up");
    fireEvent.touchEnd(upBtn);
    expect(im.sendTouchInput).toHaveBeenCalledWith("up", false);
  });

  it("touchstart D-pad destra → sendTouchInput('right', true)", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    fireEvent.touchStart(screen.getByTestId("sb-touch-dpad-right"));
    expect(im.sendTouchInput).toHaveBeenCalledWith("right", true);
  });

  it("touchstart D-pad sinistra → sendTouchInput('left', true)", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    fireEvent.touchStart(screen.getByTestId("sb-touch-dpad-left"));
    expect(im.sendTouchInput).toHaveBeenCalledWith("left", true);
  });

  it("touchstart D-pad giù → sendTouchInput('down', true)", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    fireEvent.touchStart(screen.getByTestId("sb-touch-dpad-down"));
    expect(im.sendTouchInput).toHaveBeenCalledWith("down", true);
  });

  it("GB (gambatte): rende A, B, Select, Start", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    expect(screen.getByTestId("sb-touch-btn-a")).toBeInTheDocument();
    expect(screen.getByTestId("sb-touch-btn-b")).toBeInTheDocument();
    expect(screen.getByTestId("sb-touch-btn-select")).toBeInTheDocument();
    expect(screen.getByTestId("sb-touch-btn-start")).toBeInTheDocument();
    // GBA-only: NON rende L e R su gambatte.
    expect(screen.queryByTestId("sb-touch-btn-l")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sb-touch-btn-r")).not.toBeInTheDocument();
  });

  it("GBA (mgba): rende A, B, L, R, Select, Start", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="mgba" inputMapping={im} />);
    expect(screen.getByTestId("sb-touch-btn-a")).toBeInTheDocument();
    expect(screen.getByTestId("sb-touch-btn-b")).toBeInTheDocument();
    expect(screen.getByTestId("sb-touch-btn-l")).toBeInTheDocument();
    expect(screen.getByTestId("sb-touch-btn-r")).toBeInTheDocument();
    expect(screen.getByTestId("sb-touch-btn-select")).toBeInTheDocument();
    expect(screen.getByTestId("sb-touch-btn-start")).toBeInTheDocument();
  });

  it("touchstart pulsante A → sendTouchInput('a', true)", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    fireEvent.touchStart(screen.getByTestId("sb-touch-btn-a"));
    expect(im.sendTouchInput).toHaveBeenCalledWith("a", true);
  });

  it("touchend pulsante B → sendTouchInput('b', false)", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    fireEvent.touchEnd(screen.getByTestId("sb-touch-btn-b"));
    expect(im.sendTouchInput).toHaveBeenCalledWith("b", false);
  });

  it("GBA: touchstart L → sendTouchInput('l', true)", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="mgba" inputMapping={im} />);
    fireEvent.touchStart(screen.getByTestId("sb-touch-btn-l"));
    expect(im.sendTouchInput).toHaveBeenCalledWith("l", true);
  });

  it("GBA: touchstart R → sendTouchInput('r', true)", () => {
    mockTouchDevice(true);
    const im = fakeInputMapping();
    render(<TouchOverlay core="mgba" inputMapping={im} />);
    fireEvent.touchStart(screen.getByTestId("sb-touch-btn-r"));
    expect(im.sendTouchInput).toHaveBeenCalledWith("r", true);
  });
});

// --------------------------------------------------------------------------
// TSK-060 — sendTouchInput unit (InputMapping esteso)
// --------------------------------------------------------------------------

describe("InputMapping.sendTouchInput", () => {
  it("instrada direttamente al sink il pulsante e pressed=true", () => {
    const sink = vi.fn();
    const im = new InputMapping(sink);
    im.sendTouchInput("up", true);
    expect(sink).toHaveBeenCalledWith("up", true);
  });

  it("instrada direttamente al sink il pulsante e pressed=false", () => {
    const sink = vi.fn();
    const im = new InputMapping(sink);
    im.sendTouchInput("a", false);
    expect(sink).toHaveBeenCalledWith("a", false);
  });

  it("funziona con pulsanti GBA (l, r)", () => {
    const sink = vi.fn();
    const im = new InputMapping(sink);
    im.sendTouchInput("l", true);
    im.sendTouchInput("r", false);
    expect(sink).toHaveBeenNthCalledWith(1, "l", true);
    expect(sink).toHaveBeenNthCalledWith(2, "r", false);
  });
});

// --------------------------------------------------------------------------
// TSK-061 — useTouchOverlayConfig
// --------------------------------------------------------------------------

describe("useTouchOverlayConfig", () => {
  it("al mount chiama getConfig('touch-overlay')", async () => {
    const port = fakeConfigPort();
    const { result } = renderHook(() => useTouchOverlayConfig(port));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(port.getConfigMock).toHaveBeenCalledWith("touch-overlay");
  });

  it("usa i default quando getConfig ritorna undefined", async () => {
    const port = fakeConfigPort(undefined);
    const { result } = renderHook(() => useTouchOverlayConfig(port));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.config.opacity).toBe(0.75);
    expect(result.current.config.scale).toBe(1.0);
  });

  it("applica la config salvata quando presente", async () => {
    const saved = JSON.stringify({ opacity: 0.5, scale: 1.2 });
    const port = fakeConfigPort(saved);
    const { result } = renderHook(() => useTouchOverlayConfig(port));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.config.opacity).toBe(0.5);
    expect(result.current.config.scale).toBe(1.2);
  });

  it("setConfig aggiorna lo stato parzialmente", async () => {
    const port = fakeConfigPort();
    const { result } = renderHook(() => useTouchOverlayConfig(port));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.setConfig({ opacity: 0.3 });
    });
    expect(result.current.config.opacity).toBe(0.3);
    // Gli altri campi restano ai default.
    expect(result.current.config.scale).toBe(1.0);
  });

  it("save chiama setConfig sulla porta con la config serializzata", async () => {
    const port = fakeConfigPort();
    const { result } = renderHook(() => useTouchOverlayConfig(port));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.save();
    });
    expect(port.setConfigMock).toHaveBeenCalledWith(
      "touch-overlay",
      expect.stringContaining('"opacity"'),
    );
  });

  it("save dopo setConfig persiste il valore aggiornato", async () => {
    const port = fakeConfigPort();
    const { result } = renderHook(() => useTouchOverlayConfig(port));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.setConfig({ opacity: 0.4 });
    });
    await act(async () => {
      await result.current.save();
    });
    const call = port.setConfigMock.mock.calls[0];
    const serialized = JSON.parse(call[1] as string) as { opacity: number };
    expect(serialized.opacity).toBe(0.4);
  });

  it("senza storage usa i default e non crasha", async () => {
    const { result } = renderHook(() => useTouchOverlayConfig(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.config.opacity).toBe(0.75);
  });
});

// --------------------------------------------------------------------------
// TSK-061 — Config panel: onChange → CSS in real-time; Salva → setConfig
// --------------------------------------------------------------------------

describe("TouchOverlay config panel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockTouchDevice(true);
  });

  it("apre il pannello di config al click su 'Configura overlay'", async () => {
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    expect(screen.queryByTestId("sb-touch-config-panel")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("sb-touch-config-toggle"));
    expect(screen.getByTestId("sb-touch-config-panel")).toBeInTheDocument();
  });

  it("TSK-114: pannello config annunciabile (no aria-hidden, heading h3)", () => {
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    fireEvent.click(screen.getByTestId("sb-touch-config-toggle"));
    const panel = screen.getByTestId("sb-touch-config-panel");
    expect(panel).not.toHaveAttribute("aria-hidden", "true");
    expect(
      screen.getByRole("heading", { name: /configurazione overlay touch/i }),
    ).toBeInTheDocument();
    expect(panel).toHaveAttribute("aria-labelledby", "sb-touch-config-heading");
  });

  it("TSK-114: slider opacità focusabile via Tab", () => {
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    fireEvent.click(screen.getByTestId("sb-touch-config-toggle"));
    const opacity = screen.getByTestId("sb-touch-config-opacity");
    opacity.focus();
    expect(opacity).toHaveFocus();
    expect(opacity).toHaveAttribute("aria-label", "Opacità overlay");
  });

  it("cambio opacità aggiorna stato in real-time (CSS custom property)", async () => {
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    fireEvent.click(screen.getByTestId("sb-touch-config-toggle"));
    const slider = screen.getByTestId("sb-touch-config-opacity");
    fireEvent.change(slider, { target: { value: "0.4" } });
    // Verifica che il valore sia stato applicato (il pannello mostra "40%").
    expect(screen.getByText(/40%/)).toBeInTheDocument();
  });

  it("Salva chiama setConfig con la config aggiornata", async () => {
    const port = fakeConfigPort();
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} storage={port} />);
    // Attende che il loading sia finito.
    await waitFor(() => expect(port.getConfigMock).toHaveBeenCalled());
    fireEvent.click(screen.getByTestId("sb-touch-config-toggle"));
    const slider = screen.getByTestId("sb-touch-config-opacity");
    fireEvent.change(slider, { target: { value: "0.3" } });
    await act(async () => {
      fireEvent.click(screen.getByTestId("sb-touch-config-save"));
    });
    expect(port.setConfigMock).toHaveBeenCalledWith(
      "touch-overlay",
      expect.stringContaining('"opacity"'),
    );
  });

  it("mount con storage → getConfig chiamato all'avvio", async () => {
    const port = fakeConfigPort();
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} storage={port} />);
    await waitFor(() => expect(port.getConfigMock).toHaveBeenCalledWith("touch-overlay"));
  });
});
