// @vitest-environment node
// TSK-019 — test di integrazione "pausa/ripresa + input" (US-011/US-012).
// Integrazione a livello modulo (vitest). Browser-e2e reale (Playwright + EmulatorJS) = follow-up.
import { describe, expect, it, vi } from "vitest";
import { CoreWrapper, type EmulatorEngine, type GameButton } from "../../src/core/core-wrapper";
import { InputMapping } from "../../src/domain/input-mapping";

function fakeEngine() {
  return {
    load: vi.fn<EmulatorEngine["load"]>(async () => {}),
    start: vi.fn(() => {}),
    pause: vi.fn(() => {}),
    resume: vi.fn(() => {}),
    stop: vi.fn(() => {}),
    setAudio: vi.fn(() => {}),
    sendInput: vi.fn<EmulatorEngine["sendInput"]>(() => {}),
    setSpeed: vi.fn(() => {}),
    capabilities: { rewind: false },
  } satisfies EmulatorEngine;
}

describe("flusso pausa/ripresa + input (integrazione)", () => {
  it("input da tastiera arriva al core e pausa/ripresa cambiano stato", async () => {
    const engine = fakeEngine();
    const wrapper = new CoreWrapper(engine);
    await wrapper.load({ rom: new Blob(["x"]), core: "gambatte" });
    wrapper.start();

    // InputMapping instrada gli input al CoreWrapper (sink)
    const input = new InputMapping((b: GameButton, p: boolean) => wrapper.sendInput(b, p));
    input.keyDown("ArrowLeft");
    input.keyUp("ArrowLeft");
    expect(engine.sendInput).toHaveBeenCalledWith("left", true);
    expect(engine.sendInput).toHaveBeenCalledWith("left", false);

    // pausa → l'input non passa più; ripresa → ripassa
    wrapper.pause();
    expect(wrapper.currentState).toBe("paused");
    engine.sendInput.mockClear();
    input.keyDown("x"); // 'a'
    expect(engine.sendInput).not.toHaveBeenCalled(); // CoreWrapper.sendInput no-op se non running

    wrapper.resume();
    input.keyDown("x");
    expect(engine.sendInput).toHaveBeenCalledWith("a", true);
  });
});
