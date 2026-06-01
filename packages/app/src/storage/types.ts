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
