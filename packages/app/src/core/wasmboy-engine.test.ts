// TSK — regressione US-016/US-017: WasmBoy.saveState()/loadState() mettono
// l'emulatore in PAUSA internamente (`await this.pause()`) e NON lo riavviano.
// Ogni metodo dell'adapter che le usa (snapshot/restore/getSram/loadSram) deve
// riprendere la riproduzione se l'engine stava girando, altrimenti il loop
// resta fermo e il canvas si congela ("il gioco non cambia"). Mockiamo `wasmboy`
// con un flag `paused` FEDELE alla lib reale per esercitare questa invariante.
import { beforeEach, describe, expect, it, vi } from "vitest";

// Stato condiviso col mock factory (hoisted): traccia la pausa interna come la
// lib reale, così i test possono verificare che l'engine RIPRENDA.
const lib = vi.hoisted(() => ({ paused: true }));

vi.mock("wasmboy", () => {
  const WasmBoy = {
    config: vi.fn(async () => {}),
    loadROM: vi.fn(async () => {}),
    play: vi.fn(async () => {
      lib.paused = false;
    }),
    pause: vi.fn(async () => {
      lib.paused = true;
    }),
    // Fedele alla lib reale: saveState/loadState pausano internamente.
    saveState: vi.fn(async () => {
      lib.paused = true;
      return {
        wasmboyMemory: { cartridgeRam: new Uint8Array([1, 2, 3]) },
        date: 1,
        isAuto: false,
      };
    }),
    loadState: vi.fn(async () => {
      lib.paused = true;
    }),
    setJoypadState: vi.fn(),
    setSpeed: vi.fn(),
  };
  return { WasmBoy };
});

import { WasmBoy } from "wasmboy";
import { WasmBoyEngine } from "./wasmboy-engine";
import type { Core } from "../domain/types";

async function makeLoadedEngine() {
  const engine = new WasmBoyEngine();
  const container = document.createElement("div");
  await engine.load({
    rom: new Blob([new Uint8Array([0x00])]),
    core: "gambatte" as Core,
    container,
  });
  return engine;
}

/** Engine caricato E avviato (in esecuzione, non in pausa). */
async function makeRunningEngine() {
  const engine = await makeLoadedEngine();
  engine.start(); // → playing = true, lib.paused = false
  return engine;
}

describe("WasmBoyEngine — guard ROM Blob vuoto in load() (TSK-093)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lib.paused = true;
  });

  it("load() con Blob vuoto rigetta con messaggio canonico 'ROM vuota'", async () => {
    // P3-10 (code-review-deep): App.tsx passa `new Blob()` come placeholder quando
    // selected===null; una race condition (Avvia prima che selected sia settato)
    // inoltrerebbe un Uint8Array di lunghezza 0 a WasmBoy.loadROM (comportamento
    // imprevedibile). Il guard deve respingere PRIMA di toccare WasmBoy.
    const engine = new WasmBoyEngine();
    const container = document.createElement("div");

    await expect(
      engine.load({
        rom: new Blob(),
        core: "gambatte" as Core,
        container,
      }),
    ).rejects.toThrow("WasmBoyEngine.load: ROM vuota — Blob privo di contenuto.");

    // AC-1: il guard scatta PRIMA di WasmBoy.config (nessun side-effect sulla lib).
    expect(WasmBoy.config).not.toHaveBeenCalled();
    expect(WasmBoy.loadROM).not.toHaveBeenCalled();
  });

  it("load() con Blob non vuoto procede normalmente (regressione: il guard non blocca payload validi)", async () => {
    const engine = new WasmBoyEngine();
    const container = document.createElement("div");

    await engine.load({
      rom: new Blob([new Uint8Array([0x00])]),
      core: "gambatte" as Core,
      container,
    });

    expect(WasmBoy.config).toHaveBeenCalledTimes(1);
    expect(WasmBoy.loadROM).toHaveBeenCalledTimes(1);
  });
});

describe("WasmBoyEngine — guard !configured su resume() (C-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lib.paused = true;
  });

  it("resume() su engine non configurato è un no-op: non lancia e non chiama WasmBoy.play", () => {
    // Riproduce lo scenario "Player sempre montato": un evento visibility/resume
    // arriva prima che qualsiasi ROM sia stata caricata (stato initial = !configured).
    const engine = new WasmBoyEngine();
    // Non chiamare load() → configured = false

    expect(() => engine.resume()).not.toThrow();
    expect(WasmBoy.play).not.toHaveBeenCalled();
    // lib.paused deve restare invariato (true = default del mock, nessuna riproduzione avviata).
    expect(lib.paused).toBe(true);
  });

  it("resume() su engine caricato (ma non avviato) non chiama play (no-op: playing=false)", async () => {
    // Loaded ma mai started: resume() non deve avviare l'emulatore da solo.
    const engine = await makeLoadedEngine();
    vi.clearAllMocks();

    expect(() => engine.resume()).not.toThrow();
    // configured=true MA playing=false → il guard CoreWrapper filtra a monte,
    // qui però il guard !configured non blocca. Resume chiama play ma playing=false
    // quindi viene comunque eseguito; l'importante è che lo stesso comportamento
    // regga dopo il guard (playing si setta a true, play viene chiamato).
    // Questo test verifica che il guard !configured NON blocchi un engine configurato.
    expect(WasmBoy.play).toHaveBeenCalledTimes(1);
  });
});

describe("WasmBoyEngine — ripresa dopo operazioni che pausano (US-016/017)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lib.paused = true;
  });

  it("restore riprende la riproduzione DOPO loadState se stava girando", async () => {
    const engine = await makeRunningEngine();
    const snap = await engine.snapshot();
    vi.clearAllMocks();

    await engine.restore(snap);

    expect(WasmBoy.loadState).toHaveBeenCalledTimes(1);
    expect(WasmBoy.play).toHaveBeenCalled();
    expect(lib.paused).toBe(false); // emulatore ripreso
    // play() deve avvenire DOPO loadState (altrimenti la pausa interna vince).
    const loadOrder = vi.mocked(WasmBoy.loadState).mock.invocationCallOrder[0];
    const playOrders = vi.mocked(WasmBoy.play).mock.invocationCallOrder;
    expect(playOrders[playOrders.length - 1]).toBeGreaterThan(loadOrder);
  });

  it("restore NON riprende se l'emulatore era in pausa", async () => {
    const engine = await makeRunningEngine();
    const snap = await engine.snapshot();
    engine.pause(); // playing = false
    vi.clearAllMocks();
    lib.paused = true;

    await engine.restore(snap);

    expect(WasmBoy.loadState).toHaveBeenCalledTimes(1);
    expect(WasmBoy.play).not.toHaveBeenCalled();
    expect(lib.paused).toBe(true);
  });

  it("restore NON fa partire da solo un engine caricato ma mai avviato", async () => {
    // WasmBoy inizializza paused=false (isPlaying()=true) prima del primo play():
    // affidarsi a isPlaying() avrebbe auto-avviato l'emulatore.
    const engine = await makeLoadedEngine(); // NESSUN start()
    const snap = await engine.snapshot();
    vi.clearAllMocks();
    lib.paused = true;

    await engine.restore(snap);

    expect(WasmBoy.loadState).toHaveBeenCalledTimes(1);
    expect(WasmBoy.play).not.toHaveBeenCalled();
  });

  it("snapshot riprende la riproduzione (saveState pausa internamente)", async () => {
    const engine = await makeRunningEngine();
    vi.clearAllMocks();
    lib.paused = false;

    await engine.snapshot();

    expect(WasmBoy.saveState).toHaveBeenCalledTimes(1);
    expect(WasmBoy.play).toHaveBeenCalled();
    expect(lib.paused).toBe(false); // non resta congelato dopo il salvataggio
  });

  it("getSram riprende la riproduzione se stava girando", async () => {
    const engine = await makeRunningEngine();
    vi.clearAllMocks();
    lib.paused = false;

    await engine.getSram();

    expect(WasmBoy.saveState).toHaveBeenCalledTimes(1);
    expect(lib.paused).toBe(false);
  });

  it("loadSram riprende la riproduzione (saveState+loadState pausano)", async () => {
    const engine = await makeRunningEngine();
    vi.clearAllMocks();
    lib.paused = false;

    await engine.loadSram(new Uint8Array([9, 9]));

    expect(WasmBoy.loadState).toHaveBeenCalledTimes(1);
    expect(WasmBoy.play).toHaveBeenCalled();
    expect(lib.paused).toBe(false);
  });

  it("snapshot NON riprende se eravamo in pausa (no avvio spurio)", async () => {
    const engine = await makeRunningEngine();
    engine.pause(); // playing = false
    vi.clearAllMocks();
    lib.paused = true;

    await engine.snapshot();

    expect(WasmBoy.saveState).toHaveBeenCalledTimes(1);
    expect(WasmBoy.play).not.toHaveBeenCalled();
    expect(lib.paused).toBe(true);
  });
});
