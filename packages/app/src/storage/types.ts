// TSK-001 — tipi di persistenza (db_schemas/indexeddb-stores.md).
import type { Core, Platform } from "../domain/types";

export interface RomRecord {
  /** hash del contenuto del file (keyPath store `roms`). */
  id: string;
  title: string;
  platform: Platform;
  core: Core;
  fileBlob: Blob;
  coverBlob?: Blob;
  addedAt: number;
}

/** Dati per aggiungere una ROM; `id` e `addedAt` sono derivati dall'adapter. */
export type RomInput = Omit<RomRecord, "id" | "addedAt">;

/**
 * Vista "metadata-only" del `RomRecord`, esposta da `StoragePort.listRomsMeta`
 * (TSK-075). Esclude il `fileBlob` — il binario della ROM, dimensione KB-MB,
 * costo IPC eager su NativeFsAdapter (vedi `code_quality/reports/TSK-054-iter-1.json` §F-2).
 *
 * Cosa è incluso vs escluso (decisione esplicita TSK-075):
 *  - inclusi: id, title, platform, core, addedAt, **coverBlob?** (opzionale).
 *  - esclusi: fileBlob.
 *
 * `coverBlob` resta nel meta perché la Library lo renderizza nelle tile (`<img>`);
 * è un payload piccolo (immagine, tipicamente decine di KB) e opzionale (assente
 * per ROM senza cover → zero IPC). Il vero costo F-2 erano gli N round-trip su
 * `fileBlob` (ROM binari) che la UI NON consumava — quelli sono eliminati.
 *
 * Per ottenere il `RomRecord` completo (incluso `fileBlob`) usare `getRom(id)`
 * (path lazy on-demand, es. quando il Player seleziona una ROM).
 */
export type RomMeta = Omit<RomRecord, "fileBlob">;

export interface SaveStateRecord {
  id: string;
  romId: string;
  slot: number;
  snapshotBlob: Blob;
  /**
   * Core/engine che ha prodotto lo snapshot (ADR-006 §Conseguenze).
   * Il formato dei save state è specifico per engine/versione: un payload
   * prodotto da gambatte/WasmBoy NON è caricabile da mGBA. Memorizzato qui
   * per consentire al SaveService di rifiutare un load cross-engine (US-016)
   * e per validare l'import (US-019, TSK-033).
   */
  core: Core;
  createdAt: number;
}

/**
 * Input per creare una nuova entry `saveStates` (TSK-031, US-016).
 * `id` e `createdAt` sono derivati dall'adapter.
 */
export type SaveStateInput = Omit<SaveStateRecord, "id" | "createdAt">;

export interface SramRecord {
  romId: string;
  data: Blob;
  updatedAt: number;
}

export interface ConfigRecord {
  key: string;
  value: unknown;
}

export interface RomFilter {
  platform?: Platform;
  /** sottostringa case-insensitive sul titolo. */
  query?: string;
}
