// TSK-007 — test resolveCore + lifecycle CoreWrapper con engine fake.
// TSK-009 — test setAudio (US-015). TSK-015 — test pause/resume/stop (US-011).
import { describe, expect, it, vi } from "vitest";
import { CoreWrapper, resolveCore, type EmulatorEngine } from "./core-wrapper";

function fakeEngine(
  capabilities: { rewind: boolean; saveStates?: boolean; sram?: boolean } = { rewind: false },
) {
  return {
    load: vi.fn<EmulatorEngine["load"]>(async () => {}),
    start: vi.fn<EmulatorEngine["start"]>(() => {}),
    pause: vi.fn<EmulatorEngine["pause"]>(() => {}),
    resume: vi.fn<EmulatorEngine["resume"]>(() => {}),
    stop: vi.fn<EmulatorEngine["stop"]>(() => {}),
    setAudio: vi.fn<EmulatorEngine["setAudio"]>(() => {}),
    sendInput: vi.fn<EmulatorEngine["sendInput"]>(() => {}),
    setSpeed: vi.fn<EmulatorEngine["setSpeed"]>(() => {}),
    // TSK-030: stubs no-op per soddisfare il contratto esteso (CoreWrapper non
    // espone ancora questi metodi: il wiring SaveService arriva con TSK-032).
    snapshot: vi.fn<EmulatorEngine["snapshot"]>(async () => new Uint8Array()),
    restore: vi.fn<EmulatorEngine["restore"]>(async () => {}),
    getSram: vi.fn<EmulatorEngine["getSram"]>(async () => null),
    loadSram: vi.fn<EmulatorEngine["loadSram"]>(async () => {}),
    capabilities: {
      rewind: capabilities.rewind,
      saveStates: capabilities.saveStates ?? false,
      sram: capabilities.sram ?? false,
    },
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

describe("CoreWrapper pause/resume/stop (US-011)", () => {
  it("pause→paused, resume→running, stop→idle", async () => {
    const engine = fakeEngine();
    const w = new CoreWrapper(engine);
    await w.load({ rom: new Blob(["x"]), core: "gambatte" });
    w.start();
    w.pause();
    expect(w.currentState).toBe("paused");
    w.resume();
    expect(w.currentState).toBe("running");
    w.stop();
    expect(w.currentState).toBe("idle");
    expect(engine.pause).toHaveBeenCalledOnce();
    expect(engine.resume).toHaveBeenCalledOnce();
    expect(engine.stop).toHaveBeenCalledOnce();
  });

  it("pause/resume sono no-op fuori dallo stato corretto", () => {
    const engine = fakeEngine();
    const w = new CoreWrapper(engine);
    w.pause(); // idle → no-op
    w.resume(); // idle → no-op
    expect(engine.pause).not.toHaveBeenCalled();
    expect(engine.resume).not.toHaveBeenCalled();
    expect(w.currentState).toBe("idle");
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

describe("CoreWrapper.sendInput (US-012)", () => {
  it("inoltra l'input solo in running", async () => {
    const engine = fakeEngine();
    const w = new CoreWrapper(engine);
    w.sendInput("a", true); // idle → no-op
    expect(engine.sendInput).not.toHaveBeenCalled();
    await w.load({ rom: new Blob(["x"]), core: "mgba" });
    w.start();
    w.sendInput("a", true);
    expect(engine.sendInput).toHaveBeenCalledWith("a", true);
  });

  it("inoltra L/R in running (TSK-123 / EP-018)", async () => {
    const engine = fakeEngine();
    const w = new CoreWrapper(engine);
    await w.load({ rom: new Blob(["x"]), core: "mgba" });
    w.start();
    w.sendInput("l", true);
    w.sendInput("r", false);
    expect(engine.sendInput).toHaveBeenNthCalledWith(1, "l", true);
    expect(engine.sendInput).toHaveBeenNthCalledWith(2, "r", false);
  });
});

describe("CoreWrapper.setSpeed (US-014)", () => {
  it("applica fast-forward; rewind solo se supportato dal core", () => {
    const noRewind = fakeEngine({ rewind: false });
    const w1 = new CoreWrapper(noRewind);
    expect(w1.supportsRewind).toBe(false);
    expect(w1.setSpeed({ fastForward: true, rewind: true })).toEqual({ fastForward: true, rewind: false });
    expect(noRewind.setSpeed).toHaveBeenCalledWith({ fastForward: true, rewind: false });

    const withRewind = fakeEngine({ rewind: true });
    const w2 = new CoreWrapper(withRewind);
    expect(w2.setSpeed({ fastForward: false, rewind: true })).toEqual({ fastForward: false, rewind: true });
  });
});
