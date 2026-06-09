// TSK-063 — test useCapacitorFilePicker (US-029).
//
// Strategia:
// - `isCapacitorNative`: mock di window.Capacitor per testare guard.
// - `readFileFromUri`: inietta `filesystemApi` mock; verifica conversione base64 → File.
// - `filenameFromUri`: casi URI comuni.
//
// NON mocka l'import dinamico di `@capacitor/filesystem` — usiamo l'iniezione
// diretta via parametro `filesystemApi` per evitare la complessità del
// dynamic-import mock in jsdom.

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isCapacitorNative,
  readFileFromUri,
  filenameFromUri,
  type CapacitorFilesystemApi,
} from "./useCapacitorFilePicker";

// ── helpers ──────────────────────────────────────────────────────────────────

function mockNativePlatform(isNative = true) {
  Object.defineProperty(window, "Capacitor", {
    writable: true,
    configurable: true,
    value: {
      isNativePlatform: () => isNative,
    },
  });
}

function clearNativePlatform() {
  Object.defineProperty(window, "Capacitor", {
    writable: true,
    configurable: true,
    value: undefined,
  });
}

/** Crea una finta API Filesystem che restituisce i byte forniti come base64. */
function fakeFilesystemApi(bytes: Uint8Array): CapacitorFilesystemApi {
  const b64 = btoa(String.fromCharCode(...bytes));
  return {
    readFile: vi.fn().mockResolvedValue({ data: b64 }),
  };
}

/** Crea un'API Filesystem che restituisce un Blob direttamente (path web). */
function fakeFilesystemApiBlob(bytes: Uint8Array): CapacitorFilesystemApi {
  return {
    readFile: vi.fn().mockResolvedValue({ data: new Blob([bytes.buffer as ArrayBuffer]) }),
  };
}

/** Crea un'API Filesystem che rigetta (errore di lettura). */
function fakeFilesystemApiError(): CapacitorFilesystemApi {
  return {
    readFile: vi.fn().mockRejectedValue(new Error("File not found")),
  };
}

// ── isCapacitorNative ─────────────────────────────────────────────────────────

describe("isCapacitorNative", () => {
  afterEach(() => {
    clearNativePlatform();
  });

  it("ritorna true quando Capacitor.isNativePlatform() = true", () => {
    mockNativePlatform(true);
    expect(isCapacitorNative()).toBe(true);
  });

  it("ritorna false quando Capacitor assente (browser/jsdom)", () => {
    clearNativePlatform();
    expect(isCapacitorNative()).toBe(false);
  });

  it("ritorna false quando isNativePlatform() = false", () => {
    mockNativePlatform(false);
    expect(isCapacitorNative()).toBe(false);
  });
});

// ── readFileFromUri ───────────────────────────────────────────────────────────

describe("readFileFromUri", () => {
  const ROM_BYTES = new Uint8Array([0x47, 0x42, 0x5a, 0x65, 0x6c, 0x64, 0x61]); // "GBZelda"
  const URI = "file:///storage/emulated/0/roms/zelda.gbc";
  const FILENAME = "zelda.gbc";

  it("restituisce un File con i byte corretti da base64 (path nativo)", async () => {
    const api = fakeFilesystemApi(ROM_BYTES);
    const file = await readFileFromUri(URI, FILENAME, api);
    expect(file).not.toBeNull();
    expect(file!.name).toBe(FILENAME);
    const buf = await file!.arrayBuffer();
    expect(new Uint8Array(buf)).toEqual(ROM_BYTES);
  });

  it("restituisce un File con i byte corretti da Blob (path web)", async () => {
    const api = fakeFilesystemApiBlob(ROM_BYTES);
    const file = await readFileFromUri(URI, FILENAME, api);
    expect(file).not.toBeNull();
    const buf = await file!.arrayBuffer();
    expect(new Uint8Array(buf)).toEqual(ROM_BYTES);
  });

  it("restituisce null se readFile rigetta (errore lettura)", async () => {
    const api = fakeFilesystemApiError();
    const file = await readFileFromUri(URI, FILENAME, api);
    expect(file).toBeNull();
  });

  it("restituisce null se api è null (api non disponibile)", async () => {
    // Passiamo esplicitamente null come api: il modulo non tenta l'import
    // dinamico (branch `filesystemApi !== undefined` → usa null direttamente)
    // e ritorna null senza effetti collaterali.
    const file = await readFileFromUri(URI, FILENAME, null);
    expect(file).toBeNull();
  });

  it("invoca readFile con il path URI fornito", async () => {
    const api = fakeFilesystemApi(ROM_BYTES);
    await readFileFromUri(URI, FILENAME, api);
    expect(api.readFile).toHaveBeenCalledWith({ path: URI });
  });
});

// ── filenameFromUri ───────────────────────────────────────────────────────────

describe("filenameFromUri", () => {
  it("estrae il filename da URI file:// Android", () => {
    expect(filenameFromUri("file:///storage/emulated/0/roms/zelda.gbc")).toBe("zelda.gbc");
  });

  it("estrae il filename da content:// Android", () => {
    expect(
      filenameFromUri("content://com.android.providers.media/external/audio/media/123/zelda.gba"),
    ).toBe("zelda.gba");
  });

  it("estrae il filename da percorso iOS Files", () => {
    expect(
      filenameFromUri(
        "file:///private/var/mobile/Containers/Data/Application/.../Documents/pokered.gb",
      ),
    ).toBe("pokered.gb");
  });

  it("gestisce URI con spazi codificati (%20)", () => {
    expect(filenameFromUri("file:///storage/emulated/0/My%20Games/mario%20land.gb")).toBe(
      "mario land.gb",
    );
  });

  it("fallback su 'file' se l'URI non contiene un nome", () => {
    expect(filenameFromUri("file:///")).toBe("file");
  });
});
