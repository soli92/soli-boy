// TSK-007 — test resolveCore + lifecycle CoreWrapper con engine fake.
// TSK-009 — test setAudio (US-015). Fake engine tipato (no `as any`).
import { describe, expect, it, vi } from "vitest";
import { CoreWrapper, resolveCore, type EmulatorEngine } from "./core-wrapper";

function fakeEngine() {
  return {
    load: vi.fn<EmulatorEngine["load"]>(async () => {}),
    start: vi.fn<EmulatorEngine["start"]>(() => {}),
    setAudio: vi.fn<EmulatorEngine["setAudio"]>(() => {}),
  } satisfies EmulatorEngine;
}

describe("resolveCore", () => {
  it("risolve GBA → mgba", () => {
    expect(resolveCore("metroid.gba")).toEqual({ platform: "GBA", core: "mgba" });
  });
  it("risolve arcade .zip → fbneo", () => {
    expect(resolveCore("sf2.zip")).toEqual({ platform: "ARCADE", core: "fbneo" });
  });
  it("formato non supportato → unsupported + reason", () => {
    const r = resolveCore("game.nes");
    expect(r).toHaveProperty("unsupported", true);
  });
});

describe("CoreWrapper lifecycle", () => {
  it("load porta lo stato a loaded, start a running", async () => {
    const engine = fakeEngine();
    const w = new CoreWrapper(engine);
    expect(w.currentState).toBe("idle");
    await w.load({ rom: new Blob(["x"]), core: "mgba" });
    expect(w.currentState).toBe("loaded");
    w.start();
    expect(w.currentState).toBe("running");
    expect(engine.load).toHaveBeenCalledOnce();
    expect(engine.start).toHaveBeenCalledOnce();
  });

  it("start senza load lancia errore", () => {
    const w = new CoreWrapper(fakeEngine());
    expect(() => w.start()).toThrow(/nessuna ROM caricata/i);
  });
});

describe("CoreWrapper.setAudio (US-015)", () => {
  it("imposta volume/mute e lo inoltra all'engine", () => {
    const engine = fakeEngine();
    const w = new CoreWrapper(engine);
    w.setAudio({ volume: 0.5, mute: false });
    expect(w.audioSettings).toEqual({ volume: 0.5, mute: false });
    expect(engine.setAudio).toHaveBeenCalledWith({ volume: 0.5, mute: false });
  });

  it("clampa il volume in [0,1]", () => {
    const w = new CoreWrapper(fakeEngine());
    w.setAudio({ volume: 2, mute: false });
    expect(w.audioSettings.volume).toBe(1);
    w.setAudio({ volume: -1, mute: true });
    expect(w.audioSettings).toEqual({ volume: 0, mute: true });
  });
});
