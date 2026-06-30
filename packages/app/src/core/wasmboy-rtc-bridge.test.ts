// TSK-133 — WasmBoyRtcBridge: unit test (detection header + round-trip MBC3).
// Mocka `wasmboy` con saveState/loadState controllabili dal test, in modo da
// esercitare deterministicamente l'encoding/decoding RTC senza dipendere dal
// vero binding WASM Gambatte (per quello vedi e2e Pokémon GBC, TSK-132 §12-13).
import { beforeEach, describe, expect, it, vi } from "vitest";

// Stato del mock condiviso col factory (hoisted): rappresenta il "buffer
// interno" che la lib WasmBoy serializza in `wasmBoyInternalState`. I test
// possono ispezionarlo per asserire l'effetto di `setRtcState`.
const lib = vi.hoisted(() => ({
  // Lunghezza generosa: deve essere ≥ MBC3_BLOCK_MIN_LEN (5 + 8 = 13).
  internalState: new Uint8Array(64),
}));

vi.mock("wasmboy", () => {
  const WasmBoy = {
    saveState: vi.fn(async () => ({
      wasmboyMemory: {
        // Ritorniamo una *copia* per simulare il comportamento "snapshot
        // immutabile" della lib reale (vedi wasmboy.ts.esm.js getSaveState).
        wasmBoyInternalState: new Uint8Array(lib.internalState),
      },
      date: 0,
      isAuto: false,
    })),
    loadState: vi.fn(async (state: { wasmboyMemory?: { wasmBoyInternalState?: Uint8Array } }) => {
      const next = state.wasmboyMemory?.wasmBoyInternalState;
      if (next instanceof Uint8Array) {
        lib.internalState = new Uint8Array(next);
      }
    }),
  };
  return { WasmBoy };
});

import { WasmBoy } from "wasmboy";
import {
  WasmBoyRtcBridge,
  isMbc3RtcCartridge,
  rtcStateToEpochUtc,
  epochUtcToRtcState,
  encodeMbc3Registers,
  decodeMbc3Registers,
  sanityCheckOffsets,
} from "./wasmboy-rtc-bridge";
import type { RtcState } from "../domain/rtc-service";

beforeEach(() => {
  lib.internalState = new Uint8Array(64);
  vi.clearAllMocks();
});

describe("WasmBoyRtcBridge — detection cartuccia (ADR-009 §1)", () => {
  it("hasRtc(0x0F) === true (MBC3+TIMER+BATTERY, es. Pokémon Oro/Argento)", () => {
    const bridge = new WasmBoyRtcBridge(WasmBoy, 0x0f);
    expect(bridge.hasRtc()).toBe(true);
  });

  it("hasRtc(0x10) === true (MBC3+TIMER+RAM+BATTERY, es. Pokémon Cristallo)", () => {
    const bridge = new WasmBoyRtcBridge(WasmBoy, 0x10);
    expect(bridge.hasRtc()).toBe(true);
  });

  it("hasRtc(0x13) === false (MBC3+RAM+BATTERY, senza timer)", () => {
    const bridge = new WasmBoyRtcBridge(WasmBoy, 0x13);
    expect(bridge.hasRtc()).toBe(false);
  });

  it("hasRtc(0x00) === false (ROM-only)", () => {
    const bridge = new WasmBoyRtcBridge(WasmBoy, 0x00);
    expect(bridge.hasRtc()).toBe(false);
  });

  it("isMbc3RtcCartridge helper coincide con hasRtc", () => {
    expect(isMbc3RtcCartridge(0x0f)).toBe(true);
    expect(isMbc3RtcCartridge(0x10)).toBe(true);
    expect(isMbc3RtcCartridge(0x13)).toBe(false);
  });
});

describe("WasmBoyRtcBridge — helpers pure (UTC ↔ epoch ↔ MBC3)", () => {
  it("rtcStateToEpochUtc ∘ epochUtcToRtcState è identità su RtcState validi", () => {
    const states: RtcState[] = [
      { year: 2000, month: 1, day: 1, hour: 0, minute: 0, second: 0 },
      { year: 2024, month: 2, day: 29, hour: 23, minute: 59, second: 59 }, // bisestile
      { year: 2099, month: 12, day: 31, hour: 12, minute: 34, second: 56 },
    ];
    for (const s of states) {
      const epoch = rtcStateToEpochUtc(s);
      expect(epochUtcToRtcState(epoch)).toEqual(s);
    }
  });

  it("encode → decode MBC3 è identità sul wall-clock (latch a mezzanotte / day=0)", () => {
    const states: RtcState[] = [
      { year: 2000, month: 1, day: 1, hour: 0, minute: 0, second: 0 },
      { year: 2025, month: 6, day: 15, hour: 13, minute: 45, second: 30 },
      { year: 2099, month: 12, day: 31, hour: 23, minute: 59, second: 59 },
    ];
    for (const s of states) {
      const enc = encodeMbc3Registers(s);
      // Sanity: S/M/H riflettono l'orario del giorno; day counter = 0; halt off.
      expect(enc.s).toBe(s.second);
      expect(enc.m).toBe(s.minute);
      expect(enc.h).toBe(s.hour);
      expect(enc.dl).toBe(0);
      expect(enc.dh).toBe(0);
      const dec = decodeMbc3Registers(enc);
      expect(dec).toEqual(s);
    }
  });

  it("decode con day counter > 0 e bit high di DH avanza la data correttamente", () => {
    // latchedTime = 2025-01-01T00:00:00Z; day=257 (0x101) → 2025-09-15.
    const latchedTime = Math.floor(Date.UTC(2025, 0, 1, 0, 0, 0) / 1000);
    const dec = decodeMbc3Registers({
      s: 30,
      m: 45,
      h: 13,
      dl: 0x01, // low byte day = 1
      dh: 0x01, // high bit day = 1 → counter = 257
      latchedTime,
    });
    const expected = epochUtcToRtcState(latchedTime + 257 * 86400 + 13 * 3600 + 45 * 60 + 30);
    expect(dec).toEqual(expected);
  });

  it("sanityCheckOffsets() solleva errore leggibile su buffer troppo corto", () => {
    expect(() => sanityCheckOffsets(new Uint8Array(4))).toThrow(
      /wasmBoyInternalState troppo corto/,
    );
    // Soglia: 5 byte registri + 8 byte latchedTime = 13.
    expect(() => sanityCheckOffsets(new Uint8Array(13))).not.toThrow();
    expect(() => sanityCheckOffsets(undefined)).toThrow();
  });
});

describe("WasmBoyRtcBridge — round-trip setRtcState → getRtcState (cache write-through)", () => {
  it("dopo setRtcState la getRtcState ritorna lo stesso state (cache write-through)", () => {
    const bridge = new WasmBoyRtcBridge(WasmBoy, 0x0f);
    const target: RtcState = {
      year: 2025,
      month: 6,
      day: 30,
      hour: 12,
      minute: 34,
      second: 56,
    };
    bridge.setRtcState(target);
    expect(bridge.getRtcState()).toEqual(target);
  });

  it("round-trip via WasmBoy.saveState/loadState mock: setRtcState patcha internalState; refresh() decodifica lo stesso state", async () => {
    const bridge = new WasmBoyRtcBridge(WasmBoy, 0x0f);
    const target: RtcState = {
      year: 2026,
      month: 6,
      day: 30,
      hour: 12,
      minute: 34,
      second: 56,
    };
    // Awaitiamo la pipeline interna invece di lasciarla fire-and-forget per
    // asserire deterministicamente sul ciclo saveState → patch → loadState.
    await bridge.applySetAsync(target);
    expect(WasmBoy.saveState).toHaveBeenCalled();
    expect(WasmBoy.loadState).toHaveBeenCalled();
    // Lo stato interno del mock è stato sovrascritto dal loadState patched.
    // Ora refresh() rilegge via saveState e decodifica il blocco RTC.
    const decoded = await bridge.refresh();
    expect(decoded).toEqual(target);
  });

  it("setRtcState è no-op su cartuccia senza RTC (hasRtc=false)", () => {
    const bridge = new WasmBoyRtcBridge(WasmBoy, 0x13);
    bridge.setRtcState({
      year: 2025,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
    });
    expect(bridge.getRtcState()).toBeNull();
    expect(WasmBoy.saveState).not.toHaveBeenCalled();
    expect(WasmBoy.loadState).not.toHaveBeenCalled();
  });

  it("getRtcState ritorna null su cartuccia senza RTC", () => {
    const bridge = new WasmBoyRtcBridge(WasmBoy, 0x00);
    expect(bridge.getRtcState()).toBeNull();
  });

  it("refresh ritorna null e non chiama saveState su cartuccia senza RTC", async () => {
    const bridge = new WasmBoyRtcBridge(WasmBoy, 0x00);
    expect(await bridge.refresh()).toBeNull();
    expect(WasmBoy.saveState).not.toHaveBeenCalled();
  });

  it("setRtcState non muta il riferimento del buffer restituito da saveState (immutability)", async () => {
    const bridge = new WasmBoyRtcBridge(WasmBoy, 0x0f);
    // Cattura il primo snapshot per verificare immutabilità del riferimento.
    const before = await WasmBoy.saveState();
    const beforeRef = before.wasmboyMemory.wasmBoyInternalState;
    await bridge.applySetAsync({
      year: 2025,
      month: 6,
      day: 15,
      hour: 10,
      minute: 0,
      second: 0,
    });
    // Il buffer originario deve essere immutato: il bridge lavora su una copia.
    expect(beforeRef).toBeInstanceOf(Uint8Array);
    for (let i = 0; i < 13; i++) {
      expect((beforeRef as Uint8Array)[i]).toBe(0);
    }
  });
});
