// TSK-002 — Adapter IndexedDB della StoragePort (ADR-002).
// Implementazione web/mobile (WebView) basata su src/storage/db.ts.
// TSK-031 — aggiunta degli assi saveStates/sram (ADR-006 §Decisione p.2).
import {
  addRom,
  deleteSaveState,
  getConfig,
  getRom,
  getSaveState,
  getSram,
  listRoms,
  listSaveStates,
  putSaveState,
  putSram,
  removeRom,
  setConfig,
} from "./db";
import type { ConfigPort, SaveStoragePort } from "./port";

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

// TSK-036 F-036-01 — Adapter ConfigPort sullo store `config`. Esposto separato
// per consentire ai consumer di richiedere solo la capability di cui hanno
// bisogno (interface segregation), senza tirarsi dietro il contratto ROM/save.
export const indexedDbConfig: ConfigPort = {
  getConfig,
  setConfig,
};
