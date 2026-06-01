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
    expect(id).toMatch(/^.+:1:\d+$/);

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
