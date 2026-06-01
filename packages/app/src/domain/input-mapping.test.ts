// TSK-016 — test InputMapping (US-012/US-013).
import { describe, expect, it, vi } from "vitest";
import type { GameButton } from "../core/core-wrapper";
import { InputMapping } from "./input-mapping";

describe("InputMapping", () => {
  it("mappa i tasti di default su GameButton e inoltra al sink", () => {
    const calls: Array<[GameButton, boolean]> = [];
    const im = new InputMapping((b, p) => calls.push([b, p]));
    expect(im.keyDown("ArrowUp")).toBe(true);
    expect(im.keyUp("x")).toBe(true);
    expect(calls).toEqual([
      ["up", true],
      ["a", false],
    ]);
  });

  it("tasto non mappato → false, nessun dispatch", () => {
    const sink = vi.fn();
    const im = new InputMapping(sink);
    expect(im.keyDown("q")).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });

  it("gamepad: indice pulsante → GameButton", () => {
    const sink = vi.fn();
    const im = new InputMapping(sink);
    expect(im.gamepadButton(0, true)).toBe(true); // A
    expect(sink).toHaveBeenCalledWith("a", true);
    expect(im.gamepadButton(99, true)).toBe(false);
  });

  it("remap aggiorna il profilo (US-013)", () => {
    const sink = vi.fn();
    const im = new InputMapping(sink);
    im.remap("q", "a");
    expect(im.keyDown("q")).toBe(true);
    expect(sink).toHaveBeenCalledWith("a", true);
    expect(im.keyProfile.q).toBe("a");
  });
});
