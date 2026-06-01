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

export interface SaveStateRecord {
  id: string;
  romId: string;
  slot: number;
  snapshotBlob: Blob;
  createdAt: number;
}

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
