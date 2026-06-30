// TSK-128 — GameSession: copertura DoD (ADR-009 §4-5, US-066).
// Verifica:
//   - restoreOnStart: getRtcState chiamato, setRtcState applicato con lo stato.
//   - restoreOnStart: skip silenzioso se bridge null (stub WasmBoy/Mgba pre-Sprint16).
//   - restoreOnStart: nessuna chiamata a setRtcState se storage non ha entry.
//   - restoreOnStart: storage reject → console.warn + no throw a monte.
//   - persistOnStop: getRtcState dal bridge + putRtcState con stato corretto.
//   - persistOnStop: skip silenzioso se bridge null (no-op).
//   - persistOnStop: skip se bridge.getRtcState() ritorna null (cartuccia no-RTC).
//   - persistOnStop: storage reject → console.warn + no throw a monte.
//
// Mock minimalistici (no class StubRtcBridge per non accoppiare il test a
// scelte di Sprint 16): un oggetto literal con `getRtcState`/`setRtcState`
// soddisfa il contratto `RtcBridge`. Lo storage è mock vi.fn() che soddisfa
// `RtcStatePort` (segmentato — solo 3 ops, ADR-006 §Decisione p.2).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EmulatorEngine } from "../core/core-wrapper";
import type { RtcStatePort } from "../storage/port";
import { GameSession } from "./game-session";
import type { RtcBridge, RtcState } from "./rtc-service";

/**
 * Engine fittizio minimale: GameSession in questo TSK legge SOLO
 * `engine.rtcBridge`, quindi il resto dell'interfaccia EmulatorEngine è
 * irrilevante. Castiamo a `EmulatorEngine` per soddisfare la firma senza
 * implementare i ~15 metodi non usati (sarebbe rumore senza valore).
 */
function makeEngine(rtcBridge: RtcBridge | null): EmulatorEngine {
  return { rtcBridge } as unknown as EmulatorEngine;
}

/**
 * Storage mock segmentato a `RtcStatePort` (le altre porte non sono toccate
 * dalla GameSession in questo TSK). vi.fn() consente sia il default async
 * (`mockResolvedValue`) sia il reject (`mockRejectedValue`) per i path
 * best-effort.
 */
function makeStorage(): RtcStatePort & {
  putRtcState: ReturnType<typeof vi.fn>;
  getRtcState: ReturnType<typeof vi.fn>;
  deleteRtcState: ReturnType<typeof vi.fn>;
} {
  return {
    putRtcState: vi.fn().mockResolvedValue(undefined),
    getRtcState: vi.fn().mockResolvedValue(null),
    deleteRtcState: vi.fn().mockResolvedValue(undefined),
  };
}

const ROM_ID = "rom-pokemon-crystal-gbc";

function sampleState(overrides: Partial<RtcState> = {}): RtcState {
  return {
    year: 2026,
    month: 6,
    day: 30,
    hour: 12,
    minute: 34,
    second: 56,
    ...overrides,
  };
}

// Silenzia `console.warn` nei branch best-effort: i test verificano comunque
// che sia stato CHIAMATO (assertion esplicita), così l'assenza di warn nei
// path felici resta visibile in caso di regressione.
let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  warnSpy.mockRestore();
  vi.restoreAllMocks();
});

describe("GameSession.restoreOnStart (ADR-009 §4 restore-on-start)", () => {
  it("legge lo stato persistito e lo applica al bridge via setRtcState", async () => {
    const persisted = sampleState({ year: 2027, hour: 23 });
    const setRtcState = vi.fn();
    const bridge: RtcBridge = {
      hasRtc: vi.fn().mockReturnValue(true),
      getRtcState: vi.fn().mockReturnValue(null),
      setRtcState,
    };
    const engine = makeEngine(bridge);
    const storage = makeStorage();
    storage.getRtcState.mockResolvedValueOnce(persisted);

    await GameSession.restoreOnStart({ engine, storage, romId: ROM_ID });

    expect(storage.getRtcState).toHaveBeenCalledTimes(1);
    expect(storage.getRtcState).toHaveBeenCalledWith(ROM_ID);
    expect(setRtcState).toHaveBeenCalledTimes(1);
    expect(setRtcState).toHaveBeenCalledWith(persisted);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("skip silenzioso se engine.rtcBridge è null (stub pre-Sprint16): nessuna chiamata storage", async () => {
    const engine = makeEngine(null);
    const storage = makeStorage();

    await GameSession.restoreOnStart({ engine, storage, romId: ROM_ID });

    expect(storage.getRtcState).not.toHaveBeenCalled();
    expect(storage.putRtcState).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("nessuna chiamata a setRtcState se lo storage non ha entry (prima sessione)", async () => {
    const setRtcState = vi.fn();
    const bridge: RtcBridge = {
      hasRtc: vi.fn().mockReturnValue(true),
      getRtcState: vi.fn().mockReturnValue(null),
      setRtcState,
    };
    const engine = makeEngine(bridge);
    const storage = makeStorage();
    storage.getRtcState.mockResolvedValueOnce(null);

    await GameSession.restoreOnStart({ engine, storage, romId: ROM_ID });

    expect(storage.getRtcState).toHaveBeenCalledWith(ROM_ID);
    expect(setRtcState).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("storage.getRtcState reject → console.warn + best-effort (no throw a monte)", async () => {
    const setRtcState = vi.fn();
    const bridge: RtcBridge = {
      hasRtc: vi.fn().mockReturnValue(true),
      getRtcState: vi.fn(),
      setRtcState,
    };
    const engine = makeEngine(bridge);
    const storage = makeStorage();
    storage.getRtcState.mockRejectedValueOnce(new Error("IDB transaction aborted"));

    await expect(
      GameSession.restoreOnStart({ engine, storage, romId: ROM_ID }),
    ).resolves.toBeUndefined();

    expect(setRtcState).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    // Il messaggio cita il romId (utile per debug runtime).
    expect(String(warnSpy.mock.calls[0][0])).toContain(ROM_ID);
  });

  it("bridge.setRtcState throw → console.warn + best-effort (no throw a monte)", async () => {
    const setRtcState = vi.fn().mockImplementation(() => {
      throw new Error("bridge crash (es. cartuccia mis-routed)");
    });
    const bridge: RtcBridge = {
      hasRtc: vi.fn().mockReturnValue(true),
      getRtcState: vi.fn(),
      setRtcState,
    };
    const engine = makeEngine(bridge);
    const storage = makeStorage();
    storage.getRtcState.mockResolvedValueOnce(sampleState());

    await expect(
      GameSession.restoreOnStart({ engine, storage, romId: ROM_ID }),
    ).resolves.toBeUndefined();

    expect(setRtcState).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe("GameSession.persistOnStop (ADR-009 §4 persist-on-stop)", () => {
  it("legge dal bridge e persiste via putRtcState con lo stato corretto", async () => {
    const current = sampleState({ year: 2030, minute: 0 });
    const bridge: RtcBridge = {
      hasRtc: vi.fn().mockReturnValue(true),
      getRtcState: vi.fn().mockReturnValue(current),
      setRtcState: vi.fn(),
    };
    const engine = makeEngine(bridge);
    const storage = makeStorage();

    await GameSession.persistOnStop({ engine, storage, romId: ROM_ID });

    expect(bridge.getRtcState).toHaveBeenCalledTimes(1);
    expect(storage.putRtcState).toHaveBeenCalledTimes(1);
    expect(storage.putRtcState).toHaveBeenCalledWith(ROM_ID, current);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("skip silenzioso se engine.rtcBridge è null (stub pre-Sprint16): no-op", async () => {
    const engine = makeEngine(null);
    const storage = makeStorage();

    await GameSession.persistOnStop({ engine, storage, romId: ROM_ID });

    expect(storage.putRtcState).not.toHaveBeenCalled();
    expect(storage.getRtcState).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("skip se bridge.getRtcState ritorna null (cartuccia senza RTC / non-latched)", async () => {
    const bridge: RtcBridge = {
      hasRtc: vi.fn().mockReturnValue(true),
      getRtcState: vi.fn().mockReturnValue(null),
      setRtcState: vi.fn(),
    };
    const engine = makeEngine(bridge);
    const storage = makeStorage();

    await GameSession.persistOnStop({ engine, storage, romId: ROM_ID });

    expect(bridge.getRtcState).toHaveBeenCalledTimes(1);
    expect(storage.putRtcState).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("storage.putRtcState reject → console.warn + best-effort (lo stop procede)", async () => {
    const current = sampleState();
    const bridge: RtcBridge = {
      hasRtc: vi.fn().mockReturnValue(true),
      getRtcState: vi.fn().mockReturnValue(current),
      setRtcState: vi.fn(),
    };
    const engine = makeEngine(bridge);
    const storage = makeStorage();
    storage.putRtcState.mockRejectedValueOnce(new Error("IDB quota exceeded"));

    await expect(
      GameSession.persistOnStop({ engine, storage, romId: ROM_ID }),
    ).resolves.toBeUndefined();

    expect(storage.putRtcState).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain(ROM_ID);
  });

  it("bridge.getRtcState throw → console.warn + best-effort (no throw a monte)", async () => {
    const bridge: RtcBridge = {
      hasRtc: vi.fn().mockReturnValue(true),
      getRtcState: vi.fn().mockImplementation(() => {
        throw new Error("bridge crash (es. lib mGBA non inizializzata)");
      }),
      setRtcState: vi.fn(),
    };
    const engine = makeEngine(bridge);
    const storage = makeStorage();

    await expect(
      GameSession.persistOnStop({ engine, storage, romId: ROM_ID }),
    ).resolves.toBeUndefined();

    expect(storage.putRtcState).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
