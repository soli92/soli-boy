// @vitest-environment node
// TSK-001 — test CRUD dello store `roms` su IndexedDB (fake-indexeddb).
// TSK-031 — test diretti delle funzioni storage saveStates/sram (F-031-1-T1).
// (Blob.arrayBuffer non è implementato dal Blob di jsdom; in browser reale è disponibile.)
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  addRom,
  getRom,
  listRoms,
  removeRom,
  closeDB,
  putSaveState,
  listSaveStates,
  getSaveState,
  deleteSaveState,
  putSram,
  getSram,
  getConfig,
  setConfig,
  setCover,
} from "./db";
import type { RomInput, SaveStateInput } from "./types";

function rom(title: string, content: string, platform: RomInput["platform"], core: RomInput["core"]): RomInput {
  return { title, platform, core, fileBlob: new Blob([content]) };
}

beforeEach(async () => {
  // Chiudi la connessione aperta, poi elimina il DB (attendi il completamento).
  await closeDB();
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

// TSK-031 (F-031-1-T1) — test diretti dello store saveStates.
function saveInput(romId: string, slot: number, payload = "snap"): SaveStateInput {
  return { romId, slot, core: "gambatte", snapshotBlob: new Blob([payload]) };
}

describe("storage saveStates (TSK-031)", () => {
  it("round-trip: putSaveState → getSaveState restituisce il record", async () => {
    const id = await putSaveState(saveInput("rom-A", 0));
    const got = await getSaveState(id);
    expect(got?.romId).toBe("rom-A");
    expect(got?.slot).toBe(0);
    expect(got?.core).toBe("gambatte");
    expect(got?.createdAt).toBeTypeOf("number");
  });

  it("listSaveStates ordina per slot crescente, poi per createdAt", async () => {
    // Inserisco in ordine sparso: slot 2, 0, 1.
    await putSaveState(saveInput("rom-A", 2));
    await putSaveState(saveInput("rom-A", 0));
    await putSaveState(saveInput("rom-A", 1));
    const list = await listSaveStates("rom-A");
    expect(list.map((r) => r.slot)).toEqual([0, 1, 2]);
  });

  it("due putSaveState ravvicinati sullo stesso slot coesistono (F-031-1-R2)", async () => {
    // Senza il tiebreaker UUID, due Date.now() identici sullo stesso slot/romId
    // produrrebbero lo stesso id e il secondo put sovrascriverebbe il primo.
    const id1 = await putSaveState(saveInput("rom-A", 0, "first"));
    const id2 = await putSaveState(saveInput("rom-A", 0, "second"));
    expect(id1).not.toBe(id2);
    const list = await listSaveStates("rom-A");
    expect(list).toHaveLength(2);
    expect(list.every((r) => r.slot === 0)).toBe(true);
  });

  it("deleteSaveState rimuove ed è idempotente", async () => {
    const id = await putSaveState(saveInput("rom-A", 0));
    await deleteSaveState(id);
    expect(await getSaveState(id)).toBeUndefined();
    await deleteSaveState(id); // idempotente
    expect(await listSaveStates("rom-A")).toHaveLength(0);
  });

  it("listSaveStates segrega per romId", async () => {
    await putSaveState(saveInput("rom-A", 0));
    await putSaveState(saveInput("rom-B", 0));
    expect(await listSaveStates("rom-A")).toHaveLength(1);
    expect(await listSaveStates("rom-B")).toHaveLength(1);
    expect(await listSaveStates("rom-C")).toHaveLength(0);
  });
});

// TSK-031 (F-031-1-T1) — test diretti dello store sram.
describe("storage sram (TSK-031)", () => {
  it("putSram + getSram: round-trip per romId", async () => {
    await putSram("rom-A", new Blob(["sram-data"]));
    const got = await getSram("rom-A");
    expect(got?.romId).toBe("rom-A");
    expect(got?.updatedAt).toBeTypeOf("number");
  });

  it("putSram è idempotente per romId (sovrascrittura)", async () => {
    await putSram("rom-A", new Blob(["v1"]));
    const firstUpdatedAt = (await getSram("rom-A"))?.updatedAt;
    // Attendi 1ms per garantire updatedAt distinto (Date.now ha risoluzione ms).
    await new Promise((r) => setTimeout(r, 2));
    await putSram("rom-A", new Blob(["v2"]));
    const got = await getSram("rom-A");
    expect(got?.updatedAt).toBeGreaterThan(firstUpdatedAt ?? 0);
    // Singola entry per romId (chiave = romId).
  });

  it("getSram restituisce undefined se assente", async () => {
    expect(await getSram("ghost")).toBeUndefined();
  });
});

// TSK-036 (F-036-01) — test del config store generico (getConfig/setConfig).
// Lo store `config` esiste fin dalla v1 (keyPath "key"). Convive con `bios.ts`
// usando uno spazio di chiavi disgiunto (`bios:*` vs altre chiavi applicative).
describe("storage config (TSK-036)", () => {
  it("getConfig restituisce undefined per chiavi mai scritte", async () => {
    expect(await getConfig("video-settings")).toBeUndefined();
  });

  it("round-trip: setConfig persiste, getConfig restituisce il valore", async () => {
    const value = { scale: 3 as const, aspect: "4:3" as const };
    await setConfig("video-settings", value);
    expect(await getConfig("video-settings")).toEqual(value);
  });

  it("setConfig è idempotente (sostituisce il valore precedente)", async () => {
    await setConfig("video-settings", { scale: 1, aspect: "original" });
    await setConfig("video-settings", { scale: 5, aspect: "stretch" });
    expect(await getConfig("video-settings")).toEqual({
      scale: 5,
      aspect: "stretch",
    });
  });

  it("chiavi diverse non si interferiscono (bios:* vs video-settings)", async () => {
    await setConfig("video-settings", { scale: 2, aspect: "4:3" });
    // Una chiave non valorizzata resta undefined.
    expect(await getConfig("does-not-exist")).toBeUndefined();
    // Il valore atteso è quello scritto.
    expect(await getConfig("video-settings")).toEqual({
      scale: 2,
      aspect: "4:3",
    });
  });
});

// TSK-039 (US-009) — test diretti di setCover sullo store roms.
describe("storage cover (TSK-039)", () => {
  it("setCover aggiorna coverBlob su una ROM esistente", async () => {
    const id = await addRom(rom("Tetris", "TT", "GB", "gambatte"));
    expect((await getRom(id))?.coverBlob).toBeUndefined();
    const cover = new Blob(["png-bytes"], { type: "image/png" });
    await setCover(id, cover);
    const updated = await getRom(id);
    expect(updated?.coverBlob).toBeInstanceOf(Blob);
    // Preserva gli altri campi.
    expect(updated?.title).toBe("Tetris");
    expect(updated?.platform).toBe("GB");
    expect(updated?.fileBlob).toBeInstanceOf(Blob);
  });

  it("setCover sovrascrive una copertina preesistente (idempotente)", async () => {
    const id = await addRom(rom("Metroid", "MM", "GBA", "mgba"));
    await setCover(id, new Blob(["v1"], { type: "image/png" }));
    await setCover(id, new Blob(["v2"], { type: "image/png" }));
    const got = await getRom(id);
    expect(got?.coverBlob).toBeInstanceOf(Blob);
    // Il blob in storage è quello dell'ultima setCover.
    const size = got?.coverBlob ? got.coverBlob.size : 0;
    expect(size).toBe(2); // "v2" → 2 byte
  });

  it("setCover su ROM inesistente solleva (no record orfani)", async () => {
    await expect(
      setCover("ghost-id", new Blob(["x"], { type: "image/png" })),
    ).rejects.toThrow(/non trovata/i);
    expect(await getRom("ghost-id")).toBeUndefined();
  });
});
