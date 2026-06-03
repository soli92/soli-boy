// TSK-002 — test del dominio persistenza ROM con StoragePort in-memory (fake).
// TSK-075 — fake esteso con `listRomsMeta` (variante metadata-only).
import { describe, expect, it, vi } from "vitest";
import type { StoragePort } from "../storage/port";
import type { RomInput, RomMeta, RomRecord } from "../storage/types";
import { importRom, titleFromFileName } from "./rom-library";

function fakeStorage(): StoragePort & { added: RomInput[] } {
  const added: RomInput[] = [];
  return {
    added,
    addRom: vi.fn(async (input: RomInput) => {
      added.push(input);
      return "id-" + added.length;
    }),
    listRoms: vi.fn(async () => [] as RomRecord[]),
    listRomsMeta: vi.fn(async () => [] as RomMeta[]),
    getRom: vi.fn(async () => undefined),
    removeRom: vi.fn(async () => {}),
  };
}

describe("titleFromFileName", () => {
  it("rimuove estensione e percorso", () => {
    expect(titleFromFileName("/games/Super Mario Land.gb")).toBe("Super Mario Land");
    expect(titleFromFileName("noext")).toBe("noext");
  });
});

describe("importRom", () => {
  it("persiste una ROM supportata con piattaforma/core risolti", async () => {
    const s = fakeStorage();
    const res = await importRom("zelda.gbc", new Blob(["x"]), s);
    expect(res.ok).toBe(true);
    expect(s.added[0]).toMatchObject({ title: "zelda", platform: "GBC", core: "gambatte" });
  });

  it("rifiuta un formato non supportato senza persistere", async () => {
    const s = fakeStorage();
    const res = await importRom("game.nes", new Blob(["x"]), s);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/non supportato|ambiguo|riconosciuta/i);
    expect(s.added).toHaveLength(0);
    expect(s.addRom).not.toHaveBeenCalled();
  });
});
