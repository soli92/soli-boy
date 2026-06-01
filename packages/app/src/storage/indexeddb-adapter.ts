// TSK-002 — Adapter IndexedDB della StoragePort (ADR-002).
// Implementazione web/mobile (WebView) basata su src/storage/db.ts.
// TSK-031 — aggiunta degli assi saveStates/sram (ADR-006 §Decisione p.2).
import {
  addRom,
  deleteSaveState,
  getRom,
  getSaveState,
  getSram,
  listRoms,
  listSaveStates,
  putSaveState,
  putSram,
  removeRom,
} from "./db";
import type { SaveStoragePort } from "./port";

// Adapter unico che implementa l'intera porta di persistenza locale: ROM
// (TSK-002), save state e SRAM (TSK-031). I consumer ROM-only (componenti UI
// di libreria) possono restringerne il tipo a `StoragePort` per interface
// segregation; il `SaveService` (TSK-031) consuma `SaveStoragePort`.
export const indexedDbStorage: SaveStoragePort = {
  addRom,
  listRoms,
  getRom,
  removeRom,
  putSaveState,
  listSaveStates,
  getSaveState,
  deleteSaveState,
  putSram,
  getSram,
};
