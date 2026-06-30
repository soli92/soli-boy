// @vitest-environment node
// TSK-031 / US-016 + US-017 — SaveService: orchestrazione engine↔storage.
// Usa StubEngine (round-trip deterministico, TSK-030) e l'IndexedDBAdapter
// reale via fake-indexeddb, coerente con db.test.ts/bios.test.ts.
// TSK-129 / US-067 — esteso con cattura/ripristino RTC nei save state.
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StubEngine } from "../core/stub-engine";
import { closeDB } from "../storage/db";
import { indexedDbStorage } from "../storage/indexeddb-adapter";
import type { RtcBridge, RtcState } from "./rtc-service";
import type { Core } from "./types";
import { SaveService } from "./save-service";

async function freshDb(): Promise<void> {
  await closeDB();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("soli-boy");
    req.onsuccess = () => resolve();
    req.onblocked = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function seedRom(title: string, core: Core): Promise<string> {
  // Contenuto unico per ROM così l'hash deterministico genera id distinti.
  return indexedDbStorage.addRom({
    title,
    platform: core === "mgba" ? "GBA" : "GB",
    core,
    fileBlob: new Blob([title]),
  });
}

beforeEach(async () => {
  await freshDb();
});

describe("SaveService.saveState + loadState (US-016)", () => {
  it("round-trip via slot: snapshot persistito è ricaricabile e ripristina lo stato", async () => {
    const romId = await seedRom("Tetris", "gambatte");
    const engine = new StubEngine();
    await engine.load({ rom: new Blob(["x"]), core: "gambatte" });
    engine.setAudio({ volume: 0.5, mute: false });
    engine.sendInput("start", true);

    const svc = new SaveService(indexedDbStorage);
    const id = await svc.saveState(engine, romId, 1);
    // Id shape post F-031-1-R2: `<romId>:<slot>:<createdAt>:<uuid v4>`.
    expect(id).toMatch(/^.+:1:\d+:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

    // Muta lo stato dopo il save: il restore lo deve riportare indietro.
    engine.setAudio({ volume: 1, mute: true });
    engine.sendInput("b", false);
    engine.stop();

    const res = await svc.loadState(engine, id, "gambatte");
    expect(res.ok).toBe(true);
    expect(engine.audio).toEqual({ volume: 0.5, mute: false });
    expect(engine.lastInput).toEqual({ button: "start", pressed: true });
    expect(engine.loaded).toBe(true);
  });

  it("etichetta l'entry col core canonico della ROM (per il guard cross-engine)", async () => {
    const romId = await seedRom("Metroid", "mgba");
    const engine = new StubEngine(); // engine usato per produrre lo snapshot
    const svc = new SaveService(indexedDbStorage);
    const id = await svc.saveState(engine, romId, 0);

    const rec = await indexedDbStorage.getSaveState(id);
    expect(rec?.core).toBe("mgba");
    expect(rec?.romId).toBe(romId);
    expect(rec?.slot).toBe(0);
    expect(rec?.snapshotBlob).toBeInstanceOf(Blob);
  });

  it("rifiuta saveState se la ROM non esiste", async () => {
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    await expect(svc.saveState(engine, "rom-inesistente", 0)).rejects.toThrow(
      /ROM non trovata/i,
    );
  });
});

describe("SaveService.loadState — guard cross-engine (ADR-006)", () => {
  it("rifiuta onestamente se il core dell'entry diverge dall'engine corrente", async () => {
    const romId = await seedRom("Pokemon Red", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    const id = await svc.saveState(engine, romId, 0); // entry.core = gambatte

    // Ora carichiamo come se l'engine attivo fosse mgba: mismatch atteso.
    const res = await svc.loadState(engine, id, "mgba");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("engine-mismatch");
      expect(res.detail).toMatch(/gambatte/);
      expect(res.detail).toMatch(/mgba/);
    }
  });

  it("ritorna not-found se il save state non esiste", async () => {
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    const res = await svc.loadState(engine, "ss-fantasma", "gambatte");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("not-found");
  });
});

describe("SaveService.listSaveStates + deleteSaveState (US-016)", () => {
  it("elenca i save state della ROM ordinati per slot e li elimina (idempotente)", async () => {
    const romA = await seedRom("Zelda", "gambatte");
    const romB = await seedRom("F-Zero", "mgba");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);

    const a2 = await svc.saveState(engine, romA, 2);
    const a0 = await svc.saveState(engine, romA, 0);
    const a1 = await svc.saveState(engine, romA, 1);
    await svc.saveState(engine, romB, 0); // su ROM diversa: non deve apparire

    const list = await svc.listSaveStates(romA);
    expect(list.map((r) => r.slot)).toEqual([0, 1, 2]);
    expect(list.every((r) => r.romId === romA)).toBe(true);

    await svc.deleteSaveState(a1);
    const after = await svc.listSaveStates(romA);
    expect(after.map((r) => r.id)).toEqual([a0, a2]);

    // Idempotente: cancellare due volte non lancia.
    await expect(svc.deleteSaveState(a1)).resolves.toBeUndefined();
  });
});

describe("SaveService.autosaveSram + restoreSram (US-017)", () => {
  it("autosave persiste i bytes SRAM dell'engine; restore li reinietta nell'engine", async () => {
    const romId = await seedRom("Pkmn Crystal", "gambatte");
    const engine = new StubEngine();
    const original = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x42]);
    await engine.loadSram(original);

    const svc = new SaveService(indexedDbStorage);
    const auto = await svc.autosaveSram(engine, romId);
    expect(auto.ok).toBe(true);
    if (auto.ok) expect(auto.persisted).toBe(true);

    // Resetta la SRAM nell'engine (simula reload del gioco).
    const fresh = new StubEngine();
    const restore = await svc.restoreSram(fresh, romId);
    expect(restore.ok).toBe(true);
    if (restore.ok) expect(restore.restored).toBe(true);

    const out = await fresh.getSram();
    expect(out).not.toBeNull();
    expect(Array.from(out!)).toEqual(Array.from(original));
  });

  it("autosave è no-op (persisted:false) se l'engine non ha SRAM (null)", async () => {
    const romId = await seedRom("NoSavGame", "gambatte");
    const engine = new StubEngine(); // SRAM non inizializzata ⇒ getSram() = null
    const svc = new SaveService(indexedDbStorage);
    const res = await svc.autosaveSram(engine, romId);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.persisted).toBe(false);
    // Nessuna entry SRAM scritta a fronte di null.
    expect(await indexedDbStorage.getSram(romId)).toBeUndefined();
  });

  it("restoreSram ritorna restored:false se non c'è SRAM persistita per la ROM", async () => {
    const romId = await seedRom("BrandNew", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    const res = await svc.restoreSram(engine, romId);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.restored).toBe(false);
    expect(await engine.getSram()).toBeNull();
  });

  it("autosave rifiuta se la ROM non esiste", async () => {
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    const res = await svc.autosaveSram(engine, "rom-fantasma");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("rom-not-found");
  });

  it("restoreSram rifiuta se la ROM non esiste", async () => {
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    const res = await svc.restoreSram(engine, "rom-fantasma");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("rom-not-found");
  });

  it("autosave segnala engine-unsupported se getSram lancia (no falsi claim)", async () => {
    const romId = await seedRom("UnsupportedSav", "gambatte");
    // Engine che NON espone la SRAM (capability false): getSram lancia.
    const engine = new StubEngine();
    engine.getSram = async () => {
      throw new Error("Engine non espone la SRAM in runtime.");
    };
    const svc = new SaveService(indexedDbStorage);
    const res = await svc.autosaveSram(engine, romId);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("engine-unsupported");
      expect(res.detail).toMatch(/SRAM/);
    }
    // Nessuna entry scritta.
    expect(await indexedDbStorage.getSram(romId)).toBeUndefined();
  });
});

// === TSK-033 (US-019) — Export/import salvataggi =================================
//
// Copre i 3 AC dell'US-019:
//   AC1: esportare un salvataggio come file.
//   AC2: importare un file precedentemente esportato (round-trip).
//   AC3: file non valido / non corrispondente → esito esplicito comprensibile.
//
// Più Business Rule (ADR-006 §Decisione p.3): import valida e riassocia al rom.

describe("SaveService.exportSaveState (US-019 AC1)", () => {
  it("produce un file portabile versionato con format/version/kind/romId/data", async () => {
    const romId = await seedRom("Tetris", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    const id = await svc.saveState(engine, romId, 2);

    const res = await svc.exportSaveState(id);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Il blob è JSON parsabile e ha la forma attesa.
    const text = await res.blob.text();
    const env = JSON.parse(text);
    expect(env.format).toBe("soliboy-save");
    expect(env.version).toBe(1);
    expect(env.kind).toBe("saveState");
    expect(env.romId).toBe(romId);
    expect(env.core).toBe("gambatte");
    expect(env.slot).toBe(2);
    expect(typeof env.createdAt).toBe("number");
    // base64 payload non vuoto.
    expect(typeof env.data).toBe("string");
    expect(env.data.length).toBeGreaterThan(0);
    // Il filename suggerisce slot + titolo sanitizzato.
    expect(res.filename).toMatch(/Tetris.*slot2.*soliboy-save\.json$/);
    // application/json per il download.
    expect(res.blob.type).toBe("application/json");
  });

  it("ritorna not-found se l'id non esiste (no claim falsi)", async () => {
    const svc = new SaveService(indexedDbStorage);
    const res = await svc.exportSaveState("save-fantasma");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("not-found");
  });

  it("ritorna rom-not-found se la ROM associata è stata rimossa fra save ed export", async () => {
    const romId = await seedRom("Zelda", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    const id = await svc.saveState(engine, romId, 0);
    // Simula la rimozione della ROM (i save state non sono CASCADE).
    await indexedDbStorage.removeRom(romId);
    const res = await svc.exportSaveState(id);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("rom-not-found");
  });
});

describe("SaveService.importSave (US-019 AC2 — round-trip)", () => {
  it("round-trip: l'output di exportSaveState reimportato persiste una nuova entry", async () => {
    const romId = await seedRom("Pokemon", "gambatte");
    const engine = new StubEngine();
    await engine.load({ rom: new Blob(["x"]), core: "gambatte" });
    engine.setAudio({ volume: 0.7, mute: false });
    const svc = new SaveService(indexedDbStorage);
    const id = await svc.saveState(engine, romId, 1);
    const exp = await svc.exportSaveState(id);
    expect(exp.ok).toBe(true);
    if (!exp.ok) return;

    // Reimporta (simula trasferimento su altro device — qui stesso storage).
    const before = await svc.listSaveStates(romId);
    const imp = await svc.importSave(exp.blob);
    expect(imp.ok).toBe(true);
    if (!imp.ok) return;
    expect(imp.kind).toBe("saveState");
    expect(imp.romId).toBe(romId);
    expect(imp.id).toBeDefined();

    const after = await svc.listSaveStates(romId);
    expect(after.length).toBe(before.length + 1);
    // L'entry importata ha lo slot e il core originali.
    const imported = after.find((r) => r.id === imp.id);
    expect(imported?.slot).toBe(1);
    expect(imported?.core).toBe("gambatte");

    // Il save state importato è effettivamente caricabile via loadState
    // (controllo che il blob non sia stato corrotto in base64 round-trip).
    const fresh = new StubEngine();
    const load = await svc.loadState(fresh, imp.id!, "gambatte");
    expect(load.ok).toBe(true);
  });

  it("accetta anche input come stringa JSON o ArrayBuffer (test convenience)", async () => {
    const romId = await seedRom("FZero", "mgba");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    const id = await svc.saveState(engine, romId, 0);
    const exp = await svc.exportSaveState(id);
    expect(exp.ok).toBe(true);
    if (!exp.ok) return;
    const json = await exp.blob.text();

    // Stringa JSON
    const r1 = await svc.importSave(json);
    expect(r1.ok).toBe(true);

    // ArrayBuffer
    const buf = new TextEncoder().encode(json).buffer;
    const r2 = await svc.importSave(buf);
    expect(r2.ok).toBe(true);
  });

  it("kind:'sram' round-trip: import persiste l'entry via putSram", async () => {
    const romId = await seedRom("PkmnCrystalSram", "gambatte");
    // Costruzione manuale di un envelope SRAM (no API export dedicata: il
    // formato è documentato come `kind:"sram"` e l'import lo deve accettare).
    const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const b64 = btoa(String.fromCharCode(...data));
    const envelope = JSON.stringify({
      format: "soliboy-save",
      version: 1,
      kind: "sram",
      romId,
      createdAt: Date.now(),
      data: b64,
    });
    const svc = new SaveService(indexedDbStorage);
    const res = await svc.importSave(envelope);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.kind).toBe("sram");
    expect(res.romId).toBe(romId);

    // La SRAM è recuperabile via storage.
    const rec = await indexedDbStorage.getSram(romId);
    expect(rec).toBeDefined();
    expect(rec?.romId).toBe(romId);
    const restored = new Uint8Array(await rec!.data.arrayBuffer());
    expect(Array.from(restored)).toEqual(Array.from(data));
  });
});

describe("SaveService.importSave (US-019 AC3 — file invalidi/non corrispondenti)", () => {
  it("JSON malformato → reason 'invalid-file' (no throw)", async () => {
    const svc = new SaveService(indexedDbStorage);
    const res = await svc.importSave("{this is not json");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("invalid-file");
      expect(res.detail).toMatch(/JSON/i);
    }
  });

  it("format mismatch (file di un altro prodotto) → reason 'format-mismatch'", async () => {
    const svc = new SaveService(indexedDbStorage);
    const res = await svc.importSave(
      JSON.stringify({ format: "other-app-save", version: 1 }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("format-mismatch");
  });

  it("versione non supportata → reason 'unsupported-version'", async () => {
    const svc = new SaveService(indexedDbStorage);
    const res = await svc.importSave(
      JSON.stringify({
        format: "soliboy-save",
        version: 9999,
        kind: "saveState",
        romId: "x",
        core: "gambatte",
        slot: 0,
        createdAt: 0,
        data: "",
      }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("unsupported-version");
  });

  it("ROM non in libreria → reason 'rom-not-found' (US-019 Business Rule: riassociazione)", async () => {
    const svc = new SaveService(indexedDbStorage);
    const res = await svc.importSave(
      JSON.stringify({
        format: "soliboy-save",
        version: 1,
        kind: "saveState",
        romId: "rom-non-esistente",
        core: "gambatte",
        slot: 0,
        createdAt: 0,
        data: btoa("abc"),
      }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("rom-not-found");
      expect(res.detail).toMatch(/rom-non-esistente/);
    }
  });

  it("envelope con campi mancanti → reason 'invalid-file' (no claim falsi)", async () => {
    const svc = new SaveService(indexedDbStorage);
    // Manca `slot` per kind:"saveState".
    const res = await svc.importSave(
      JSON.stringify({
        format: "soliboy-save",
        version: 1,
        kind: "saveState",
        romId: "rom-x",
        core: "gambatte",
        // slot omesso
        createdAt: 0,
        data: "",
      }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("invalid-file");
  });

  it("F-033-02: saveState con core diverso dalla ROM target → 'format-mismatch' e nessuna entry persistita", async () => {
    // ADR-006 §Conseguenze: l'import valida la compatibilità cross-engine.
    // ROM target: GB (gambatte); envelope: saveState dichiarato mgba.
    const romId = await seedRom("GBOnly", "gambatte");
    const svc = new SaveService(indexedDbStorage);
    const before = await svc.listSaveStates(romId);
    const res = await svc.importSave(
      JSON.stringify({
        format: "soliboy-save",
        version: 1,
        kind: "saveState",
        romId,
        core: "mgba",
        slot: 0,
        createdAt: 0,
        data: btoa("payload"),
      }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("format-mismatch");
    // Nessuna entry persistita (no storage cruft).
    const after = await svc.listSaveStates(romId);
    expect(after.length).toBe(before.length);
  });

  it("importSave con rtcState strutturalmente malformato → entry importata senza rtcState (CQRL iter-3 N-1)", async () => {
    // ADR-009 §4 + CQRL iter-3 N-1: un envelope altrimenti valido con `rtcState`
    // malformato (oggetto fuori range) viene importato comunque, ma il campo
    // viene strippato silenziosamente da parseEnvelope (policy strip best-effort:
    // l'RTC è accessorio, un file con il resto corretto NON deve diventare
    // non-importabile per via di un campo opzionale corrotto).
    const romId = await seedRom("PkmnBadRtc", "gambatte");
    const svc = new SaveService(indexedDbStorage);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const envelope = JSON.stringify({
      format: "soliboy-save",
      version: 1,
      kind: "saveState",
      romId,
      core: "gambatte",
      slot: 0,
      createdAt: Date.now(),
      data: btoa("payload"),
      // Malformato: month=13 fuori range (>12).
      rtcState: { year: 2024, month: 13, day: 1, hour: 0, minute: 0, second: 0 },
    });

    const res = await svc.importSave(envelope);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.kind).toBe("saveState");
    // Il warn diagnostico è stato emesso (policy strip silenziosa ma osservabile).
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0]?.[0]).toMatch(/rtcState malformato/i);

    // L'entry importata NON deve contenere rtcState (campo strippato).
    const imported = await indexedDbStorage.getSaveState(res.id!);
    expect(imported).toBeDefined();
    expect(imported?.rtcState).toBeUndefined();

    warnSpy.mockRestore();
  });

  it("non persiste entry se l'import fallisce (no scrittura orfana)", async () => {
    const romId = await seedRom("StillEmpty", "gambatte");
    const svc = new SaveService(indexedDbStorage);
    const before = await svc.listSaveStates(romId);

    // format errato
    await svc.importSave(JSON.stringify({ format: "foo", version: 1 }));
    // rom non esistente
    await svc.importSave(
      JSON.stringify({
        format: "soliboy-save",
        version: 1,
        kind: "saveState",
        romId: "ghost",
        core: "gambatte",
        slot: 0,
        createdAt: 0,
        data: btoa("x"),
      }),
    );

    const after = await svc.listSaveStates(romId);
    expect(after.length).toBe(before.length);
  });
});

// === TSK-129 (US-067) — RTC incluso nei save state =============================
//
// Copre il campo opzionale `rtcState?` aggiunto alla entry `saveStates`
// (ADR-009 §3). I casi del TSK:
//  - capture con bridge non-null → entry contiene `rtcState`
//  - capture con bridge null/assente → entry non contiene `rtcState`
//  - restore con `rtcState` presente + bridge → `setRtcState` chiamato
//  - restore con entry legacy (no rtcState) → `setRtcState` non chiamato,
//    restore completa normalmente (compat all'indietro)
//  - restore con bridge che lancia → warn + restore comunque ok:true

/** Bridge mock pilotabile per i test (no engine reale necessario). */
function makeMockRtcBridge(initial: RtcState | null = null): {
  bridge: RtcBridge;
  setRtcStateSpy: ReturnType<typeof vi.fn>;
  getRtcStateSpy: ReturnType<typeof vi.fn>;
  current: { state: RtcState | null };
} {
  const current: { state: RtcState | null } = { state: initial };
  const getRtcStateSpy = vi.fn<() => RtcState | null>(() => current.state);
  const setRtcStateSpy = vi.fn<(s: RtcState) => void>((s: RtcState) => {
    current.state = s;
  });
  const bridge: RtcBridge = {
    hasRtc: vi.fn().mockReturnValue(true),
    getRtcState: getRtcStateSpy,
    setRtcState: setRtcStateSpy,
  };
  return { bridge, getRtcStateSpy, setRtcStateSpy, current };
}

const SAMPLE_RTC: RtcState = {
  year: 2024,
  month: 6,
  day: 15,
  hour: 12,
  minute: 34,
  second: 56,
};

describe("SaveService.saveState — cattura RTC (TSK-129, US-067)", () => {
  it("con bridge non-null e RTC presente: l'entry persistita contiene `rtcState`", async () => {
    const romId = await seedRom("Pkmn Crystal RTC", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    const { bridge, getRtcStateSpy } = makeMockRtcBridge(SAMPLE_RTC);

    const id = await svc.saveState(engine, romId, 0, bridge);

    expect(getRtcStateSpy).toHaveBeenCalledTimes(1);
    const rec = await indexedDbStorage.getSaveState(id);
    expect(rec).toBeDefined();
    expect(rec?.rtcState).toEqual(SAMPLE_RTC);
  });

  it("con bridge null: l'entry persistita NON contiene `rtcState` (comportamento invariato)", async () => {
    const romId = await seedRom("Tetris NoRtc", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);

    const id = await svc.saveState(engine, romId, 0, null);

    const rec = await indexedDbStorage.getSaveState(id);
    expect(rec).toBeDefined();
    expect(rec?.rtcState).toBeUndefined();
  });

  it("senza parametro rtcBridge (call site legacy): `rtcState` assente nell'entry (compat all'indietro)", async () => {
    const romId = await seedRom("Tetris Legacy", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);

    // Firma legacy 3-arg: il chiamante non sa nulla di RTC.
    const id = await svc.saveState(engine, romId, 0);

    const rec = await indexedDbStorage.getSaveState(id);
    expect(rec).toBeDefined();
    expect(rec?.rtcState).toBeUndefined();
  });

  it("con bridge che ritorna null (engine senza RTC attivo): `rtcState` assente, save procede", async () => {
    const romId = await seedRom("GBA NoRtcCartridge", "mgba");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    const { bridge, getRtcStateSpy } = makeMockRtcBridge(null);

    const id = await svc.saveState(engine, romId, 1, bridge);

    expect(getRtcStateSpy).toHaveBeenCalledTimes(1);
    const rec = await indexedDbStorage.getSaveState(id);
    expect(rec).toBeDefined();
    expect(rec?.rtcState).toBeUndefined();
  });

  it("bridge.getRtcState che lancia: save procede senza rtcState, warn emesso", async () => {
    const romId = await seedRom("Pkmn FlakyRtc", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    const bridge: RtcBridge = {
      hasRtc: vi.fn().mockReturnValue(true),
      getRtcState: () => {
        throw new Error("RTC bridge KO");
      },
      setRtcState: vi.fn(),
    };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const id = await svc.saveState(engine, romId, 0, bridge);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toMatch(/cattura RTC fallita/i);
    const rec = await indexedDbStorage.getSaveState(id);
    expect(rec).toBeDefined();
    expect(rec?.rtcState).toBeUndefined();

    warnSpy.mockRestore();
  });
});

describe("SaveService.loadState — ripristino RTC (TSK-129, US-067)", () => {
  it("entry con rtcState + bridge: `setRtcState(bridge, entry.rtcState)` chiamato; restore ok", async () => {
    const romId = await seedRom("Pkmn Crystal Load", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);

    // Save lato A: cattura con bridge popolato.
    const capture = makeMockRtcBridge(SAMPLE_RTC);
    const id = await svc.saveState(engine, romId, 0, capture.bridge);

    // Load lato B: bridge separato (vuoto) → deve essere riallineato.
    const restoreSide = makeMockRtcBridge(null);
    const res = await svc.loadState(engine, id, "gambatte", restoreSide.bridge);

    expect(res.ok).toBe(true);
    expect(restoreSide.setRtcStateSpy).toHaveBeenCalledTimes(1);
    expect(restoreSide.setRtcStateSpy).toHaveBeenCalledWith(SAMPLE_RTC);
    // Lo stato del bridge "lato restore" riflette il valore catturato.
    expect(restoreSide.current.state).toEqual(SAMPLE_RTC);
  });

  it("entry legacy (no rtcState): `setRtcState` NON chiamato, restore ok (compat all'indietro)", async () => {
    const romId = await seedRom("LegacySave", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);

    // Save senza bridge → entry priva di rtcState (simulazione save pre EP-019).
    const id = await svc.saveState(engine, romId, 0);
    const recCheck = await indexedDbStorage.getSaveState(id);
    expect(recCheck?.rtcState).toBeUndefined(); // sanity check

    const restoreSide = makeMockRtcBridge(null);
    const res = await svc.loadState(engine, id, "gambatte", restoreSide.bridge);

    expect(res.ok).toBe(true);
    expect(restoreSide.setRtcStateSpy).not.toHaveBeenCalled();
  });

  it("entry con rtcState ma bridge null: `setRtcState` NON chiamato, restore ok", async () => {
    const romId = await seedRom("RtcButNoBridge", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);

    const capture = makeMockRtcBridge(SAMPLE_RTC);
    const id = await svc.saveState(engine, romId, 0, capture.bridge);

    // Restore con bridge=null: la entry ha rtcState ma non c'è chi lo accetti.
    const res = await svc.loadState(engine, id, "gambatte", null);
    expect(res.ok).toBe(true);
    // Nessun side-effect: il capture bridge non viene richiamato in restore.
    expect(capture.setRtcStateSpy).not.toHaveBeenCalled();
  });

  it("senza parametro rtcBridge (call site legacy): restore non tocca l'RTC", async () => {
    const romId = await seedRom("LegacyLoad", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);

    const capture = makeMockRtcBridge(SAMPLE_RTC);
    const id = await svc.saveState(engine, romId, 0, capture.bridge);

    // Firma legacy 3-arg: il chiamante non ha aggiornato la call site.
    const res = await svc.loadState(engine, id, "gambatte");
    expect(res.ok).toBe(true);
    expect(capture.setRtcStateSpy).not.toHaveBeenCalled();
  });

  it("bridge.setRtcState che lancia: warn emesso, restore comunque ok:true (degrade graceful)", async () => {
    const romId = await seedRom("RtcFlakyOnLoad", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);

    const capture = makeMockRtcBridge(SAMPLE_RTC);
    const id = await svc.saveState(engine, romId, 0, capture.bridge);

    const flakyBridge: RtcBridge = {
      hasRtc: vi.fn().mockReturnValue(true),
      getRtcState: () => null,
      setRtcState: () => {
        throw new Error("RTC apply KO");
      },
    };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const res = await svc.loadState(engine, id, "gambatte", flakyBridge);
    expect(res.ok).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toMatch(/ripristino RTC fallito/i);

    warnSpy.mockRestore();
  });
});

// === Review iter-2 (F-2/F-5/F-8) — RTC nel round-trip export/import ============
//
// Senza propagazione di `rtcState` nell'envelope portabile, l'RTC veniva perso
// silenziosamente in export → import (l'entry importata non aveva rtcState, e il
// successivo loadState non poteva ripristinare l'orologio). Verifichiamo:
//   1. export di un saveState con rtcState → envelope contiene `rtcState`
//   2. import dell'envelope → entry persistita contiene `rtcState` valorizzato
//   3. export di un saveState SENZA rtcState → envelope NON contiene il campo
//      (compat all'indietro, no `rtcState: undefined` serializzato a oggetto vuoto)

describe("SaveService export/import round-trip RTC (review iter-2: F-2/F-5/F-8)", () => {
  it("round-trip completo: saveState(bridge) → export → import → entry contiene rtcState", async () => {
    const romId = await seedRom("Pkmn Crystal Roundtrip", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);
    const { bridge } = makeMockRtcBridge(SAMPLE_RTC);

    // 1) Save con RTC bridge popolato.
    const id = await svc.saveState(engine, romId, 0, bridge);
    const original = await indexedDbStorage.getSaveState(id);
    expect(original?.rtcState).toEqual(SAMPLE_RTC); // sanity

    // 2) Export → envelope JSON deve contenere `rtcState`.
    const exp = await svc.exportSaveState(id);
    expect(exp.ok).toBe(true);
    if (!exp.ok) return;
    const env = JSON.parse(await exp.blob.text());
    expect(env.rtcState).toEqual(SAMPLE_RTC);

    // 3) Import dell'envelope → nuova entry deve contenere `rtcState`.
    const imp = await svc.importSave(exp.blob);
    expect(imp.ok).toBe(true);
    if (!imp.ok) return;
    expect(imp.id).toBeDefined();
    const imported = await indexedDbStorage.getSaveState(imp.id!);
    expect(imported).toBeDefined();
    expect(imported?.rtcState).toEqual(SAMPLE_RTC);
  });

  it("export di entry senza rtcState: envelope NON contiene il campo (compat all'indietro)", async () => {
    const romId = await seedRom("NoRtc Export", "gambatte");
    const engine = new StubEngine();
    const svc = new SaveService(indexedDbStorage);

    // Save SENZA bridge → entry priva di rtcState.
    const id = await svc.saveState(engine, romId, 0);
    const exp = await svc.exportSaveState(id);
    expect(exp.ok).toBe(true);
    if (!exp.ok) return;

    const env = JSON.parse(await exp.blob.text());
    // Il campo deve essere proprio assente (spread condizionale), non `undefined`.
    expect(Object.prototype.hasOwnProperty.call(env, "rtcState")).toBe(false);

    // Import → entry importata anch'essa senza rtcState.
    const imp = await svc.importSave(exp.blob);
    expect(imp.ok).toBe(true);
    if (!imp.ok) return;
    const imported = await indexedDbStorage.getSaveState(imp.id!);
    expect(imported?.rtcState).toBeUndefined();
  });
});
