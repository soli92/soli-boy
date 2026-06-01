// @vitest-environment node
// TSK-011 — test di integrazione del flusso "carica ROM → avvia → audio" (US-010/US-015).
// NB: integrazione a livello modulo (vitest+fake-indexeddb+fake engine). Il vero browser-e2e
// (Playwright + EmulatorJS reale) è un follow-up: vedi wiki/gaps.md (e2e-browser-runtime).
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { closeDB, getRom, listRoms } from "../../src/storage/db";
import { importRom } from "../../src/domain/rom-library";
import { indexedDbStorage } from "../../src/storage/indexeddb-adapter";
import { CoreWrapper, resolveCore, type EmulatorEngine } from "../../src/core/core-wrapper";

function fakeEngine() {
  return {
    load: vi.fn<EmulatorEngine["load"]>(async () => {}),
    start: vi.fn<EmulatorEngine["start"]>(() => {}),
    pause: vi.fn(() => {}),
    resume: vi.fn(() => {}),
    stop: vi.fn(() => {}),
    setAudio: vi.fn(() => {}),
    sendInput: vi.fn(() => {}),
    setSpeed: vi.fn(() => {}),
    capabilities: { rewind: false },
  } satisfies EmulatorEngine;
}

beforeEach(async () => {
  await closeDB();
  await new Promise<void>((res, rej) => {
    const r = indexedDB.deleteDatabase("soli-boy");
    r.onsuccess = () => res();
    r.onblocked = () => res();
    r.onerror = () => rej(r.error);
  });
});

describe("flusso carica → avvia → audio (integrazione)", () => {
  it("importa una ROM GB, la ritrova in libreria, la avvia e regola l'audio", async () => {
    // 1. carica (FileLoader → importRom → StoragePort/IndexedDB)
    const res = await importRom("super-mario-land.gb", new Blob(["ROMDATA"]), indexedDbStorage);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // 2. la ROM è persistita e ripresentabile in libreria
    const lib = await listRoms();
    expect(lib).toHaveLength(1);
    expect(lib[0]).toMatchObject({ title: "super-mario-land", platform: "GB", core: "gambatte" });
    const stored = await getRom(res.id);
    expect(stored?.fileBlob).toBeInstanceOf(Blob);

    // 3. risoluzione core + avvio
    const resolved = resolveCore(lib[0].title + ".gb");
    expect(resolved).toEqual({ platform: "GB", core: "gambatte" });

    const engine = fakeEngine();
    const wrapper = new CoreWrapper(engine);
    await wrapper.load({ rom: stored!.fileBlob, core: lib[0].core });
    wrapper.start();
    expect(wrapper.currentState).toBe("running");

    // 4. controllo audio (US-015)
    wrapper.setAudio({ volume: 0.8, mute: false });
    expect(engine.setAudio).toHaveBeenCalledWith({ volume: 0.8, mute: false });
  });

  it("una ROM non supportata non entra in libreria", async () => {
    const res = await importRom("game.nes", new Blob(["x"]), indexedDbStorage);
    expect(res.ok).toBe(false);
    expect(await listRoms()).toHaveLength(0);
  });
});
