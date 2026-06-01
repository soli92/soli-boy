// TSK-007 — test resolveCore + lifecycle CoreWrapper con engine fake.
import { describe, expect, it, vi } from "vitest";
import { CoreWrapper, resolveCore, type EmulatorEngine } from "./core-wrapper";

function fakeEngine(): EmulatorEngine & { loaded: number; started: number } {
  return {
    loaded: 0,
    started: 0,
    load: vi.fn(async function (this: any) {
      this.loaded++;
    }),
    start: vi.fn(function (this: any) {
      this.started++;
    }),
  } as any;
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
