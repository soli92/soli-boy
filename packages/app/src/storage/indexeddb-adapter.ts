// TSK-002 — Adapter IndexedDB della StoragePort (ADR-002).
// Implementazione web/mobile (WebView) basata su src/storage/db.ts.
// TSK-031 — aggiunta degli assi saveStates/sram (ADR-006 §Decisione p.2).
// TSK-127 — aggiunto l'asse rtcState (ADR-009 §3, US-066).
import {
  addRom,
  deleteRtcState,
  deleteSaveState,
  getConfig,
  getRom,
  getRtcState,
  getSaveState,
  getSram,
  listRoms,
  listRomsMeta,
  listSaveStates,
  putRtcState,
  putSaveState,
  putSram,
  removeRom,
  setConfig,
  setCover,
} from "./db";
import type { ConfigPort, SaveStoragePort } from "./port";

// Adapter unico che implementa l'intera porta di persistenza locale: ROM
// (TSK-002), save state e SRAM (TSK-031). I consumer ROM-only (componenti UI
// di libreria) possono restringerne il tipo a `StoragePort` per interface
// segregation; il `SaveService` (TSK-031) consuma `SaveStoragePort`.
// TSK-075 — aggiunto `listRomsMeta` (variante metadata-only di `listRoms`).
export const indexedDbStorage: SaveStoragePort = {
  addRom,
  listRoms,
  listRomsMeta,
  getRom,
  removeRom,
  putSaveState,
  listSaveStates,
  getSaveState,
  deleteSaveState,
  putSram,
  getSram,
  setCover,
  // TSK-127 — asse rtcState (US-066, ADR-009 §3).
  putRtcState,
  getRtcState,
  deleteRtcState,
};

// TSK-036 F-036-01 — Adapter ConfigPort sullo store `config`. Esposto separato
// per consentire ai consumer di richiedere solo la capability di cui hanno
// bisogno (interface segregation), senza tirarsi dietro il contratto ROM/save.
export const indexedDbConfig: ConfigPort = {
  getConfig,
  setConfig,
};
