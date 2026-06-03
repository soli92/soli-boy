// TSK-001 — IndexedDB adapter + object store `roms` (ADR-002, db_schemas/indexeddb-stores.md).
// Implementazione locale dello StoragePort per l'asse `roms` (US-001/US-004).
// Tutto on-device: nessun dato verso server esterni (US-033).
// TSK-031 — aggiunto l'asse `saveStates`/`sram` (US-016/US-017, ADR-006 §Decisione p.2).

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  ConfigRecord,
  RomFilter,
  RomInput,
  RomMeta,
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

// === Cover (TSK-039, US-009) ===================================================
// Associa/aggiorna la copertina di una ROM esistente. La copertina è fornita
// dall'utente (no fetch esterni — US-033 privacy on-device, ribadita in
// architecture-overview §EP-002 "Fonte cover: caricata dall'utente").
// Idempotente sul `coverBlob` per `romId`: legge il record, set `coverBlob`,
// put atomico in transazione single-store. Errore se la ROM non esiste
// (non vogliamo creare record orfani).

export async function setCover(romId: string, cover: Blob): Promise<void> {
  const db = await getDB();
  // Transazione esplicita readwrite per garantire atomicità del get→put: senza
  // questa, un removeRom concorrente potrebbe inserirsi tra le due operazioni
  // e ci troveremmo a ri-creare un record "fantasma" senza fileBlob valido.
  const tx = db.transaction("roms", "readwrite");
  const existing = await tx.store.get(romId);
  if (!existing) {
    await tx.done;
    throw new Error(`ROM non trovata: ${romId}`);
  }
  await tx.store.put({ ...existing, coverBlob: cover });
  await tx.done;
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

/**
 * TSK-075 — variante "metadata-only" di `listRoms`: stessa semantica di
 * filtro, ritorna `RomMeta[]` (senza `fileBlob`). Su IndexedDB il costo è
 * equivalente a `listRoms` (idb deserializza il record intero comunque, il
 * Blob è già materializzato in memoria) — il valore aggiunto è **interfaccia
 * omogenea** con `NativeFsAdapter.listRomsMeta`, dove invece il salto del
 * fileBlob elimina N round-trip IPC `readFile` (chiusura finding F-2 del
 * code-review di TSK-054). Vedi `./port.ts §StoragePort.listRomsMeta`.
 */
export async function listRomsMeta(filter: RomFilter = {}): Promise<RomMeta[]> {
  const rows = await listRoms(filter);
  return rows.map(toMeta);
}

/** Strip del `fileBlob` da un `RomRecord`. Helper inline (no copia profonda). */
function toMeta(r: RomRecord): RomMeta {
  // Distruzione per esclusione: il `coverBlob` (opzionale) resta nel meta.
  // Niente clone profondo del Blob → riferimento condiviso, ammissibile perché
  // il Blob è immutabile per contratto Web Platform.
  // F-3 (CQRL TSK-075 iter-1): il prefisso `_` sopprime il warning
  // "declared but never read" sia in TS che in ESLint via convenzione nativa,
  // rendendo superfluo il `void` esplicito (pattern idiomatico TS 5.x).
  const { fileBlob: _fileBlob, ...meta } = r;
  return meta;
}

// === saveStates (TSK-031, US-016) ==============================================

/**
 * Id univoco di un save state: `<romId>:<slot>:<createdAt>:<uuid>`.
 * Prefisso leggibile (romId/slot/createdAt) per debug/ispezione, suffisso
 * `crypto.randomUUID()` come tiebreaker ad alta entropia: due salvataggi sullo
 * stesso slot entro 1ms (Date.now collisione) restano entry distinte e non si
 * sovrascrivono silenziosamente (F-031-1-R2). `createdAt` resta sul record per
 * l'ordinamento in `listSaveStates`.
 * NB: index composto (slot,createdAt) per ordering server-side è non necessario
 * sul volume atteso (US-016 = pochi slot per ROM); ordering in memoria è O(n log n)
 * su n piccolo (F-031-1-D1 documentato qui, deliberatamente non implementato).
 */
function saveStateId(romId: string, slot: number, createdAt: number): string {
  return `${romId}:${slot}:${createdAt}:${crypto.randomUUID()}`;
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

// === Config store generico (TSK-036 F-036-01) ===================================
// Accesso tipato per chiavi arbitrarie sullo store `config` (keyPath "key", v1).
// Usato per persistere preferenze applicative (es. `video-settings`); il pattern
// `bios:<platform>` resta servito dal modulo `bios.ts` (chiavi prefissate).

/**
 * Recupera il valore associato a una chiave nel config store.
 * Ritorna `undefined` se la chiave non esiste.
 * Il caller è responsabile della validazione del payload (lo store è untyped).
 */
export async function getConfig<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const rec = await db.get("config", key);
  return rec?.value as T | undefined;
}

/**
 * Persiste (o sostituisce) il valore associato a `key` nel config store.
 * Idempotente: la chiave è il keyPath del record.
 */
export async function setConfig<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put("config", { key, value });
}
