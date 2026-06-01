// TSK-013 — LibraryService: elenco e rimozione delle ROM (US-004/US-005).
// Servizio di dominio sopra la StoragePort; espone ricerca/filtro ed eliminazione.

import type { StoragePort } from "../storage/port";
import type { RomFilter, RomRecord } from "../storage/types";

export class LibraryService {
  constructor(private readonly storage: StoragePort) {}

  /** Elenca le ROM, opzionalmente filtrate per piattaforma e/o titolo. */
  list(filter?: RomFilter): Promise<RomRecord[]> {
    return this.storage.listRoms(filter);
  }

  /** Rimuove una ROM dalla libreria (idempotente, delega all'adapter). */
  remove(id: string): Promise<void> {
    return this.storage.removeRom(id);
  }
}
