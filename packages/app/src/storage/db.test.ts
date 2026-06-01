// @vitest-environment node
// TSK-001 — test CRUD dello store `roms` su IndexedDB (fake-indexeddb).
// (Blob.arrayBuffer non è implementato dal Blob di jsdom; in browser reale è disponibile.)
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { addRom, getRom, listRoms, removeRom, __resetDBForTests } from "./db";
import type { RomInput } from "./types";

function rom(title: string, content: string, platform: RomInput["platform"], core: RomInput["core"]): RomInput {
  return { title, platform, core, fileBlob: new Blob([content]) };
}

beforeEach(async () => {
  // Chiudi la connessione aperta, poi elimina il DB (attendi il completamento).
  await __resetDBForTests();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("soli-boy");
    req.onsuccess = () => resolve();
    req.onblocked = () => resolve();
    req.onerror = () => reject(req.error);
  });
});

describe("storage roms", () => {
  it("addRom persiste e getRom recupera", async () => {
    const id = await addRom(rom("Tetris", "AAA", "GB", "gambatte"));
    const got = await getRom(id);
    expect(got?.title).toBe("Tetris");
    expect(got?.platform).toBe("GB");
    expect(got?.addedAt).toBeTypeOf("number");
  });

  it("id derivato dal contenuto: stesso contenuto → stesso id (idempotente)", async () => {
    const a = await addRom(rom("X", "SAME", "GBA", "mgba"));
    const b = await addRom(rom("X-dup", "SAME", "GBA", "mgba"));
    expect(a).toBe(b);
    expect(await listRoms()).toHaveLength(1); // put sovrascrive
  });

  it("listRoms filtra per piattaforma e per query", async () => {
    await addRom(rom("Super Mario Land", "m", "GB", "gambatte"));
    await addRom(rom("Metroid Fusion", "f", "GBA", "mgba"));
    expect(await listRoms({ platform: "GB" })).toHaveLength(1);
    expect((await listRoms({ query: "mario" }))[0].title).toBe("Super Mario Land");
    expect(await listRoms({ query: "zzz" })).toHaveLength(0);
  });

  it("removeRom elimina ed è idempotente", async () => {
    const id = await addRom(rom("Pkmn", "p", "GBC", "gambatte"));
    await removeRom(id);
    expect(await getRom(id)).toBeUndefined();
    await removeRom(id); // idempotente, nessun errore
    expect(await listRoms()).toHaveLength(0);
  });
});
