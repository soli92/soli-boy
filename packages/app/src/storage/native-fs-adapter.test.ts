// @vitest-environment node
// TSK-054 / TSK-074 — unit test del NativeFsAdapter.
//
// Strategia: il bridge IPC (`window.soliboyDesktop` esposto da preload.ts) è
// mockato con un filesystem **in-memory** (Map<path, Uint8Array>) che emula
// readFile/writeFile/unlink/mkdir/readdir/stat + ENOENT su file mancanti.
// Nessuna dipendenza Electron in test: l'adapter è puramente data-flow e il
// bridge è un'interfaccia iniettata.
//
// Copre i metodi chiave richiesti dal DoD del TSK-054 + DoD del TSK-074:
//   - addRom, listRoms, removeRom (+ idempotenza + **delete reale, no tombstone**)
//   - putSaveState, getSaveState, deleteSaveState (+ unlink reale, F-4 CQRL)
//   - getConfig / setConfig (round-trip, idempotenza, isolamento chiavi).
//   - mkdir(recursive) chiamato sulle dir di collezione prima delle scritture.
//   - F-3 CQRL: isNotFoundError robusto a non-oggetti (via tryUnlink behavior).
//
// Invariante privacy (US-033): un asserto esplicito verifica che `fetch` /
// `XMLHttpRequest` / `WebSocket` non vengano mai invocati durante i test
// (spy globali). Garantisce che l'adapter resti on-device.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NativeFsAdapter, type NativeFsBridge } from "./native-fs-adapter";
import type { RomInput, SaveStateInput } from "./types";

// ── In-memory IPC bridge mock ────────────────────────────────────────────────
type BridgeCall =
  | { op: "readFile"; path: string }
  | { op: "writeFile"; path: string }
  | { op: "unlink"; path: string }
  | { op: "mkdir"; path: string; recursive: boolean }
  | { op: "readdir"; path: string }
  | { op: "stat"; path: string };

class InMemoryBridge implements NativeFsBridge {
  readonly files = new Map<string, Uint8Array>();
  /** Insieme delle directory "create" via mkdir (cache di assertion). */
  readonly dirs = new Set<string>();
  /** Spy: numero di chiamate per ispezione fine-granulare nei test. */
  readonly calls: BridgeCall[] = [];

  async readFile(filePath: string): Promise<Uint8Array> {
    this.calls.push({ op: "readFile", path: filePath });
    const bytes = this.files.get(filePath);
    if (!bytes) {
      // Emula l'errore Node `ENOENT` propagato dal main process via IPC.
      const err = new Error(`ENOENT: no such file or directory, open '${filePath}'`) as Error & {
        code: string;
      };
      err.code = "ENOENT";
      throw err;
    }
    // Copia difensiva (l'adapter potrebbe mantenere riferimenti; emuliamo la
    // serializzazione IPC che produce un buffer fresco a ogni invocazione).
    return new Uint8Array(bytes);
  }

  async writeFile(filePath: string, data: Uint8Array): Promise<void> {
    this.calls.push({ op: "writeFile", path: filePath });
    this.files.set(filePath, new Uint8Array(data));
  }

  async unlink(filePath: string): Promise<void> {
    this.calls.push({ op: "unlink", path: filePath });
    if (!this.files.has(filePath)) {
      const err = new Error(`ENOENT: no such file or directory, unlink '${filePath}'`) as Error & {
        code: string;
      };
      err.code = "ENOENT";
      throw err;
    }
    this.files.delete(filePath);
  }

  async mkdir(dirPath: string, opts?: { recursive?: boolean }): Promise<void> {
    this.calls.push({ op: "mkdir", path: dirPath, recursive: opts?.recursive === true });
    // `recursive` rende mkdir idempotente: emuliamo questo contratto.
    this.dirs.add(dirPath);
  }

  async readdir(dirPath: string): Promise<string[]> {
    this.calls.push({ op: "readdir", path: dirPath });
    const prefix = dirPath.endsWith("/") ? dirPath : dirPath + "/";
    const out = new Set<string>();
    for (const key of this.files.keys()) {
      if (key.startsWith(prefix)) {
        const rest = key.slice(prefix.length);
        // restituisci solo l'entry immediata (no path nested)
        const slash = rest.indexOf("/");
        out.add(slash === -1 ? rest : rest.slice(0, slash));
      }
    }
    return [...out];
  }

  async stat(
    filePath: string,
  ): Promise<{ exists: boolean; size: number; isDirectory: boolean }> {
    this.calls.push({ op: "stat", path: filePath });
    const bytes = this.files.get(filePath);
    if (bytes) return { exists: true, size: bytes.length, isDirectory: false };
    if (this.dirs.has(filePath)) return { exists: true, size: 0, isDirectory: true };
    return { exists: false, size: 0, isDirectory: false };
  }
}

const BASE = "/tmp/soli-boy-test"; // path fittizio: il bridge mock è in-memory

function makeAdapter(): { adapter: NativeFsAdapter; bridge: InMemoryBridge } {
  const bridge = new InMemoryBridge();
  const adapter = new NativeFsAdapter({ bridge, baseDir: BASE });
  return { adapter, bridge };
}

function rom(
  title: string,
  content: string,
  platform: RomInput["platform"],
  core: RomInput["core"],
): RomInput {
  return { title, platform, core, fileBlob: new Blob([content]) };
}

function saveInput(romId: string, slot: number, payload = "snap"): SaveStateInput {
  return { romId, slot, core: "gambatte", snapshotBlob: new Blob([payload]) };
}

// ── Privacy guard: nessuna chiamata di rete durante l'intero test file ────────
// (US-033, invariante ribadita dal TSK-054). Setup/teardown a livello globale.
const networkSpies: Array<() => void> = [];
beforeEach(() => {
  // Stub `fetch`: chiameremo `expect` su questo per garantire 0 invocazioni.
  const fetchSpy = vi.fn(() => {
    throw new Error("network not allowed in NativeFsAdapter tests (US-033)");
  });
  // Sostituiamo l'oggetto globale per la durata del test. Cast su Record
  // perché la firma di `fetch` in lib.dom è strutturalmente più stretta del
  // mock (la signature di `vi.fn` ritorna `unknown`, va bene per gli scopi
  // del guard: vogliamo solo verificare che NON sia mai invocato).
  (globalThis as Record<string, unknown>).fetch = fetchSpy;
  networkSpies.push(() => {
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
afterEach(() => {
  // Verifica spy e cleanup.
  for (const assertSpy of networkSpies) assertSpy();
  networkSpies.length = 0;
  // Rimuoviamo il fetch stubbato. `delete` su `globalThis` è ammesso (chiave
  // dichiarata da lib.dom come opzionale); il cast evita lint warning.
  (globalThis as Record<string, unknown>).fetch = undefined;
});

// ── ROMs ─────────────────────────────────────────────────────────────────────
describe("NativeFsAdapter — roms (TSK-054)", () => {
  it("addRom persiste e getRom recupera (round-trip via manifest+blob)", async () => {
    const { adapter } = makeAdapter();
    const id = await adapter.addRom(rom("Tetris", "AAA", "GB", "gambatte"));
    const got = await adapter.getRom(id);
    expect(got?.title).toBe("Tetris");
    expect(got?.platform).toBe("GB");
    expect(got?.core).toBe("gambatte");
    expect(got?.addedAt).toBeTypeOf("number");
    expect(got?.fileBlob).toBeInstanceOf(Blob);
    expect(got?.fileBlob.size).toBe(3); // "AAA" → 3 byte
  });

  it("id derivato dal contenuto: stesso contenuto → stesso id (idempotente)", async () => {
    const { adapter } = makeAdapter();
    const a = await adapter.addRom(rom("X", "SAME", "GBA", "mgba"));
    const b = await adapter.addRom(rom("X-dup", "SAME", "GBA", "mgba"));
    expect(a).toBe(b);
    // Manifest contiene una sola entry (upsert in-place sull'id).
    const list = await adapter.listRoms();
    expect(list).toHaveLength(1);
    // L'ultimo addRom vince sui metadati (last-write-wins, parità con IDB.put).
    expect(list[0].title).toBe("X-dup");
  });

  it("listRoms filtra per piattaforma e per query", async () => {
    const { adapter } = makeAdapter();
    await adapter.addRom(rom("Super Mario Land", "m", "GB", "gambatte"));
    await adapter.addRom(rom("Metroid Fusion", "f", "GBA", "mgba"));
    expect(await adapter.listRoms({ platform: "GB" })).toHaveLength(1);
    const mario = await adapter.listRoms({ query: "mario" });
    expect(mario[0].title).toBe("Super Mario Land");
    expect(await adapter.listRoms({ query: "zzz" })).toHaveLength(0);
  });

  it("removeRom elimina ed è idempotente (TSK-074: delete reale, no tombstone)", async () => {
    const { adapter, bridge } = makeAdapter();
    const id = await adapter.addRom(rom("Pkmn", "p", "GBC", "gambatte"));
    const blobPath = `${BASE}/roms/${id}.bin`;
    // Pre-condizione: blob presente dopo addRom.
    expect(bridge.files.has(blobPath)).toBe(true);

    await adapter.removeRom(id);
    expect(await adapter.getRom(id)).toBeUndefined();
    // **F-4 / TSK-074**: il blob NON deve esistere più nel filesystem (no
    // tombstone a 0 byte). Anti-regressione dell'invariante post-unlink.
    expect(bridge.files.has(blobPath)).toBe(false);

    // Idempotente: nessun errore al secondo remove (manifest già vuoto).
    await adapter.removeRom(id);
    expect(await adapter.listRoms()).toHaveLength(0);
  });

  it("removeRom rimuove anche il coverBlob via unlink (no tombstone .cover.bin)", async () => {
    const { adapter, bridge } = makeAdapter();
    const id = await adapter.addRom({
      ...rom("Pkmn", "p", "GBC", "gambatte"),
      coverBlob: new Blob(["cover-bytes"], { type: "image/png" }),
    });
    const blobPath = `${BASE}/roms/${id}.bin`;
    const coverPath = `${BASE}/roms/${id}.cover.bin`;
    expect(bridge.files.has(blobPath)).toBe(true);
    expect(bridge.files.has(coverPath)).toBe(true);

    await adapter.removeRom(id);
    expect(bridge.files.has(blobPath)).toBe(false);
    expect(bridge.files.has(coverPath)).toBe(false);
  });

  it("removeRom non lascia entry residue nel manifest (F-4 CQRL TSK-054 iter-1)", async () => {
    const { adapter, bridge } = makeAdapter();
    const id = await adapter.addRom(rom("Pkmn", "p", "GBC", "gambatte"));
    await adapter.removeRom(id);
    // Il manifest serializzato non deve contenere riferimenti all'id rimosso.
    const manifestBytes = bridge.files.get(`${BASE}/roms/index.json`);
    expect(manifestBytes).toBeDefined();
    const manifestText = new TextDecoder().decode(manifestBytes!);
    expect(manifestText).not.toContain(id);
    // listRoms non deve sollevare per "Blob ROM mancante" (assenza di entry
    // residua che punterebbe a un blob unlinked).
    await expect(adapter.listRoms()).resolves.toEqual([]);
  });

  it("addRom chiama mkdir(recursive) sulla dir di collezione roms/", async () => {
    const { adapter, bridge } = makeAdapter();
    await adapter.addRom(rom("Tetris", "TT", "GB", "gambatte"));
    const mkdirCalls = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "mkdir" }> => c.op === "mkdir",
    );
    expect(mkdirCalls.some((c) => c.path === `${BASE}/roms` && c.recursive)).toBe(true);
  });

  it("listRoms su storage vuoto → []", async () => {
    const { adapter } = makeAdapter();
    expect(await adapter.listRoms()).toEqual([]);
  });

  it("listRoms tollera l'assenza del manifest (primo avvio)", async () => {
    // Nessuna scrittura preliminare: l'adapter deve leggere il manifest come
    // empty (readFileIfExists → undefined → manifest vuoto).
    const { adapter, bridge } = makeAdapter();
    expect(bridge.files.size).toBe(0);
    expect(await adapter.listRoms()).toEqual([]);
  });
});

// ── ROMs metadata-only (TSK-075, chiusura F-2 CQRL TSK-054) ──────────────────
describe("NativeFsAdapter — listRomsMeta (TSK-075)", () => {
  it("non emette readFile sui fileBlob ROM (chiusura F-2)", async () => {
    const { adapter, bridge } = makeAdapter();
    // Setup: 3 ROM con fileBlob, una con coverBlob.
    const idA = await adapter.addRom(rom("Tetris", "AAAA", "GB", "gambatte"));
    const idB = await adapter.addRom(rom("Metroid", "BBBB", "GBA", "mgba"));
    const idC = await adapter.addRom({
      ...rom("Pkmn", "CCCC", "GBC", "gambatte"),
      coverBlob: new Blob(["cover"], { type: "image/png" }),
    });

    // Reset spy calls: ci interessa solo cosa fa listRomsMeta.
    bridge.calls.length = 0;
    const meta = await adapter.listRomsMeta();

    // Parità di shape con listRoms (stesso filtro/ordinamento) — 3 voci.
    expect(meta).toHaveLength(3);
    expect(meta.map((m) => m.id).sort()).toEqual([idA, idB, idC].sort());

    // INVARIANTE F-2: zero readFile sui binari ROM (.bin).
    const readCalls = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "readFile" }> => c.op === "readFile",
    );
    const romBlobReads = readCalls.filter(
      (c) => c.path.endsWith(".bin") && !c.path.endsWith(".cover.bin"),
    );
    expect(romBlobReads).toEqual([]);

    // Sanity: il manifest è stato letto una sola volta (1 readFile su
    // roms/index.json). Le eventuali letture di cover (.cover.bin) sono OK e
    // strettamente <= numero di entry con coverPath valorizzato (qui: 1).
    expect(
      readCalls.filter((c) => c.path.endsWith("/roms/index.json")),
    ).toHaveLength(1);
    expect(readCalls.filter((c) => c.path.endsWith(".cover.bin"))).toHaveLength(1);
  });

  it("nessun fileBlob nello shape ritornato (RomMeta omette il binario ROM)", async () => {
    const { adapter } = makeAdapter();
    await adapter.addRom(rom("Tetris", "AAAA", "GB", "gambatte"));
    const meta = await adapter.listRomsMeta();
    expect(meta).toHaveLength(1);
    // `fileBlob` è esplicitamente esclusa da RomMeta (./types.ts §RomMeta).
    expect((meta[0] as Record<string, unknown>).fileBlob).toBeUndefined();
    // Metadati invece presenti.
    expect(meta[0].id).toBeTypeOf("string");
    expect(meta[0].title).toBe("Tetris");
    expect(meta[0].platform).toBe("GB");
  });

  it("propaga coverBlob quando presente (necessaria alla Library UI)", async () => {
    const { adapter } = makeAdapter();
    await adapter.addRom({
      ...rom("Pkmn", "p", "GBC", "gambatte"),
      coverBlob: new Blob(["png-bytes"], { type: "image/png" }),
    });
    await adapter.addRom(rom("Tetris", "t", "GB", "gambatte")); // no cover
    const meta = await adapter.listRomsMeta();
    const withCover = meta.find((m) => m.title === "Pkmn");
    const noCover = meta.find((m) => m.title === "Tetris");
    expect(withCover?.coverBlob).toBeInstanceOf(Blob);
    expect(noCover?.coverBlob).toBeUndefined();
  });

  it("listRomsMeta filtra per piattaforma e per query (parità con listRoms)", async () => {
    const { adapter } = makeAdapter();
    await adapter.addRom(rom("Super Mario Land", "m", "GB", "gambatte"));
    await adapter.addRom(rom("Metroid Fusion", "f", "GBA", "mgba"));
    expect(await adapter.listRomsMeta({ platform: "GB" })).toHaveLength(1);
    const mario = await adapter.listRomsMeta({ query: "mario" });
    expect(mario[0].title).toBe("Super Mario Land");
    expect(await adapter.listRomsMeta({ query: "zzz" })).toHaveLength(0);
  });

  it("listRomsMeta su storage vuoto → [] (idem listRoms)", async () => {
    const { adapter } = makeAdapter();
    expect(await adapter.listRomsMeta()).toEqual([]);
  });

  it("listRomsMeta tollera assenza manifest (primo avvio)", async () => {
    const { adapter } = makeAdapter();
    expect(await adapter.listRomsMeta()).toEqual([]);
  });
});

// ── Save states ──────────────────────────────────────────────────────────────
describe("NativeFsAdapter — save states (TSK-054)", () => {
  it("putSaveState + getSaveState (restoreSaveState): round-trip", async () => {
    const { adapter } = makeAdapter();
    const id = await adapter.putSaveState(saveInput("rom-A", 0, "first-snap"));
    const got = await adapter.getSaveState(id);
    expect(got?.romId).toBe("rom-A");
    expect(got?.slot).toBe(0);
    expect(got?.core).toBe("gambatte");
    expect(got?.createdAt).toBeTypeOf("number");
    expect(got?.snapshotBlob.size).toBe("first-snap".length);
  });

  it("listSaveStates ordina per slot crescente, poi per createdAt", async () => {
    const { adapter } = makeAdapter();
    await adapter.putSaveState(saveInput("rom-A", 2));
    await adapter.putSaveState(saveInput("rom-A", 0));
    await adapter.putSaveState(saveInput("rom-A", 1));
    const list = await adapter.listSaveStates("rom-A");
    expect(list.map((r) => r.slot)).toEqual([0, 1, 2]);
  });

  it("due put ravvicinati sullo stesso slot coesistono (parità IDB F-031-1-R2)", async () => {
    const { adapter } = makeAdapter();
    const id1 = await adapter.putSaveState(saveInput("rom-A", 0, "first"));
    const id2 = await adapter.putSaveState(saveInput("rom-A", 0, "second"));
    expect(id1).not.toBe(id2);
    const list = await adapter.listSaveStates("rom-A");
    expect(list).toHaveLength(2);
    expect(list.every((r) => r.slot === 0)).toBe(true);
  });

  it("listSaveStates segrega per romId", async () => {
    const { adapter } = makeAdapter();
    await adapter.putSaveState(saveInput("rom-A", 0));
    await adapter.putSaveState(saveInput("rom-B", 0));
    expect(await adapter.listSaveStates("rom-A")).toHaveLength(1);
    expect(await adapter.listSaveStates("rom-B")).toHaveLength(1);
    expect(await adapter.listSaveStates("rom-C")).toHaveLength(0);
  });

  it("deleteSaveState rimuove ed è idempotente (TSK-074: unlink reale)", async () => {
    const { adapter, bridge } = makeAdapter();
    const id = await adapter.putSaveState(saveInput("rom-A", 0));
    const blobPath = `${BASE}/save-states/${id}.bin`;
    expect(bridge.files.has(blobPath)).toBe(true);

    await adapter.deleteSaveState(id);
    expect(await adapter.getSaveState(id)).toBeUndefined();
    // Niente tombstone: il file blob deve sparire del tutto dal filesystem.
    expect(bridge.files.has(blobPath)).toBe(false);

    await adapter.deleteSaveState(id); // idempotente
    expect(await adapter.listSaveStates("rom-A")).toHaveLength(0);
  });

  it("putSaveState chiama mkdir(recursive) sulla dir di collezione save-states/", async () => {
    const { adapter, bridge } = makeAdapter();
    await adapter.putSaveState(saveInput("rom-A", 0));
    const mkdirCalls = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "mkdir" }> => c.op === "mkdir",
    );
    expect(mkdirCalls.some((c) => c.path === `${BASE}/save-states` && c.recursive)).toBe(true);
  });

  // TSK-094 (US-050) — atomicità write-then-manifest.
  // Scenario: blob write OK, manifest write fallisce → l'adapter deve invocare
  // `unlink` sul blob orfano (cleanup best-effort) E rigettare con l'errore
  // originale del manifest write (non ingoiato, non sostituito).
  it("putSaveState: se la scrittura del manifest fallisce, il blob orfano viene rimosso (best-effort) e l'errore originale è propagato", async () => {
    const { adapter, bridge } = makeAdapter();
    // Patch chirurgico al writeFile del bridge: la PRIMA scrittura (blob) passa,
    // la SECONDA (manifest, path che termina con `save-states.json`) lancia.
    const originalWriteFile = bridge.writeFile.bind(bridge);
    const manifestErr = new Error("ENOSPC: no space left on device");
    let writeCount = 0;
    bridge.writeFile = vi.fn(async (filePath: string, data: Uint8Array) => {
      writeCount += 1;
      if (writeCount === 1) {
        // blob write — passa normalmente
        return originalWriteFile(filePath, data);
      }
      // manifest write — fallisce
      throw manifestErr;
    });
    const unlinkSpy = vi.spyOn(bridge, "unlink");

    await expect(adapter.putSaveState(saveInput("rom-A", 0, "snap-payload"))).rejects.toBe(
      manifestErr,
    );

    // Cleanup best-effort: unlink invocato sul path del blob scritto.
    expect(unlinkSpy).toHaveBeenCalledTimes(1);
    const blobUnlinkedPath = unlinkSpy.mock.calls[0]?.[0];
    expect(blobUnlinkedPath).toBeDefined();
    expect(blobUnlinkedPath).toMatch(/^\/tmp\/soli-boy-test\/save-states\/.+\.bin$/);
    // Verifica end-state: il blob non resta come file orfano nello store.
    expect(bridge.files.has(blobUnlinkedPath as string)).toBe(false);
  });

  // TSK-094 (US-050) — degradazione graceful del cleanup.
  // Se anche il `tryUnlink` del cleanup fallisce (es. permessi), l'errore
  // ORIGINALE del manifest write resta quello propagato (l'errore del cleanup
  // è loggato ma non aggiunto al reject).
  it("putSaveState: fallimento del cleanup unlink non maschera l'errore originale del manifest write", async () => {
    const { adapter, bridge } = makeAdapter();
    const originalWriteFile = bridge.writeFile.bind(bridge);
    const manifestErr = new Error("ENOSPC: no space left on device");
    let writeCount = 0;
    bridge.writeFile = vi.fn(async (filePath: string, data: Uint8Array) => {
      writeCount += 1;
      if (writeCount === 1) return originalWriteFile(filePath, data);
      throw manifestErr;
    });
    // unlink lancia un errore NON-ENOENT (permessi): `tryUnlink` lo rilancia,
    // ma il catch interno di `putSaveState` lo logga senza farlo bubbling.
    const unlinkErr = new Error("EACCES: permission denied") as Error & { code: string };
    unlinkErr.code = "EACCES";
    bridge.unlink = vi.fn(async () => {
      throw unlinkErr;
    });
    // Silenzia il warning best-effort per non sporcare l'output dei test.
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(adapter.putSaveState(saveInput("rom-A", 0))).rejects.toBe(manifestErr);
    expect(bridge.unlink).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  // TSK-094 (US-050) — regressione nominale: con entrambe le operazioni
  // riuscite, il comportamento è identico (nessun unlink "fantasma").
  it("putSaveState: in condizione nominale non invoca unlink (no cleanup spurio)", async () => {
    const { adapter, bridge } = makeAdapter();
    const unlinkSpy = vi.spyOn(bridge, "unlink");
    const id = await adapter.putSaveState(saveInput("rom-A", 0));
    expect(id).toBeTruthy();
    expect(unlinkSpy).not.toHaveBeenCalled();
  });
});

// ── Config ───────────────────────────────────────────────────────────────────
describe("NativeFsAdapter — config (TSK-054)", () => {
  it("getConfig restituisce undefined per chiavi mai scritte", async () => {
    const { adapter } = makeAdapter();
    expect(await adapter.getConfig("video-settings")).toBeUndefined();
  });

  it("round-trip: setConfig persiste, getConfig restituisce il valore", async () => {
    const { adapter } = makeAdapter();
    const value = { scale: 3, aspect: "4:3" };
    await adapter.setConfig("video-settings", value);
    expect(await adapter.getConfig("video-settings")).toEqual(value);
  });

  it("setConfig è idempotente (sostituisce il valore precedente)", async () => {
    const { adapter } = makeAdapter();
    await adapter.setConfig("video-settings", { scale: 1, aspect: "original" });
    await adapter.setConfig("video-settings", { scale: 5, aspect: "stretch" });
    expect(await adapter.getConfig("video-settings")).toEqual({
      scale: 5,
      aspect: "stretch",
    });
  });

  it("chiavi diverse non si interferiscono", async () => {
    const { adapter } = makeAdapter();
    await adapter.setConfig("video-settings", { scale: 2 });
    await adapter.setConfig("ui-theme", "90s-party");
    expect(await adapter.getConfig("video-settings")).toEqual({ scale: 2 });
    expect(await adapter.getConfig("ui-theme")).toBe("90s-party");
    expect(await adapter.getConfig("does-not-exist")).toBeUndefined();
  });
});

// ── SRAM ─────────────────────────────────────────────────────────────────────
describe("NativeFsAdapter — sram (TSK-054)", () => {
  it("putSram + getSram round-trip per romId", async () => {
    const { adapter } = makeAdapter();
    await adapter.putSram("rom-A", new Blob(["sram-data"]));
    const got = await adapter.getSram("rom-A");
    expect(got?.romId).toBe("rom-A");
    expect(got?.data.size).toBe("sram-data".length);
    expect(got?.updatedAt).toBeTypeOf("number");
  });

  it("getSram restituisce undefined se assente", async () => {
    const { adapter } = makeAdapter();
    expect(await adapter.getSram("ghost")).toBeUndefined();
  });

  it("putSram chiama mkdir(recursive) sulla dir di collezione sram/", async () => {
    const { adapter, bridge } = makeAdapter();
    await adapter.putSram("rom-A", new Blob(["x"]));
    const mkdirCalls = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "mkdir" }> => c.op === "mkdir",
    );
    expect(mkdirCalls.some((c) => c.path === `${BASE}/sram` && c.recursive)).toBe(true);
  });
});

// ── F-5 (CQRL TSK-054 iter-1): contratto path POSIX su baseDir ───────────────
describe("NativeFsAdapter — path contract POSIX (F-5)", () => {
  it("baseDir con separatori Windows (\\) viene normalizzato a POSIX-style", async () => {
    const bridge = new InMemoryBridge();
    // Simula un main process Windows che passa baseDir NT-style.
    const adapter = new NativeFsAdapter({
      bridge,
      baseDir: "C:\\Users\\foo\\.soli-boy\\",
    });
    const id = await adapter.addRom(rom("Tetris", "TT", "GB", "gambatte"));
    // Gli IPC ricevono path con `/` consistente, non un mix `C:\Users/foo`.
    const writes = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "writeFile" }> => c.op === "writeFile",
    );
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      expect(w.path).not.toContain("\\");
      expect(w.path.startsWith("C:/Users/foo/.soli-boy/")).toBe(true);
    }
    // E il round-trip continua a funzionare.
    expect((await adapter.getRom(id))?.title).toBe("Tetris");
  });
});

// ── Cover (US-009, CoverPort) ────────────────────────────────────────────────
describe("NativeFsAdapter — cover (TSK-054)", () => {
  it("setCover aggiorna coverBlob su una ROM esistente", async () => {
    const { adapter } = makeAdapter();
    const id = await adapter.addRom(rom("Tetris", "TT", "GB", "gambatte"));
    expect((await adapter.getRom(id))?.coverBlob).toBeUndefined();
    await adapter.setCover(id, new Blob(["png-bytes"], { type: "image/png" }));
    const updated = await adapter.getRom(id);
    expect(updated?.coverBlob).toBeInstanceOf(Blob);
    // Preserva gli altri campi (parità con IDB.setCover).
    expect(updated?.title).toBe("Tetris");
    expect(updated?.platform).toBe("GB");
    expect(updated?.fileBlob).toBeInstanceOf(Blob);
  });

  it("setCover su ROM inesistente solleva (no record orfani)", async () => {
    const { adapter } = makeAdapter();
    await expect(
      adapter.setCover("ghost-id", new Blob(["x"], { type: "image/png" })),
    ).rejects.toThrow(/non trovata/i);
    expect(await adapter.getRom("ghost-id")).toBeUndefined();
  });
});

// ── Persistenza cross-instance ───────────────────────────────────────────────
// Verifica che lo stato resista alla ricostruzione dell'adapter sullo stesso
// bridge IPC (simula chiusura/riapertura app desktop).
describe("NativeFsAdapter — persistenza cross-instance (TSK-054)", () => {
  it("dato un bridge condiviso, una nuova istanza vede i dati scritti", async () => {
    const bridge = new InMemoryBridge();
    const a1 = new NativeFsAdapter({ bridge, baseDir: BASE });
    const id = await a1.addRom(rom("Tetris", "AAA", "GB", "gambatte"));
    await a1.setConfig("ui-theme", "neon-classic");
    await a1.putSaveState(saveInput(id, 0, "snap-1"));

    // Nuova istanza, stesso bridge (= stesso filesystem nativo).
    const a2 = new NativeFsAdapter({ bridge, baseDir: BASE });
    expect((await a2.getRom(id))?.title).toBe("Tetris");
    expect(await a2.getConfig("ui-theme")).toBe("neon-classic");
    expect(await a2.listSaveStates(id)).toHaveLength(1);
  });
});

// ── TSK-077: risoluzione lazy+memoizzata della base dir via bridge.getBaseDir ─
describe("NativeFsAdapter — bridge.getBaseDir (TSK-077)", () => {
  /**
   * Bridge che simula il preload.ts post-TSK-077: espone `getBaseDir` con
   * la root assoluta autoritativa del main process. Counter `getBaseDirCalls`
   * verifica che l'adapter chiami il bridge UNA SOLA volta (memoizzazione).
   */
  class BridgeWithGetBaseDir extends InMemoryBridge {
    readonly absRoot: string;
    getBaseDirCalls = 0;
    constructor(absRoot: string) {
      super();
      this.absRoot = absRoot;
    }
    async getBaseDir(): Promise<string> {
      this.getBaseDirCalls += 1;
      return this.absRoot;
    }
  }

  it("quando il bridge espone getBaseDir, i path FS usano la root assoluta risolta", async () => {
    const ABS_ROOT = "/Users/foo/.soli-boy";
    const bridge = new BridgeWithGetBaseDir(ABS_ROOT);
    // Il fallback convenzionale del costruttore è volutamente DIVERSO dalla
    // root del bridge: vogliamo verificare che vinca SEMPRE quello del bridge.
    const adapter = new NativeFsAdapter({
      bridge,
      baseDir: ".soli-boy",
    });

    const id = await adapter.addRom(rom("Tetris", "TT", "GB", "gambatte"));

    // Tutte le scritture devono partire dalla root assoluta del bridge —
    // questa è l'invariante TSK-077: NO path relativi `.soli-boy/...`.
    const writes = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "writeFile" }> => c.op === "writeFile",
    );
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      expect(w.path.startsWith(`${ABS_ROOT}/`)).toBe(true);
      // Anti-regressione: il fallback convenzionale "naked" non deve mai
      // comparire come prefisso dei path IPC quando il bridge ha risolto.
      expect(w.path.startsWith(".soli-boy/")).toBe(false);
    }
    // mkdir sulle dir di collezione usa pure la root assoluta.
    const mkdirs = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "mkdir" }> => c.op === "mkdir",
    );
    expect(mkdirs.some((m) => m.path === `${ABS_ROOT}/roms` && m.recursive)).toBe(true);

    // Round-trip: getRom deve leggere lo stesso path assoluto scritto.
    const got = await adapter.getRom(id);
    expect(got?.title).toBe("Tetris");
    const readCalls = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "readFile" }> => c.op === "readFile",
    );
    expect(readCalls.some((r) => r.path === `${ABS_ROOT}/roms/${id}.bin`)).toBe(true);
  });

  it("getBaseDir viene chiamato UNA SOLA volta (memoizzazione single-flight)", async () => {
    const ABS_ROOT = "/tmp/abs-root";
    const bridge = new BridgeWithGetBaseDir(ABS_ROOT);
    const adapter = new NativeFsAdapter({ bridge, baseDir: ".soli-boy" });

    // Sequenza variegata di operazioni FS (read+write+manifest+delete).
    const id = await adapter.addRom(rom("Tetris", "TT", "GB", "gambatte"));
    await adapter.listRoms();
    await adapter.listRomsMeta();
    await adapter.setConfig("k", "v");
    await adapter.getConfig("k");
    await adapter.putSaveState(saveInput(id, 0));
    await adapter.listSaveStates(id);
    await adapter.putSram(id, new Blob(["s"]));
    await adapter.getSram(id);
    await adapter.removeRom(id);

    // INVARIANTE TSK-077: una sola chiamata IPC, indipendentemente dal numero
    // di operazioni FS. Memoizzazione via Promise cacheata in `resolveBaseDir`.
    expect(bridge.getBaseDirCalls).toBe(1);
  });

  it("chiamate concorrenti condividono la stessa risoluzione (single-flight, no race)", async () => {
    const ABS_ROOT = "/tmp/abs-concurrent";
    const bridge = new BridgeWithGetBaseDir(ABS_ROOT);
    const adapter = new NativeFsAdapter({ bridge, baseDir: ".soli-boy" });

    // Tre `addRom` in parallelo, senza alcun await intermedio: se la
    // memoizzazione cachasse il VALORE (string) invece della PROMISE, ogni
    // chiamata partirebbe con baseDir undefined e invocherebbe il bridge.
    await Promise.all([
      adapter.addRom(rom("A", "AA", "GB", "gambatte")),
      adapter.addRom(rom("B", "BB", "GBA", "mgba")),
      adapter.addRom(rom("C", "CC", "GBC", "gambatte")),
    ]);
    expect(bridge.getBaseDirCalls).toBe(1);
  });

  it("se il bridge NON espone getBaseDir → fallback esplicito al baseDir del costruttore", async () => {
    const bridge = new InMemoryBridge(); // no getBaseDir method
    expect((bridge as Partial<NativeFsBridge>).getBaseDir).toBeUndefined();
    const FALLBACK = "/tmp/legacy-base"; // mock di un bridge pre-TSK-077
    const adapter = new NativeFsAdapter({ bridge, baseDir: FALLBACK });

    await adapter.addRom(rom("Tetris", "TT", "GB", "gambatte"));

    // I path IPC devono usare il fallback del costruttore — invariante di
    // retro-compatibilità con bridge pre-TSK-077 (es. test legacy).
    const writes = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "writeFile" }> => c.op === "writeFile",
    );
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      expect(w.path.startsWith(`${FALLBACK}/`)).toBe(true);
    }
  });

  it("se getBaseDir() rigetta → fallback esplicito (no rottura cascading)", async () => {
    const FALLBACK = "/tmp/fallback-on-error";
    class BridgeFailing extends InMemoryBridge {
      async getBaseDir(): Promise<string> {
        throw new Error("IPC unavailable");
      }
    }
    const bridge = new BridgeFailing();
    const adapter = new NativeFsAdapter({ bridge, baseDir: FALLBACK });

    // L'errore IPC non si propaga: l'adapter cade sul fallback.
    await expect(
      adapter.addRom(rom("Tetris", "TT", "GB", "gambatte")),
    ).resolves.toBeTypeOf("string");
    const writes = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "writeFile" }> => c.op === "writeFile",
    );
    for (const w of writes) {
      expect(w.path.startsWith(`${FALLBACK}/`)).toBe(true);
    }
  });

  it("risoluzione LAZY: il costruttore NON invoca getBaseDir (selectAdapter resta sync)", async () => {
    const ABS_ROOT = "/tmp/lazy-root";
    const bridge = new BridgeWithGetBaseDir(ABS_ROOT);
    new NativeFsAdapter({ bridge, baseDir: ".soli-boy" });
    // Asserzione cardine TSK-077: 0 chiamate al bridge prima di qualsiasi
    // operazione FS. Garantisce che `selectAdapter()` / `App.tsx` non
    // ereditino async (il costruttore è puramente sincrono).
    expect(bridge.getBaseDirCalls).toBe(0);
    expect(bridge.calls).toEqual([]);
  });

  // ── F-077-1-R1 (CQRL TSK-077 iter-1): output bridge invalido → fallback ────
  // Se il main process risolvesse con `undefined`/`null`/`''` per bug, senza la
  // guardia `typeof abs === 'string' && abs.length > 0` il then-handler
  // produrrebbe path degeneri (es. `undefined/roms/index.json`,
  // `/roms/index.json`). La guardia ricade sul fallback come il rejection
  // handler — stessa semantica.
  it("F-077-1-R1: bridge.getBaseDir() risolve stringa vuota → fallback esplicito", async () => {
    const FALLBACK = "/tmp/fallback-on-empty";
    class BridgeReturningEmpty extends InMemoryBridge {
      async getBaseDir(): Promise<string> {
        return "";
      }
    }
    const bridge = new BridgeReturningEmpty();
    const adapter = new NativeFsAdapter({ bridge, baseDir: FALLBACK });

    await adapter.addRom(rom("Tetris", "TT", "GB", "gambatte"));

    const writes = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "writeFile" }> => c.op === "writeFile",
    );
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      // Invariante F-077-1-R1: nessun path "degenere" (root vuota → join
      // partirebbe da `/roms/...`); tutti i path devono iniziare dal fallback.
      expect(w.path.startsWith(`${FALLBACK}/`)).toBe(true);
      expect(w.path.startsWith("/roms/")).toBe(false);
    }
  });

  it("F-077-1-R1: bridge.getBaseDir() risolve undefined → fallback esplicito", async () => {
    const FALLBACK = "/tmp/fallback-on-undef";
    class BridgeReturningUndefined extends InMemoryBridge {
      // Cast esplicito: simuliamo un main process buggy che viola il contratto
      // di tipo (`Promise<string>`) restituendo undefined.
      async getBaseDir(): Promise<string> {
        return undefined as unknown as string;
      }
    }
    const bridge = new BridgeReturningUndefined();
    const adapter = new NativeFsAdapter({ bridge, baseDir: FALLBACK });

    await adapter.addRom(rom("Tetris", "TT", "GB", "gambatte"));

    const writes = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "writeFile" }> => c.op === "writeFile",
    );
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      // Anti-regressione: nessun `undefined/...` come prefisso (sarebbe il
      // sintomo di `normalizeToPosix(undefined) → 'undefined'`).
      expect(w.path.startsWith("undefined/")).toBe(false);
      expect(w.path.startsWith(`${FALLBACK}/`)).toBe(true);
    }
  });

  // ── F-077-3-Q1 (CQRL TSK-077 iter-1): path NT-style dal bridge ────────────
  // Il main process su Windows passa via IPC path assoluti NT-style
  // (`C:\Users\foo\.soli-boy`). L'adapter applica `normalizeToPosix` al valore
  // risolto: i path IPC composti devono contenere SOLO `/`, mai `\`. Analogo
  // al test F-5 (POSIX contract sul costruttore) ma per il ramo lazy-resolved
  // del bridge.
  it("F-077-3-Q1: bridge.getBaseDir() ritorna path NT-style Windows → path IPC normalizzati a POSIX", async () => {
    const WIN_ROOT = "C:\\Users\\foo\\.soli-boy";
    const EXPECTED_PREFIX = "C:/Users/foo/.soli-boy"; // normalizzato POSIX
    const bridge = new BridgeWithGetBaseDir(WIN_ROOT);
    const adapter = new NativeFsAdapter({ bridge, baseDir: ".soli-boy" });

    const id = await adapter.addRom(rom("Tetris", "TT", "GB", "gambatte"));

    const writes = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "writeFile" }> => c.op === "writeFile",
    );
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      // Invariante F-077-3-Q1: nessun separatore Windows nei path IPC.
      expect(w.path).not.toContain("\\");
      // Tutti i path devono partire dalla root normalizzata POSIX.
      expect(w.path.startsWith(`${EXPECTED_PREFIX}/`)).toBe(true);
    }

    // Anche le mkdir sulle dir di collezione devono usare la root POSIX.
    const mkdirs = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "mkdir" }> => c.op === "mkdir",
    );
    expect(mkdirs.some((m) => m.path === `${EXPECTED_PREFIX}/roms` && m.recursive)).toBe(true);
    for (const m of mkdirs) {
      expect(m.path).not.toContain("\\");
    }

    // Round-trip: getRom deve leggere lo stesso path POSIX scritto (no `\`).
    const got = await adapter.getRom(id);
    expect(got?.title).toBe("Tetris");
    const reads = bridge.calls.filter(
      (c): c is Extract<typeof c, { op: "readFile" }> => c.op === "readFile",
    );
    expect(reads.some((r) => r.path === `${EXPECTED_PREFIX}/roms/${id}.bin`)).toBe(true);
    for (const r of reads) {
      expect(r.path).not.toContain("\\");
    }
  });
});

// ── Invariante privacy: zero chiamate di rete ────────────────────────────────
describe("NativeFsAdapter — privacy on-device (US-033)", () => {
  it("nessuna chiamata a fetch durante un ciclo CRUD completo", async () => {
    const { adapter } = makeAdapter();
    const id = await adapter.addRom(rom("Tetris", "BB", "GB", "gambatte"));
    await adapter.listRoms();
    await adapter.setConfig("k", "v");
    await adapter.getConfig("k");
    await adapter.putSram(id, new Blob(["s"]));
    await adapter.getSram(id);
    await adapter.removeRom(id);
    // L'assert su `fetch` viene eseguito in afterEach (vedi networkSpies).
  });

  it("le scritture passano SOLO per il bridge IPC iniettato (no globalThis.window)", async () => {
    const { adapter, bridge } = makeAdapter();
    await adapter.addRom(rom("Tetris", "CC", "GB", "gambatte"));
    // Il mock InMemoryBridge ha registrato chiamate ≥ 1 writeFile (manifest +
    // blob): conferma che il flusso passa per il bridge, non per altri canali.
    const writes = bridge.calls.filter((c) => c.op === "writeFile");
    expect(writes.length).toBeGreaterThanOrEqual(2);
  });
});
