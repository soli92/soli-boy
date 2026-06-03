// @vitest-environment node
// TSK-055 — Unit test della selezione runtime StorageAdapter.
//
// Strategia: iniettiamo un `windowRef` mockato a `selectAdapter` (l'opzione
// esiste proprio per disaccoppiare i test dal `globalThis.window` di jsdom).
// Mock del bridge: stessa "shape" minima di `NativeFsBridge` (TSK-074), così
// il narrow strutturale resta soddisfatto senza importare il package desktop.
//
// DoD coperto:
//   - L'app web usa `IndexedDBAdapter` invariato (bridge assente).
//   - Con `window.soliboyDesktop` mockato, l'app usa `NativeFsAdapter`.
//   - Tipo di ritorno = `StorageBundle` (`SaveStoragePort` + `ConfigPort`)
//     in entrambi i rami (typecheck garantito dal compilatore + asserzioni
//     runtime su istanza di NativeFsAdapter).

import { describe, expect, it } from "vitest";
import { isDesktopRuntime, selectAdapter } from "./select-adapter";
import { indexedDbConfig, indexedDbStorage } from "./indexeddb-adapter";
import { NativeFsAdapter, type NativeFsBridge } from "./native-fs-adapter";

/**
 * Bridge stub strutturalmente compatibile con `NativeFsBridge`. Non eseguiamo
 * I/O qui: il TSK-055 verifica SOLO la selezione (le operazioni filesystem
 * sono coperte da native-fs-adapter.test.ts via InMemoryBridge).
 */
function makeStubBridge(): NativeFsBridge {
  return {
    readFile: async () => new Uint8Array(),
    writeFile: async () => {},
    unlink: async () => {},
    mkdir: async () => {},
    readdir: async () => [],
    stat: async () => ({ exists: false, size: 0, isDirectory: false }),
  };
}

describe("selectAdapter — runtime detection (TSK-055)", () => {
  it("senza bridge desktop ritorna i singleton IndexedDB (web/mobile, default storico)", () => {
    const bundle = selectAdapter({ windowRef: {} });
    expect(bundle.storage).toBe(indexedDbStorage);
    expect(bundle.config).toBe(indexedDbConfig);
  });

  it("con `window.soliboyDesktop` presente ritorna un NativeFsAdapter (desktop)", () => {
    const bridge = makeStubBridge();
    const bundle = selectAdapter({ windowRef: { soliboyDesktop: bridge } });
    expect(bundle.storage).toBeInstanceOf(NativeFsAdapter);
    // Stessa istanza per storage+config: NativeFsAdapter implementa entrambe
    // le porte, evitiamo doppia allocazione (vedi commento in select-adapter.ts).
    expect(bundle.config).toBe(bundle.storage);
  });

  it("`windowRef` undefined → ramo web (no crash quando `window` non esiste)", () => {
    // Simula env `node` (vitest-environment di questo file) chiamando senza
    // override: `globalThis.window` non è definito → ramo IndexedDB.
    const bundle = selectAdapter();
    expect(bundle.storage).toBe(indexedDbStorage);
    expect(bundle.config).toBe(indexedDbConfig);
  });

  it("`window.soliboyDesktop = null` non è considerato desktop (no false-positive)", () => {
    const bundle = selectAdapter({
      // Cast esplicito: vogliamo verificare la robustezza della detection a
      // valori non-oggetto sul campo, per non riprodurre il bug NaN-ish di
      // `typeof null === 'object'` ignorando il null-check.
      windowRef: { soliboyDesktop: null as unknown as NativeFsBridge },
    });
    expect(bundle.storage).toBe(indexedDbStorage);
    expect(bundle.config).toBe(indexedDbConfig);
  });

  it("baseDir override viene propagato al NativeFsAdapter", () => {
    // Smoke: l'override non solleva e produce comunque un NativeFsAdapter.
    // Il path effettivo è opaco dall'esterno (privato); il test su baseDir
    // operativo è in native-fs-adapter.test.ts.
    const bridge = makeStubBridge();
    const bundle = selectAdapter({
      windowRef: { soliboyDesktop: bridge },
      baseDir: "/custom/base",
    });
    expect(bundle.storage).toBeInstanceOf(NativeFsAdapter);
  });
});

describe("isDesktopRuntime — predicato puro (TSK-055)", () => {
  it("ritorna false su window vuoto", () => {
    expect(isDesktopRuntime({})).toBe(false);
  });

  it("ritorna true se `soliboyDesktop` è un oggetto", () => {
    expect(isDesktopRuntime({ soliboyDesktop: makeStubBridge() })).toBe(true);
  });

  it("ritorna false se `soliboyDesktop` è null/undefined", () => {
    expect(
      isDesktopRuntime({ soliboyDesktop: undefined as unknown as NativeFsBridge }),
    ).toBe(false);
    expect(
      isDesktopRuntime({ soliboyDesktop: null as unknown as NativeFsBridge }),
    ).toBe(false);
  });

  it("ritorna false senza argomento quando `globalThis.window` è assente (env node)", () => {
    expect(isDesktopRuntime()).toBe(false);
  });
});
