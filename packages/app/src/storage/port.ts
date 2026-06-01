// TSK-002 — StoragePort (ADR-002, api_specs/storage-port.md).
// Porta di persistenza consumata dal dominio; gli adapter (IndexedDB, filesystem nativo)
// la implementano. Qui l'asse `roms` (US-001/US-004/US-005).
// TSK-031 — aggiunti gli assi `saveStates` (US-016) e `sram` (US-017) come interfacce
// segmentate (ADR-006 §Decisione p.2): il dominio dei salvataggi consuma solo la porta
// che gli serve (interface segregation), evitando coupling spurio per i consumer ROM-only.

import type {
  RomFilter,
  RomInput,
  RomRecord,
  SaveStateInput,
  SaveStateRecord,
  SramRecord,
} from "./types";

export interface StoragePort {
  /** Aggiunge (o sostituisce) una ROM. Ritorna l'id derivato dal contenuto. */
  addRom(input: RomInput): Promise<string>;
  /** Elenca le ROM, opzionalmente filtrate per piattaforma e/o titolo. */
  listRoms(filter?: RomFilter): Promise<RomRecord[]>;
  /** Recupera una ROM per id. */
  getRom(id: string): Promise<RomRecord | undefined>;
  /** Rimuove una ROM (idempotente). */
  removeRom(id: string): Promise<void>;
}

/**
 * Porta save state (US-016, ADR-006 §Decisione p.2).
 * Separata da StoragePort per consentire ai consumer ROM-only (componenti UI
 * di libreria) di non dipendere dal contratto dei salvataggi. L'IndexedDBAdapter
 * implementa entrambe le porte; il SaveService consuma `SaveStatePort` (e legge
 * il `RomRecord` via la `StoragePort` per il guard cross-engine).
 */
export interface SaveStatePort {
  /**
   * Persiste un nuovo save state. Ritorna l'id generato.
   * L'entry memorizza `core/engine` per validare la compatibilità cross-engine
   * in fase di restore/import (ADR-006 §Conseguenze).
   */
  putSaveState(input: SaveStateInput): Promise<string>;
  /** Elenca i save state associati a una ROM (per slot crescente). */
  listSaveStates(romId: string): Promise<SaveStateRecord[]>;
  /** Recupera un save state per id. */
  getSaveState(id: string): Promise<SaveStateRecord | undefined>;
  /** Rimuove un save state (idempotente). */
  deleteSaveState(id: string): Promise<void>;
}

/**
 * Porta SRAM (US-017, ADR-006 §Decisione p.2).
 * Una entry SRAM per ROM (chiave `romId`); è la SRAM della cartuccia, distinta
 * dal save state (istantanea dell'emulatore).
 */
export interface SramPort {
  /** Persiste (o sostituisce) la SRAM cartuccia per la ROM `romId`. */
  putSram(romId: string, data: Blob): Promise<void>;
  /** Recupera la SRAM cartuccia per una ROM, se presente. */
  getSram(romId: string): Promise<SramRecord | undefined>;
}

/**
 * Porta completa per i salvataggi: combina save state + SRAM + accesso ROM
 * (il SaveService legge `RomRecord` per derivare il `core` canonico ed
 * etichettare l'entry saveState, ADR-006 §Conseguenze).
 */
export interface SaveStoragePort extends StoragePort, SaveStatePort, SramPort {}
