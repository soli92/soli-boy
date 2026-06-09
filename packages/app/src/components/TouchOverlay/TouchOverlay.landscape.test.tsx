// TSK-064 — test layout responsivo: orientamento landscape + safe areas (US-030).
//
// jsdom non esegue CSS (env() non è calcolato), quindi i test verificano
// il comportamento STRUTTURALE del componente (classi CSS, data-attribute),
// non il valore computato delle custom property. Il rendering visivo è
// verificabile solo su emulatore reale (DoD §6: smoke test umano).
//
// Strategia:
// - `matchMedia` è mockato per simulare portrait/landscape.
// - Si verifica che `sb-touch-landscape` sia applicata in landscape e assente
//   in portrait.
// - Si verifica `data-landscape` come attributo data di controllo.

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InputMapping } from "../../domain/input-mapping";
import { TouchOverlay } from "./TouchOverlay";

// --------------------------------------------------------------------------
// Helper: mock matchMedia per touch device + orientamento.
// --------------------------------------------------------------------------
type MediaQueryResult = {
  portrait: boolean;
  landscape: boolean;
  listeners: Map<string, Set<(e: Partial<MediaQueryListEvent>) => void>>;
};

function mockMediaQuery(initialLandscape = false): MediaQueryResult {
  const state: MediaQueryResult = {
    portrait: !initialLandscape,
    landscape: initialLandscape,
    listeners: new Map(),
  };

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => {
      const isTouch = query === "(pointer: coarse)";
      const isLandscape = query === "(orientation: landscape)";
      const matches = isTouch ? true : isLandscape ? state.landscape : false;

      const listeners = state.listeners.get(query) ?? new Set();
      state.listeners.set(query, listeners);

      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_: string, cb: (e: Partial<MediaQueryListEvent>) => void) => {
          state.listeners.get(query)?.add(cb);
        },
        removeEventListener: (_: string, cb: (e: Partial<MediaQueryListEvent>) => void) => {
          state.listeners.get(query)?.delete(cb);
        },
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
    },
  });

  return state;
}

/** Simula una rotazione del dispositivo aggiornando il mock e sparando i listener. */
function simulateOrientationChange(
  state: MediaQueryResult,
  landscape: boolean,
) {
  state.landscape = landscape;
  state.portrait = !landscape;
  const key = "(orientation: landscape)";
  state.listeners.get(key)?.forEach((cb) =>
    cb({ matches: landscape, media: key } as Partial<MediaQueryListEvent>),
  );
}

function fakeInputMapping() {
  return new InputMapping(vi.fn());
}

// --------------------------------------------------------------------------
// TSK-064 — TouchOverlay landscape/portrait
// --------------------------------------------------------------------------

describe("TouchOverlay — orientamento landscape/portrait (TSK-064)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("in portrait: overlay NON ha classe sb-touch-landscape", () => {
    mockMediaQuery(false); // portrait
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    const overlay = screen.getByTestId("sb-touch-overlay");
    expect(overlay).not.toHaveClass("sb-touch-landscape");
    expect(overlay).toHaveAttribute("data-landscape", "false");
  });

  it("in landscape: overlay HA classe sb-touch-landscape", () => {
    mockMediaQuery(true); // landscape
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    const overlay = screen.getByTestId("sb-touch-overlay");
    expect(overlay).toHaveClass("sb-touch-landscape");
    expect(overlay).toHaveAttribute("data-landscape", "true");
  });

  it("rotazione portrait → landscape: aggiorna la classe", () => {
    const state = mockMediaQuery(false); // portrait iniziale
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    const overlay = screen.getByTestId("sb-touch-overlay");
    expect(overlay).not.toHaveClass("sb-touch-landscape");

    act(() => {
      simulateOrientationChange(state, true);
    });

    expect(overlay).toHaveClass("sb-touch-landscape");
    expect(overlay).toHaveAttribute("data-landscape", "true");
  });

  it("rotazione landscape → portrait: rimuove la classe", () => {
    const state = mockMediaQuery(true); // landscape iniziale
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    const overlay = screen.getByTestId("sb-touch-overlay");
    expect(overlay).toHaveClass("sb-touch-landscape");

    act(() => {
      simulateOrientationChange(state, false);
    });

    expect(overlay).not.toHaveClass("sb-touch-landscape");
    expect(overlay).toHaveAttribute("data-landscape", "false");
  });

  it("il D-pad è reso in entrambi gli orientamenti", () => {
    mockMediaQuery(true); // landscape
    const im = fakeInputMapping();
    render(<TouchOverlay core="gambatte" inputMapping={im} />);
    expect(screen.getByTestId("sb-touch-dpad")).toBeInTheDocument();
    expect(screen.getByTestId("sb-touch-buttons")).toBeInTheDocument();
  });

  it("hapticsEnabled=false: triggerImpact non è invocato al touchstart", () => {
    mockMediaQuery(false);
    const im = fakeInputMapping();
    vi.spyOn(im, "sendTouchInput");
    render(
      <TouchOverlay core="gambatte" inputMapping={im} hapticsEnabled={false} />,
    );
    // Il touchstart deve instradare il pulsante senza errori.
    fireEvent.touchStart(screen.getByTestId("sb-touch-dpad-up"));
    expect(im.sendTouchInput).toHaveBeenCalledWith("up", true);
  });
});

// --------------------------------------------------------------------------
// TSK-066 — TouchOverlay + haptics wiring
// --------------------------------------------------------------------------

describe("TouchOverlay — hapticsEnabled prop (TSK-066)", () => {
  beforeEach(() => {
    // Touch device
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string): MediaQueryList =>
        ({
          matches: query === "(pointer: coarse)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("con hapticsEnabled=false il touchstart non crasha e invia l'input", () => {
    const im = fakeInputMapping();
    vi.spyOn(im, "sendTouchInput");
    render(
      <TouchOverlay core="gambatte" inputMapping={im} hapticsEnabled={false} />,
    );
    fireEvent.touchStart(screen.getByTestId("sb-touch-btn-a"));
    expect(im.sendTouchInput).toHaveBeenCalledWith("a", true);
  });

  it("con hapticsEnabled=true il touchstart non crasha (guard no-native)", () => {
    // Senza Capacitor nativo, triggerImpact è no-op silenzioso.
    const im = fakeInputMapping();
    vi.spyOn(im, "sendTouchInput");
    render(
      <TouchOverlay core="gambatte" inputMapping={im} hapticsEnabled={true} />,
    );
    expect(() => {
      fireEvent.touchStart(screen.getByTestId("sb-touch-btn-a"));
    }).not.toThrow();
    expect(im.sendTouchInput).toHaveBeenCalledWith("a", true);
  });
});
