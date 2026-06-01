// TSK-035 — Test del wiring "Schermo intero" sul Player (US-020).
// Copre: invocazione requestFullscreen/exitFullscreen, sync stato via
// `fullscreenchange`, aggiornamento aria-label/aria-pressed, fallback API
// assente (bottone disabilitato), cleanup listener su unmount.

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EmulatorEngine } from "../../core/core-wrapper";
import { Player } from "./Player";

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
    // TSK-030: no-op per soddisfare il contratto esteso (UI Player non li chiama ancora).
    snapshot: vi.fn<EmulatorEngine["snapshot"]>(async () => new Uint8Array()),
    restore: vi.fn<EmulatorEngine["restore"]>(async () => {}),
    getSram: vi.fn<EmulatorEngine["getSram"]>(async () => null),
    loadSram: vi.fn<EmulatorEngine["loadSram"]>(async () => {}),
    capabilities: { rewind: false, saveStates: false, sram: false },
  } satisfies EmulatorEngine;
}

/**
 * jsdom non implementa Fullscreen API. Installiamo mock controllabili su
 * Element.prototype.requestFullscreen e document.exitFullscreen + uno stato
 * fittizio per `document.fullscreenElement`. Tutto restaurato in afterEach.
 */
type FsHandle = {
  requestFullscreen: ReturnType<typeof vi.fn>;
  exitFullscreen: ReturnType<typeof vi.fn>;
  setFullscreenElement: (el: Element | null) => void;
  emitChange: () => void;
};

function installFullscreenMock(): FsHandle {
  let current: Element | null = null;
  const requestFullscreen = vi.fn(async function (this: Element) {
    current = this;
    document.dispatchEvent(new Event("fullscreenchange"));
  });
  const exitFullscreen = vi.fn(async () => {
    current = null;
    document.dispatchEvent(new Event("fullscreenchange"));
  });
  Object.defineProperty(Element.prototype, "requestFullscreen", {
    configurable: true,
    writable: true,
    value: requestFullscreen,
  });
  Object.defineProperty(document, "exitFullscreen", {
    configurable: true,
    writable: true,
    value: exitFullscreen,
  });
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get: () => current,
  });
  return {
    requestFullscreen,
    exitFullscreen,
    setFullscreenElement: (el) => {
      current = el;
    },
    emitChange: () => document.dispatchEvent(new Event("fullscreenchange")),
  };
}

function uninstallFullscreenMock() {
  // Rimuove le proprietà definite a runtime: i descrittori non esistono in jsdom
  // di default, quindi `delete` è sicuro.
  // @ts-expect-error: cleanup di proprietà installate dal test.
  delete (Element.prototype as Element).requestFullscreen;
  // @ts-expect-error: cleanup di proprietà installate dal test.
  delete (document as Document).exitFullscreen;
  // @ts-expect-error: cleanup di proprietà installate dal test.
  delete (document as Document).fullscreenElement;
}

describe("Player — Schermo intero (TSK-035 / US-020)", () => {
  let fs: FsHandle;

  beforeEach(() => {
    fs = installFullscreenMock();
  });
  afterEach(() => {
    uninstallFullscreenMock();
    vi.restoreAllMocks();
  });

  it("mostra il bottone 'Schermo intero' con aria-label/aria-pressed coerenti", () => {
    render(
      <Player engine={fakeEngine()} rom={{ rom: new Blob(["x"]), core: "mgba" }} />,
    );
    const btn = screen.getByRole("button", { name: /schermo intero/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeEnabled();
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("toggle: chiama requestFullscreen sul contenitore e aggiorna stato/icona", async () => {
    render(
      <Player engine={fakeEngine()} rom={{ rom: new Blob(["x"]), core: "mgba" }} />,
    );
    const screenDiv = screen.getByLabelText("Schermo di gioco");
    const btn = screen.getByRole("button", { name: /schermo intero/i });

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(fs.requestFullscreen).toHaveBeenCalledTimes(1);
    // Il `this` di requestFullscreen deve essere il contenitore .sb-screen.
    expect(fs.requestFullscreen.mock.instances[0]).toBe(screenDiv);

    const exitBtn = screen.getByRole("button", { name: /esci da schermo intero/i });
    expect(exitBtn).toHaveAttribute("aria-pressed", "true");
    expect(exitBtn).toHaveTextContent(/esci schermo intero/i);
  });

  it("toggle ritorno: invoca exitFullscreen quando già in fullscreen", async () => {
    render(
      <Player engine={fakeEngine()} rom={{ rom: new Blob(["x"]), core: "mgba" }} />,
    );
    const btn = screen.getByRole("button", { name: /schermo intero/i });

    await act(async () => {
      fireEvent.click(btn); // entra
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /esci da schermo intero/i }),
      );
    });

    expect(fs.exitFullscreen).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: /^schermo intero$/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("sincronizza stato su evento fullscreenchange esterno (es. Esc utente)", async () => {
    render(
      <Player engine={fakeEngine()} rom={{ rom: new Blob(["x"]), core: "mgba" }} />,
    );
    const screenDiv = screen.getByLabelText("Schermo di gioco");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /schermo intero/i }));
    });
    expect(
      screen.getByRole("button", { name: /esci da schermo intero/i }),
    ).toBeInTheDocument();

    // Simula uscita esterna (Esc): il browser azzera fullscreenElement e firea l'evento.
    await act(async () => {
      fs.setFullscreenElement(null);
      fs.emitChange();
    });

    expect(
      screen.getByRole("button", { name: /^schermo intero$/i }),
    ).toHaveAttribute("aria-pressed", "false");
    // Niente regressioni su aria-label dello schermo.
    expect(screenDiv).toHaveAttribute("aria-label", "Schermo di gioco");
  });

  it("fallback onesto: se l'API non è disponibile il bottone è disabilitato", () => {
    // Disinstalliamo l'API per questo singolo caso; il beforeEach la riarmava.
    uninstallFullscreenMock();

    render(
      <Player engine={fakeEngine()} rom={{ rom: new Blob(["x"]), core: "mgba" }} />,
    );
    const btn = screen.getByRole("button", { name: /schermo intero/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute(
      "title",
      "Schermo intero non supportato dal browser",
    );
  });

  it("rimuove il listener fullscreenchange su unmount", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(
      <Player engine={fakeEngine()} rom={{ rom: new Blob(["x"]), core: "mgba" }} />,
    );
    const added = addSpy.mock.calls.filter((c) => c[0] === "fullscreenchange");
    expect(added.length).toBeGreaterThan(0);

    unmount();

    const removed = removeSpy.mock.calls.filter(
      (c) => c[0] === "fullscreenchange",
    );
    expect(removed.length).toBeGreaterThan(0);
  });
});
