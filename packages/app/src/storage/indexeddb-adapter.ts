// TSK-002 — Adapter IndexedDB della StoragePort (ADR-002).
// Implementazione web/mobile (WebView) basata su src/storage/db.ts.
import { addRom, getRom, listRoms, removeRom } from "./db";
import type { StoragePort } from "./port";

export const indexedDbStorage: StoragePort = {
  addRom,
  listRoms,
  getRom,
  removeRom,
};
