// TSK-062 — test useGamepadDetection: rilevamento Gamepad API + input routing (US-028).
//
// Strategia:
// - jsdom non espone navigator.getGamepads → viene definita via Object.defineProperty
//   in beforeEach (per permettere vi.spyOn). Stesso pattern usato per altri globali
//   browser in questo codebase (es. Capacitor in useHaptics.test.ts).
// - Stub di requestAnimationFrame/cancelAnimationFrame per controllare il loop rAF.
// - Dispatch di eventi gamepadconnected/gamepaddisconnected su window.
// - Verifica che `connected` cambi correttamente e che gamepadButton sia chiamato
//   durante il polling rAF.

import { renderHook, act } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { InputMapping } from "./input-mapping";
import { useGamepadDetection } from "./useGamepadDetection";

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Crea un oggetto Gamepad minimale per i test. */
function makeGamepad(index = 0, buttons: boolean[] = []): Gamepad {
  return {
    id: `test-gamepad-${index}`,
    index,
    connected: true,
    timestamp: 0,
    mapping: "standard",
    axes: [],
    buttons: buttons.map((pressed) => ({
      pressed,
      touched: false,
      value: pressed ? 1 : 0,
    })),
    hapticActuators: [],
    vibrationActuator: null,
  } as unknown as Gamepad;
}

// --------------------------------------------------------------------------
// Setup / teardown
// --------------------------------------------------------------------------

let rafCallbacks: FrameRequestCallback[] = [];
let rafId = 0;

// getGamepads stub corrente — aggiornato da stubGetGamepads.
let getGamepadsMock: ReturnType<typeof vi.fn>;

function stubGetGamepads(pads: (Gamepad | null)[]) {
  getGamepadsMock = vi.fn().mockReturnValue(pads);
  // jsdom non definisce navigator.getGamepads: lo definiamo noi via
  // Object.defineProperty (configurable: true permette la ridefinizione
  // tra test, vi.spyOn richiederebbe già l'esistenza della property).
  Object.defineProperty(navigator, "getGamepads", {
    writable: true,
    configurable: true,
    value: getGamepadsMock,
  });
}

function updateGetGamepads(pads: (Gamepad | null)[]) {
  getGamepadsMock.mockReturnValue(pads);
}

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;

  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = ++rafId;
    rafCallbacks.push(cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (_id: number) => {
    rafCallbacks = [];
  });

  // Default: nessun gamepad connesso.
  stubGetGamepads([null]);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  // Rimuove navigator.getGamepads per isolare i test.
  Object.defineProperty(navigator, "getGamepads", {
    writable: true,
    configurable: true,
    value: undefined,
  });
});

/** Esegue tutti i rAF callback in coda (simula un frame). */
function flushRaf() {
  const pending = [...rafCallbacks];
  rafCallbacks = [];
  pending.forEach((cb) => cb(0));
}

// --------------------------------------------------------------------------
// TSK-062 — useGamepadDetection
// --------------------------------------------------------------------------

describe("useGamepadDetection", () => {
  it("connected inizialmente false senza gamepad", () => {
    const { result } = renderHook(() => useGamepadDetection());
    expect(result.current.connected).toBe(false);
  });

  it("gamepadconnected → connected diventa true", () => {
    const { result } = renderHook(() => useGamepadDetection());
    expect(result.current.connected).toBe(false);

    // Simula gamepad connesso prima di sparare l'evento.
    updateGetGamepads([makeGamepad(0)]);

    act(() => {
      window.dispatchEvent(new Event("gamepadconnected"));
    });

    expect(result.current.connected).toBe(true);
  });

  it("gamepaddisconnected → connected torna false quando tutti i pad sono via", () => {
    updateGetGamepads([makeGamepad(0)]);
    const { result } = renderHook(() => useGamepadDetection());

    // Prima connetti.
    act(() => {
      window.dispatchEvent(new Event("gamepadconnected"));
    });
    expect(result.current.connected).toBe(true);

    // Ora disconnetti.
    updateGetGamepads([null]);
    act(() => {
      window.dispatchEvent(new Event("gamepaddisconnected"));
    });
    expect(result.current.connected).toBe(false);
  });

  it("il polling rAF chiama gamepadButton per i pulsanti premuti", () => {
    // Gamepad con pulsante 0 (A) premuto.
    const pad = makeGamepad(0, [true]);
    updateGetGamepads([pad]);

    const sink = vi.fn();
    const im = new InputMapping(sink);

    renderHook(() => useGamepadDetection(im));

    // Connetti il gamepad → avvia polling.
    act(() => {
      window.dispatchEvent(new Event("gamepadconnected"));
    });

    // Flush un frame rAF.
    act(() => {
      flushRaf();
    });

    // Pulsante 0 (DEFAULT_GAMEPAD_MAP[0] = "a") deve essere stato inviato come pressed.
    expect(sink).toHaveBeenCalledWith("a", true);
  });

  it("il polling non invia duplicati se il pulsante rimane premuto tra frame", () => {
    const pad = makeGamepad(0, [true]);
    updateGetGamepads([pad]);
    const sink = vi.fn();
    const im = new InputMapping(sink);

    renderHook(() => useGamepadDetection(im));
    act(() => {
      window.dispatchEvent(new Event("gamepadconnected"));
    });

    // Primo frame: registra pressed.
    act(() => {
      flushRaf();
    });
    const callsAfterFirst = sink.mock.calls.length;

    // Secondo frame: stesso stato → nessun nuovo dispatch.
    act(() => {
      flushRaf();
    });
    expect(sink.mock.calls.length).toBe(callsAfterFirst);
  });

  it("senza Gamepad API (guard jsdom): no crash, connected resta false", () => {
    // Rimuoviamo navigator.getGamepads per simulare un ambiente senza Gamepad API.
    Object.defineProperty(navigator, "getGamepads", {
      writable: true,
      configurable: true,
      value: undefined,
    });

    // Il hook usa hasGamepadApi() che controlla typeof === 'function' prima di
    // chiamare → deve essere un no-op completo.
    let hookResult: ReturnType<typeof useGamepadDetection> | undefined;
    expect(() => {
      const { result } = renderHook(() => useGamepadDetection());
      hookResult = result.current;
    }).not.toThrow();

    expect(hookResult?.connected).toBe(false);
  });

  it("cleanup al unmount: rimuove i listener e cancella il polling", () => {
    updateGetGamepads([makeGamepad(0)]);
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useGamepadDetection());

    act(() => {
      window.dispatchEvent(new Event("gamepadconnected"));
    });

    // Al mount devono essere stati aggiunti i listener.
    expect(addSpy).toHaveBeenCalledWith(
      "gamepadconnected",
      expect.any(Function),
    );

    unmount();

    // Dopo unmount devono essere stati rimossi.
    expect(removeSpy).toHaveBeenCalledWith(
      "gamepadconnected",
      expect.any(Function),
    );
    expect(removeSpy).toHaveBeenCalledWith(
      "gamepaddisconnected",
      expect.any(Function),
    );
  });
});
