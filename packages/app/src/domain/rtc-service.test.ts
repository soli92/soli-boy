// TSK-125 — RtcService: copertura DoD (ADR-009, US-065).
// Verifica:
//  - hasRtc discrimina GB/GBC vs GBA/arcade.
//  - validateRtcState rifiuta valori fuori range e accetta stato valido.
//  - getRtcState/setRtcState delegano correttamente al bridge.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hasRtc,
  RtcService,
  type RtcBridge,
  type RtcState,
} from "./rtc-service";

// F-01 (review iter-1): factory helper a scope-file per evitare duplicazione fra
// i blocchi `describe`. Espone `hasRtc/getRtcState/setRtcState` come mock vi.fn,
// così i test possono asserire chiamate e contenuti senza re-implementare lo stub.
function makeBridge(initial: RtcState | null = null): RtcBridge & {
  hasRtc: ReturnType<typeof vi.fn>;
  getRtcState: ReturnType<typeof vi.fn>;
  setRtcState: ReturnType<typeof vi.fn>;
} {
  let current: RtcState | null = initial;
  return {
    // ADR-009 §4 — detection runtime per-cartuccia. Default true: i test che
    // verificano lo scenario "no RTC" possono sovrascrivere il mock se serve.
    hasRtc: vi.fn(() => true),
    getRtcState: vi.fn(() => current),
    setRtcState: vi.fn((s: RtcState) => {
      current = s;
    }),
  };
}

describe("hasRtc (capability per piattaforma — fallback conservativo ADR-009)", () => {
  it("ritorna true per 'gb'", () => {
    expect(hasRtc("gb")).toBe(true);
  });

  it("ritorna true per 'gbc'", () => {
    expect(hasRtc("gbc")).toBe(true);
  });

  it("ritorna false per 'gba' (RTC è cartuccia-specifico, non piattaforma)", () => {
    expect(hasRtc("gba")).toBe(false);
  });

  it("ritorna false per 'arcade'", () => {
    expect(hasRtc("arcade")).toBe(false);
  });

  it("ritorna false per piattaforme sconosciute (fallback conservativo)", () => {
    expect(hasRtc("nes")).toBe(false);
    expect(hasRtc("")).toBe(false);
    expect(hasRtc("GB")).toBe(false); // case-sensitive: la mappa canonica usa lowercase
  });
});

describe("RtcService.validateRtcState (range numerici, non calendar)", () => {
  const validState: RtcState = {
    year: 2026,
    month: 6,
    day: 30,
    hour: 12,
    minute: 0,
    second: 0,
  };

  it("accetta uno stato valido (2026-06-30 12:00:00)", () => {
    expect(RtcService.validateRtcState(validState)).toBe(true);
  });

  it("rifiuta mese=13 (fuori range [1,12])", () => {
    expect(RtcService.validateRtcState({ ...validState, month: 13 })).toBe(false);
  });

  it("rifiuta giorno=32 (fuori range [1,31])", () => {
    expect(RtcService.validateRtcState({ ...validState, day: 32 })).toBe(false);
  });

  it("rifiuta ora=24 (fuori range [0,23])", () => {
    expect(RtcService.validateRtcState({ ...validState, hour: 24 })).toBe(false);
  });

  it("rifiuta anno < 2000 (sanity post-Y2K)", () => {
    expect(RtcService.validateRtcState({ ...validState, year: 1999 })).toBe(false);
  });

  it("rifiuta mese=0 (lower bound)", () => {
    expect(RtcService.validateRtcState({ ...validState, month: 0 })).toBe(false);
  });

  it("rifiuta giorno=0 (lower bound)", () => {
    expect(RtcService.validateRtcState({ ...validState, day: 0 })).toBe(false);
  });

  it("rifiuta minuto=60 / secondo=60 (upper bound esclusivo)", () => {
    expect(RtcService.validateRtcState({ ...validState, minute: 60 })).toBe(false);
    expect(RtcService.validateRtcState({ ...validState, second: 60 })).toBe(false);
  });

  it("accetta i bound estremi (mese=1, giorno=1, ora=0, minuto=0, secondo=0)", () => {
    expect(
      RtcService.validateRtcState({
        year: 2000,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
      }),
    ).toBe(true);
  });

  it("accetta i bound estremi (mese=12, giorno=31, ora=23, minuto=59, secondo=59)", () => {
    expect(
      RtcService.validateRtcState({
        year: 9999,
        month: 12,
        day: 31,
        hour: 23,
        minute: 59,
        second: 59,
      }),
    ).toBe(true);
  });
});

describe("RtcService.getRtcState / setRtcState (delega al bridge)", () => {
  it("getRtcState ritorna il valore esposto dal bridge", () => {
    const state: RtcState = {
      year: 2026,
      month: 6,
      day: 30,
      hour: 12,
      minute: 0,
      second: 0,
    };
    const bridge = makeBridge(state);
    const result = RtcService.getRtcState(bridge);
    expect(result).toEqual(state);
    expect(bridge.getRtcState).toHaveBeenCalledTimes(1);
  });

  it("getRtcState ritorna null se il bridge non ha RTC attivo", () => {
    const bridge = makeBridge(null);
    expect(RtcService.getRtcState(bridge)).toBeNull();
  });

  it("setRtcState invoca bridge.setRtcState con lo stato passato (passthrough)", () => {
    const bridge = makeBridge(null);
    const state: RtcState = {
      year: 2026,
      month: 6,
      day: 30,
      hour: 12,
      minute: 0,
      second: 0,
    };
    RtcService.setRtcState(bridge, state);
    expect(bridge.setRtcState).toHaveBeenCalledTimes(1);
    expect(bridge.setRtcState).toHaveBeenCalledWith(state);
    // Il bridge ha realmente registrato lo stato (sanity).
    expect(bridge.getRtcState()).toEqual(state);
  });
});

// TSK-130 — syncToDevice: allineamento all'orologio del dispositivo (US-068).
// ADR-009 §5: RtcState è wall-clock UTC; syncToDevice usa `getUTC*` su `new Date()`.
// RNF-05/RNF-06: nessuna chiamata di rete, solo clock locale.
describe("RtcService.syncToDevice (US-068, ADR-009 §5)", () => {
  // F-04 (review iter-1): cattura i globali di rete PRIMA di ogni override e
  // li ripristina in afterEach, così il test "NON effettua chiamate di rete"
  // non contamina i test successivi (jsdom espone `fetch`/`XMLHttpRequest`
  // sul globalThis del worker; senza restore restano stub vi.fn).
  const originalFetch = globalThis.fetch;
  const originalXHR = globalThis.XMLHttpRequest;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    globalThis.XMLHttpRequest = originalXHR;
  });

  it("chiama bridge.setRtcState con uno stato UTC coerente con `new Date()`", () => {
    // Fixed time: 2026-06-30 14:25:37 UTC.
    const fixed = new Date(Date.UTC(2026, 5, 30, 14, 25, 37));
    vi.setSystemTime(fixed);

    const bridge = makeBridge(null);
    RtcService.syncToDevice(bridge);

    expect(bridge.setRtcState).toHaveBeenCalledTimes(1);
    expect(bridge.setRtcState).toHaveBeenCalledWith({
      year: 2026,
      month: 6, // getUTCMonth()=5 + 1
      day: 30,
      hour: 14,
      minute: 25,
      second: 37,
    });
  });

  it("usa la semantica UTC (non locale): mese=1, giorno=1 a mezzanotte UTC del 1° gennaio", () => {
    // Edge: 2026-01-01 00:00:00 UTC (in fusi negativi sarebbe ancora 2025 locale).
    const fixed = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    vi.setSystemTime(fixed);

    const bridge = makeBridge(null);
    RtcService.syncToDevice(bridge);

    // Verifica con getUTC* dell'istanza fixed (assertion stack-agnostica rispetto al TZ host).
    expect(bridge.setRtcState).toHaveBeenCalledWith({
      year: fixed.getUTCFullYear(),
      month: fixed.getUTCMonth() + 1,
      day: fixed.getUTCDate(),
      hour: fixed.getUTCHours(),
      minute: fixed.getUTCMinutes(),
      second: fixed.getUTCSeconds(),
    });
    expect(bridge.setRtcState).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2026, month: 1, day: 1, hour: 0 }),
    );
  });

  it("produce uno stato che passa validateRtcState (sanity dominio)", () => {
    const fixed = new Date(Date.UTC(2026, 5, 30, 14, 25, 37));
    vi.setSystemTime(fixed);

    const bridge = makeBridge(null);
    RtcService.syncToDevice(bridge);

    const applied = bridge.setRtcState.mock.calls[0][0] as RtcState;
    expect(RtcService.validateRtcState(applied)).toBe(true);
  });

  it("è no-op se bridge è null (guard ADR-009 §4 — engine senza RTC)", () => {
    // Non deve sollevare; non c'è nulla da osservare oltre l'assenza di throw.
    expect(() => RtcService.syncToDevice(null)).not.toThrow();
  });

  it("è no-op se bridge è undefined (guard difensivo)", () => {
    expect(() => RtcService.syncToDevice(undefined)).not.toThrow();
  });

  it("NON effettua chiamate di rete (no fetch / no XMLHttpRequest)", () => {
    // Spy su API di rete globali; syncToDevice non deve toccarle (RNF-05/RNF-06).
    const fetchSpy = vi.fn();
    const xhrSpy = vi.fn();
    globalThis.fetch = fetchSpy;
    // @ts-expect-error — override globale solo per asserzione.
    globalThis.XMLHttpRequest = xhrSpy;

    const fixed = new Date(Date.UTC(2026, 5, 30, 14, 25, 37));
    vi.setSystemTime(fixed);

    const bridge = makeBridge(null);
    RtcService.syncToDevice(bridge);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
  });
});
