// TSK-002 — StoragePort (ADR-002, api_specs/storage-port.md).
// Porta di persistenza consumata dal dominio; gli adapter (IndexedDB, filesystem nativo)
// la implementano. Qui l'asse `roms` (US-001/US-004/US-005).

import type { RomFilter, RomInput, RomRecord } from "./types";

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
