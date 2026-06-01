// TSK-001 — IndexedDB adapter + object store `roms` (ADR-002, db_schemas/indexeddb-stores.md).
// Implementazione locale dello StoragePort per l'asse `roms` (US-001/US-004).
// Tutto on-device: nessun dato verso server esterni (US-033).
// TSK-031 — aggiunto l'asse `saveStates`/`sram` (US-016/US-017, ADR-006 §Decisione p.2).

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  ConfigRecord,
  RomFilter,
  RomInput,
  RomRecord,
  SaveStateInput,
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

// === saveStates (TSK-031, US-016) ==============================================

/**
 * Id deterministico di un save state: `<romId>:<slot>:<createdAt>`.
 * Slot multipli per la stessa ROM coesistono perché `createdAt` discrimina
 * i save state creati in momenti diversi sullo stesso slot (non si vuole
 * sovrascrittura silenziosa; per "sostituire" lo slot, l'UI cancella prima).
 */
function saveStateId(romId: string, slot: number, createdAt: number): string {
  return `${romId}:${slot}:${createdAt}`;
}

/**
 * Persiste un nuovo save state. Ritorna l'id generato.
 * L'entry memorizza `core/engine` per consentire al dominio (SaveService) di
 * rifiutare un load cross-engine (ADR-006 §Conseguenze).
 */
export async function putSaveState(input: SaveStateInput): Promise<string> {
  const createdAt = Date.now();
  const id = saveStateId(input.romId, input.slot, createdAt);
  const record: SaveStateRecord = { ...input, id, createdAt };
  const db = await getDB();
  await db.put("saveStates", record);
  return id;
}

/** Elenca i save state di una ROM, ordinati per slot crescente. */
export async function listSaveStates(romId: string): Promise<SaveStateRecord[]> {
  const db = await getDB();
  // Usa l'index `by_rom` (TS-DESIGN-002): evita full-scan dello store.
  const rows = await db.getAllFromIndex("saveStates", "by_rom", romId);
  return rows.sort((a, b) => a.slot - b.slot || a.createdAt - b.createdAt);
}

export async function getSaveState(id: string): Promise<SaveStateRecord | undefined> {
  return (await getDB()).get("saveStates", id);
}

/** Rimuove un save state (idempotente). */
export async function deleteSaveState(id: string): Promise<void> {
  await (await getDB()).delete("saveStates", id);
}

// === SRAM (TSK-031, US-017) ====================================================

/** Persiste (o sostituisce) la SRAM cartuccia per una ROM. */
export async function putSram(romId: string, data: Blob): Promise<void> {
  const db = await getDB();
  const record: SramRecord = { romId, data, updatedAt: Date.now() };
  await db.put("sram", record);
}

/** Recupera la SRAM cartuccia per una ROM, se presente. */
export async function getSram(romId: string): Promise<SramRecord | undefined> {
  return (await getDB()).get("sram", romId);
}
