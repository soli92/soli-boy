// TSK-005 — policy BIOS (US-003): quali piattaforme richiedono un BIOS fornito dall'utente.
import type { Platform } from "./types";

/** Piattaforme che richiedono il BIOS per la piena compatibilità (specifiche §7.2: GBA). */
const REQUIRES_BIOS: ReadonlySet<Platform> = new Set<Platform>(["GBA"]);

export function requiresBios(platform: Platform): boolean {
  return REQUIRES_BIOS.has(platform);
}
