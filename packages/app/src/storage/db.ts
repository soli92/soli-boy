// TSK-001 — IndexedDB adapter + object store `roms` (ADR-002, db_schemas/indexeddb-stores.md).
// Implementazione locale dello StoragePort per l'asse `roms` (US-001/US-004).
// Tutto on-device: nessun dato verso server esterni (US-033).

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  ConfigRecord,
  RomFilter,
  RomInput,
  RomRecord,
  SaveStateRecord,
  SramRecord,
} from "./types";

export const DB_NAME = "soli-boy";
export const DB_VERSION = 1;

interface SoliBoyDB extends DBSchema {
  roms: {
    key: string;
    value: RomRecord;
    indexes: { by_platform: string; by_title: string };
  };
  saveStates: {
    key: string;
    value: SaveStateRecord;
    indexes: { by_rom: string };
  };
  sram: { key: string; value: SramRecord };
  config: { key: string; value: ConfigRecord };
}

let dbPromise: Promise<IDBPDatabase<SoliBoyDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SoliBoyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SoliBoyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const roms = db.createObjectStore("roms", { keyPath: "id" });
        roms.createIndex("by_platform", "platform");
        roms.createIndex("by_title", "title");

        const saves = db.createObjectStore("saveStates", { keyPath: "id" });
        saves.createIndex("by_rom", "romId");

        db.createObjectStore("sram", { keyPath: "romId" });
        db.createObjectStore("config", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

/**
 * Chiude la connessione al database e ne resetta il riferimento.
 * Capability di produzione (es. teardown dell'app / cambio profilo); riusata dai test.
 */
export async function closeDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}

/** Hash deterministico (FNV-1a 32-bit) del contenuto, usato come id della ROM. */
async function hashBlob(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let h = 0x811c9dc5;
  for (let i = 0; i < buf.length; i++) {
    h ^= buf[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Aggiunge (o sostituisce) una ROM. Ritorna l'id derivato dal contenuto. */
export async function addRom(input: RomInput): Promise<string> {
  const id = await hashBlob(input.fileBlob);
  const record: RomRecord = { ...input, id, addedAt: Date.now() };
  const db = await getDB();
  await db.put("roms", record);
  return id;
}

export async function getRom(id: string): Promise<RomRecord | undefined> {
  return (await getDB()).get("roms", id);
}

export async function removeRom(id: string): Promise<void> {
  await (await getDB()).delete("roms", id);
}

/** Elenca le ROM, opzionalmente filtrate per piattaforma e/o sottostringa del titolo. */
export async function listRoms(filter: RomFilter = {}): Promise<RomRecord[]> {
  const db = await getDB();
  // Usa l'index `by_platform` quando il filtro piattaforma è valorizzato (TS-DESIGN-002),
  // evitando il full-scan in memoria. La query testuale non ha index → filtro in memoria.
  const rows = filter.platform
    ? await db.getAllFromIndex("roms", "by_platform", filter.platform)
    : await db.getAll("roms");
  const q = filter.query?.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => r.title.toLowerCase().includes(q));
}
