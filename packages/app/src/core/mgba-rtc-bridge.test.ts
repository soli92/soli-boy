// TSK-134 — Unit test MgbaRtcBridge (ADR-009 §4).
//
// Copertura:
//  - `hasRtc()` distingue Game Code RTC (es. "AXVE" Pokémon Ruby) da non-RTC
//    (es. "BPRE" Pokémon FireRed) leggendo l'header ROM offset 0xAC..0xAF.
//  - Round-trip BCD: `setRtcState(state)` → `getRtcState()` ≡ state, con mock
//    di `MgbaModule.saveState/loadState/FS` che simula un blob save state con
//    marker `"RTC "` + 7 byte BCD.
//  - `zellerCongruence` su date note (sanity check).
//  - `toBcd` / `fromBcd` round-trip su tutti i valori 0..99.

import { describe, expect, it, vi } from "vitest";
import {
  fromBcd,
  MgbaRtcBridge,
  toBcd,
  zellerCongruence,
  type MgbaModule,
} from "./mgba-rtc-bridge";
import type { RtcState } from "../domain/rtc-service";

const GAME_CODE_OFFSET = 0xac;
const ROM_HEADER_MIN = 0xc0; // copre Game Code + qualche byte di header

/**
 * Costruisce un Uint8Array che simula una ROM GBA con il Game Code dato a
 * offset 0xAC..0xAF. Il resto dell'header è zero-filled (non rilevante per
 * `hasRtc()`).
 */
function makeRomWithGameCode(code: string): Uint8Array {
  const rom = new Uint8Array(ROM_HEADER_MIN);
  for (let i = 0; i < 4; i++) {
    rom[GAME_CODE_OFFSET + i] = code.charCodeAt(i);
  }
  return rom;
}

/**
 * Marker `"RTC "` (4 byte ASCII, T,R,C,space) coerente con `RTC_MARKER` nel
 * bridge — usato per costruire blob save state simulati nei test.
 */
const RTC_MARKER = new Uint8Array([0x52, 0x54, 0x43, 0x20]);

/**
 * Costruisce un blob save state simulato con marker `"RTC "` + 7 byte BCD.
 * Il blob è preceduto/seguito da padding random per validare la scansione
 * lineare del marker (non assume offset fisso).
 */
function makeSaveStateBlob(bcd: number[]): Uint8Array {
  const prefix = new Uint8Array([0x56, 0x42, 0x41, 0x6d, 0x01, 0x00]); // "VBAm" + version
  const suffix = new Uint8Array([0xff, 0xff, 0xff]); // padding dopo
  const out = new Uint8Array(
    prefix.length + RTC_MARKER.length + bcd.length + suffix.length,
  );
  let o = 0;
  out.set(prefix, o);
  o += prefix.length;
  out.set(RTC_MARKER, o);
  o += RTC_MARKER.length;
  out.set(bcd, o);
  o += bcd.length;
  out.set(suffix, o);
  return out;
}

/**
 * Mock `MgbaModule` con stato in-memory: simula `FS.readFile`/`writeFile` su
 * uno store mappa<path, Uint8Array>; `saveState/loadState` sono no-op booleane
 * (lo stato hardware è implicito nel contenuto del file). Sufficiente per
 * esercitare il round-trip BCD del bridge.
 */
function makeMockModule(opts: {
  romPath?: string;
  romBytes?: Uint8Array;
  saveStateBlob?: Uint8Array;
}): {
  module: MgbaModule;
  files: Map<string, Uint8Array>;
  saveStateCalls: number;
  loadStateCalls: number;
} {
  const files = new Map<string, Uint8Array>();
  const romPath = opts.romPath ?? "/data/games/game.gba";
  if (opts.romBytes) files.set(romPath, opts.romBytes);
  // Il save state path è derivato da gameName via `saveStateFilePath`:
  // dir + "/" + stem + ".ss0" → "/data/states/game.ss0"
  const saveStatePath = "/data/states/game.ss0";
  if (opts.saveStateBlob) files.set(saveStatePath, opts.saveStateBlob);

  const counters = { saveStateCalls: 0, loadStateCalls: 0 };

  const module: MgbaModule = {
    saveState: (_slot: number) => {
      counters.saveStateCalls += 1;
      // Mantieni il blob esistente (se preesistente, simula uno snapshot idempotente).
      return files.has(saveStatePath);
    },
    loadState: (_slot: number) => {
      counters.loadStateCalls += 1;
      return files.has(saveStatePath);
    },
    filePaths: () => ({
      gamePath: "/data/games",
      savePath: "/data/saves",
      saveStatePath: "/data/states",
    }),
    gameName: romPath,
    FS: {
      readFile: (path: string) => {
        const f = files.get(path);
        if (!f) throw new Error(`ENOENT: ${path}`);
        return f;
      },
      writeFile: (path: string, data: Uint8Array | string) => {
        if (typeof data === "string") {
          files.set(path, new TextEncoder().encode(data));
        } else {
          files.set(path, new Uint8Array(data));
        }
      },
    },
  };

  return {
    module,
    files,
    get saveStateCalls() {
      return counters.saveStateCalls;
    },
    get loadStateCalls() {
      return counters.loadStateCalls;
    },
  };
}

describe("MgbaRtcBridge.hasRtc (TSK-134, ADR-009 §4 Opzione A)", () => {
  it("ritorna true per Game Code RTC noto (AXVE = Pokémon Ruby US)", () => {
    const { module } = makeMockModule({
      romBytes: makeRomWithGameCode("AXVE"),
    });
    const bridge = new MgbaRtcBridge(module);
    expect(bridge.hasRtc()).toBe(true);
  });

  it("ritorna true per Pokémon Emerald (BPEE)", () => {
    const { module } = makeMockModule({
      romBytes: makeRomWithGameCode("BPEE"),
    });
    const bridge = new MgbaRtcBridge(module);
    expect(bridge.hasRtc()).toBe(true);
  });

  it("ritorna true per Boktai (U3IE)", () => {
    const { module } = makeMockModule({
      romBytes: makeRomWithGameCode("U3IE"),
    });
    const bridge = new MgbaRtcBridge(module);
    expect(bridge.hasRtc()).toBe(true);
  });

  it("ritorna false per Game Code non-RTC (BPRE = Pokémon FireRed)", () => {
    const { module } = makeMockModule({
      romBytes: makeRomWithGameCode("BPRE"),
    });
    const bridge = new MgbaRtcBridge(module);
    expect(bridge.hasRtc()).toBe(false);
  });

  it("ritorna false per Game Code non-RTC (AGBJ = generic)", () => {
    const { module } = makeMockModule({
      romBytes: makeRomWithGameCode("AGBJ"),
    });
    const bridge = new MgbaRtcBridge(module);
    expect(bridge.hasRtc()).toBe(false);
  });

  it("ritorna false se gameName non è settato (nessuna ROM caricata)", () => {
    const { module } = makeMockModule({});
    // makeMockModule popola gameName di default; rimuoviamolo per simulare no-rom.
    (module as { gameName?: string }).gameName = undefined;
    const bridge = new MgbaRtcBridge(module);
    expect(bridge.hasRtc()).toBe(false);
  });

  it("ritorna false se FS.readFile fallisce (ROM non leggibile)", () => {
    const { module } = makeMockModule({
      romPath: "/data/games/missing.gba",
      // niente romBytes → files non contiene il path
    });
    const bridge = new MgbaRtcBridge(module);
    expect(bridge.hasRtc()).toBe(false);
  });

  it("ritorna false se la ROM è troppo piccola per contenere l'header", () => {
    const { module } = makeMockModule({
      romBytes: new Uint8Array(16), // < 0xC0
    });
    const bridge = new MgbaRtcBridge(module);
    expect(bridge.hasRtc()).toBe(false);
  });
});

describe("MgbaRtcBridge.getRtcState / setRtcState — round-trip BCD (TSK-134)", () => {
  it("decodifica un save state con blocco RTC valido", () => {
    // BCD: year=24 (2024), month=06, day=15, dayOfWeek=6 (sab), hour=14, minute=30, second=45
    const blob = makeSaveStateBlob([
      toBcd(24),
      toBcd(6),
      toBcd(15),
      toBcd(6),
      toBcd(14),
      toBcd(30),
      toBcd(45),
    ]);
    const { module } = makeMockModule({
      romBytes: makeRomWithGameCode("AXVE"),
      saveStateBlob: blob,
    });
    const bridge = new MgbaRtcBridge(module);
    const state = bridge.getRtcState();
    expect(state).toEqual({
      year: 2024,
      month: 6,
      day: 15,
      hour: 14,
      minute: 30,
      second: 45,
    });
  });

  it("ritorna null se hasRtc è false (Game Code non-RTC)", () => {
    const { module } = makeMockModule({
      romBytes: makeRomWithGameCode("BPRE"),
      saveStateBlob: makeSaveStateBlob([0, 0, 0, 0, 0, 0, 0]),
    });
    const bridge = new MgbaRtcBridge(module);
    expect(bridge.getRtcState()).toBeNull();
  });

  it("ritorna null se il marker 'RTC ' non è nel blob", () => {
    // Blob senza marker — solo byte zero
    const corrupt = new Uint8Array(64);
    const { module } = makeMockModule({
      romBytes: makeRomWithGameCode("AXVE"),
      saveStateBlob: corrupt,
    });
    const bridge = new MgbaRtcBridge(module);
    expect(bridge.getRtcState()).toBeNull();
  });

  it("setRtcState patcha il blob con BCD e invoca loadState", () => {
    // Blob iniziale con BCD "vergine" (tutto 0)
    const initial = makeSaveStateBlob([0, 0, 0, 0, 0, 0, 0]);
    const harness = makeMockModule({
      romBytes: makeRomWithGameCode("AXVE"),
      saveStateBlob: initial,
    });
    const bridge = new MgbaRtcBridge(harness.module);

    const state: RtcState = {
      year: 2026,
      month: 6,
      day: 30, // martedì
      hour: 12,
      minute: 34,
      second: 56,
    };
    bridge.setRtcState(state);

    // Verifica: il blob è stato patchato (file in mappa aggiornato) e loadState chiamato
    expect(harness.loadStateCalls).toBe(1);
    const patched = harness.files.get("/data/states/game.ss0");
    expect(patched).toBeDefined();
    if (!patched) return;
    // Trova il marker "RTC " nel blob patchato
    let markerOff = -1;
    for (let i = 0; i <= patched.length - 4; i++) {
      if (
        patched[i] === 0x52 &&
        patched[i + 1] === 0x54 &&
        patched[i + 2] === 0x43 &&
        patched[i + 3] === 0x20
      ) {
        markerOff = i;
        break;
      }
    }
    expect(markerOff).toBeGreaterThanOrEqual(0);
    const payloadOff = markerOff + 4;
    expect(patched[payloadOff]).toBe(toBcd(26)); // year - 2000
    expect(patched[payloadOff + 1]).toBe(toBcd(6));
    expect(patched[payloadOff + 2]).toBe(toBcd(30));
    expect(patched[payloadOff + 3]).toBe(toBcd(2)); // martedì (zeller 2026-06-30)
    expect(patched[payloadOff + 4]).toBe(toBcd(12));
    expect(patched[payloadOff + 5]).toBe(toBcd(34));
    expect(patched[payloadOff + 6]).toBe(toBcd(56));
  });

  it("round-trip completo: setRtcState → getRtcState ≡ state (ADR-009 §2)", () => {
    const initial = makeSaveStateBlob([0, 0, 0, 0, 0, 0, 0]);
    const harness = makeMockModule({
      romBytes: makeRomWithGameCode("BPEE"), // Emerald
      saveStateBlob: initial,
    });
    const bridge = new MgbaRtcBridge(harness.module);

    const state: RtcState = {
      year: 2099,
      month: 12,
      day: 31,
      hour: 23,
      minute: 59,
      second: 59,
    };
    bridge.setRtcState(state);
    const readBack = bridge.getRtcState();
    expect(readBack).toEqual(state);
  });

  it("setRtcState è no-op se hasRtc è false", () => {
    const initial = makeSaveStateBlob([0, 0, 0, 0, 0, 0, 0]);
    const harness = makeMockModule({
      romBytes: makeRomWithGameCode("BPRE"), // FireRed (no RTC)
      saveStateBlob: initial,
    });
    const bridge = new MgbaRtcBridge(harness.module);
    bridge.setRtcState({
      year: 2026,
      month: 6,
      day: 30,
      hour: 12,
      minute: 0,
      second: 0,
    });
    // Nessun saveState/loadState eseguito (early return su hasRtc=false)
    expect(harness.saveStateCalls).toBe(0);
    expect(harness.loadStateCalls).toBe(0);
  });

  it("setRtcState è no-op silenzioso se FS.readFile fallisce", () => {
    // ROM valida ma save state non presente → readFile lancia, no throw esterno
    const harness = makeMockModule({
      romBytes: makeRomWithGameCode("AXVE"),
      // niente saveStateBlob: saveState ritornerà false (file non presente)
    });
    const bridge = new MgbaRtcBridge(harness.module);
    expect(() =>
      bridge.setRtcState({
        year: 2026,
        month: 6,
        day: 30,
        hour: 12,
        minute: 0,
        second: 0,
      }),
    ).not.toThrow();
    expect(harness.loadStateCalls).toBe(0);
  });
});

describe("zellerCongruence (TSK-134)", () => {
  it("2000-01-01 → 6 (sabato)", () => {
    expect(zellerCongruence(2000, 1, 1)).toBe(6);
  });

  it("2024-01-01 → 1 (lunedì)", () => {
    expect(zellerCongruence(2024, 1, 1)).toBe(1);
  });

  it("2026-06-30 → 2 (martedì)", () => {
    expect(zellerCongruence(2026, 6, 30)).toBe(2);
  });

  it("2026-01-01 → 4 (giovedì)", () => {
    expect(zellerCongruence(2026, 1, 1)).toBe(4);
  });

  it("2024-02-29 → 4 (giovedì, leap day)", () => {
    expect(zellerCongruence(2024, 2, 29)).toBe(4);
  });

  it("2099-12-31 → 4 (giovedì)", () => {
    expect(zellerCongruence(2099, 12, 31)).toBe(4);
  });
});

describe("toBcd / fromBcd round-trip (TSK-134)", () => {
  it("round-trip su tutti i valori 0..99", () => {
    for (let n = 0; n <= 99; n++) {
      expect(fromBcd(toBcd(n))).toBe(n);
    }
  });

  it("toBcd(0) === 0x00", () => {
    expect(toBcd(0)).toBe(0x00);
  });

  it("toBcd(99) === 0x99", () => {
    expect(toBcd(99)).toBe(0x99);
  });

  it("toBcd(42) === 0x42", () => {
    expect(toBcd(42)).toBe(0x42);
  });

  it("fromBcd(0x42) === 42", () => {
    expect(fromBcd(0x42)).toBe(42);
  });
});

describe("MgbaRtcBridge — sanity import (TSK-134)", () => {
  it("classe esporta un costruttore", () => {
    expect(typeof MgbaRtcBridge).toBe("function");
  });

  it("vi è disponibile (sanity vitest)", () => {
    expect(vi.fn()).toBeDefined();
  });
});
