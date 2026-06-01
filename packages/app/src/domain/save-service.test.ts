// @vitest-environment node
// TSK-031 / US-016 + US-017 — SaveService: orchestrazione engine↔storage.
// Usa StubEngine (round-trip deterministico, TSK-030) e l'IndexedDBAdapter
// reale via fake-indexeddb, coerente con db.test.ts/bios.test.ts.
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { StubEngine } from "../core/stub-engine";
import { closeDB } from "../storage/db";
import { indexedDbStorage } from "../storage/indexeddb-adapter";
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
