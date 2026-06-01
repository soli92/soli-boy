// TSK-005 — persistenza BIOS associata alla piattaforma (US-003).
// Il BIOS è fornito dall'utente; salvato localmente nello store `config` (chiave bios:<platform>).
// Nessuna distribuzione di BIOS (vincolo legale raw/tech_stack.md).

import type { Platform } from "../domain/types";
import { getDB } from "./db";

function biosKey(platform: Platform): string {
  return `bios:${platform}`;
}

/** Salva (o sostituisce) il file BIOS per una piattaforma. */
export async function putBios(platform: Platform, data: Blob): Promise<void> {
  const db = await getDB();
  await db.put("config", { key: biosKey(platform), value: data });
}

/** Recupera il BIOS per una piattaforma, se presente. */
export async function getBios(platform: Platform): Promise<Blob | undefined> {
  const db = await getDB();
  const rec = await db.get("config", biosKey(platform));
  return rec?.value as Blob | undefined;
}

/** True se è presente un BIOS per la piattaforma. */
export async function hasBios(platform: Platform): Promise<boolean> {
  return (await getBios(platform)) !== undefined;
}
