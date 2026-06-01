// TSK-002 — dominio persistenza ROM: riconosce la piattaforma e persiste via StoragePort.
// Collega PlatformRecognition (TSK-004) e StoragePort (TSK-002). Tech-agnostico sull'adapter.

import type { StoragePort } from "../storage/port";
import { recognizePlatform } from "./platform-recognition";

export interface ImportOk {
  ok: true;
  id: string;
}
export interface ImportError {
  ok: false;
  reason: string;
}
export type ImportResult = ImportOk | ImportError;

/** Titolo derivato dal nome file (senza estensione né percorso). */
export function titleFromFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? fileName;
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(0, dot) : base;
}

/**
 * Importa una ROM fornita dall'utente: riconosce la piattaforma e, se supportata,
 * la persiste tramite la porta di storage. Non viene inviato nulla a server esterni.
 */
export async function importRom(
  fileName: string,
  fileBlob: Blob,
  storage: StoragePort,
  headerBytes?: Uint8Array,
): Promise<ImportResult> {
  const rec = recognizePlatform(fileName, headerBytes);
  if (!rec.supported || !rec.platform || !rec.core) {
    return { ok: false, reason: rec.reason ?? "Piattaforma non riconosciuta." };
  }
  const id = await storage.addRom({
    title: titleFromFileName(fileName),
    platform: rec.platform,
    core: rec.core,
    fileBlob,
  });
  return { ok: true, id };
}
