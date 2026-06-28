// TSK-016 — test InputMapping (US-012/US-013).
import { describe, expect, it, vi } from "vitest";
import type { GameButton } from "../core/core-wrapper";
import {
  DEFAULT_GAMEPAD_MAP,
  DEFAULT_KEY_PROFILE,
  InputMapping,
} from "./input-mapping";

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
    expect(im.keyDown("p")).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });

  it("DEFAULT_KEY_PROFILE include L e R (TSK-120 / US-062)", () => {
    expect(DEFAULT_KEY_PROFILE.q).toBe("l");
    expect(DEFAULT_KEY_PROFILE.w).toBe("r");
    expect(Object.values(DEFAULT_KEY_PROFILE)).toContain("up");
    expect(Object.values(DEFAULT_KEY_PROFILE)).toContain("a");
  });

  it("DEFAULT_GAMEPAD_MAP include indici 4/5 per L/R (TSK-120 / US-062)", () => {
    expect(DEFAULT_GAMEPAD_MAP[4]).toBe("l");
    expect(DEFAULT_GAMEPAD_MAP[5]).toBe("r");
    expect(DEFAULT_GAMEPAD_MAP[0]).toBe("a");
    expect(DEFAULT_GAMEPAD_MAP[1]).toBe("b");
  });

  it("tastiera default: Q/W inoltrano L/R al sink", () => {
    const sink = vi.fn();
    const im = new InputMapping(sink);
    expect(im.keyDown("q")).toBe(true);
    expect(im.keyUp("w")).toBe(true);
    expect(sink).toHaveBeenNthCalledWith(1, "l", true);
    expect(sink).toHaveBeenNthCalledWith(2, "r", false);
  });

  it("gamepad: indici 4/5 → L/R", () => {
    const sink = vi.fn();
    const im = new InputMapping(sink);
    expect(im.gamepadButton(4, true)).toBe(true);
    expect(im.gamepadButton(5, false)).toBe(true);
    expect(sink).toHaveBeenNthCalledWith(1, "l", true);
    expect(sink).toHaveBeenNthCalledWith(2, "r", false);
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
