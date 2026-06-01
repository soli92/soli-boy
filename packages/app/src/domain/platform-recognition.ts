// TSK-004 — PlatformRecognition (US-002).
// Riconosce piattaforma + core da estensione e (quando disponibile) contenuto del file.
// Mapping piattaforma -> core da api_specs/core-wrapper.md; nessun core proprietario.

import type { Core, Platform } from "./types";

export interface RecognitionResult {
  /** true se la piattaforma è supportata e mappata a un core. */
  supported: boolean;
  platform?: Platform;
  core?: Core;
  /** Motivo, valorizzato quando supported === false. */
  reason?: string;
}

/** Core di default per ciascuna piattaforma (api_specs/core-wrapper.md §Mapping). */
const PLATFORM_TO_CORE: Record<Platform, Core> = {
  GB: "gambatte",
  GBC: "gambatte",
  GBA: "mgba",
  ARCADE: "fbneo",
};

const EXTENSION_TO_PLATFORM: Record<string, Platform> = {
  gb: "GB",
  gbc: "GBC",
  gba: "GBA",
  // Gli arcade sono distribuiti come set in archivio.
  zip: "ARCADE",
};

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

/**
 * Conferma/affina il riconoscimento dal contenuto, quando i primi byte sono noti.
 * GBA espone il magic byte 0x96 a offset 0xB2 dell'header della cartuccia.
 * Ritorna la piattaforma dedotta dal contenuto, o undefined se non determinabile.
 */
function platformFromContent(bytes?: Uint8Array): Platform | undefined {
  if (!bytes || bytes.length < 0xb3) return undefined;
  if (bytes[0xb2] === 0x96) return "GBA";
  return undefined;
}

/**
 * Riconosce la piattaforma di un file di gioco caricato dall'utente.
 * @param fileName nome del file (per l'estensione)
 * @param bytes primi byte del file (opzionali, per la conferma dal contenuto)
 */
export function recognizePlatform(
  fileName: string,
  bytes?: Uint8Array,
): RecognitionResult {
  const ext = extensionOf(fileName);
  const byExt = EXTENSION_TO_PLATFORM[ext];
  const byContent = platformFromContent(bytes);

  // Il contenuto, se determinante (es. GBA), prevale sull'estensione ambigua.
  const platform = byContent ?? byExt;

  if (!platform) {
    return {
      supported: false,
      reason: `Formato non supportato o ambiguo: estensione ".${ext || "?"}". Piattaforme supportate: GB/GBC, GBA, arcade.`,
    };
  }

  return { supported: true, platform, core: PLATFORM_TO_CORE[platform] };
}
