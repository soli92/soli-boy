// TSK-013 — test LibraryService con StoragePort fake.
// TSK-075 — fake esteso con `listRomsMeta` (variante metadata-only).
import { describe, expect, it, vi } from "vitest";
import type { StoragePort } from "../storage/port";
import type { RomFilter, RomRecord } from "../storage/types";
import { LibraryService } from "./library-service";

function rec(id: string, title: string, platform: RomRecord["platform"]): RomRecord {
  return { id, title, platform, core: "gambatte", fileBlob: new Blob([id]), addedAt: 0 };
}

function fakeStorage(rows: RomRecord[]): StoragePort {
  return {
    addRom: vi.fn(async () => "x"),
    listRoms: vi.fn(async (f?: RomFilter) =>
      rows.filter((r) => !f?.platform || r.platform === f.platform),
    ),
    listRomsMeta: vi.fn(async (f?: RomFilter) =>
      rows
        .filter((r) => !f?.platform || r.platform === f.platform)
        .map(({ fileBlob: _omit, ...meta }) => {
          void _omit;
          return meta;
        }),
    ),
    getRom: vi.fn(async () => undefined),
    removeRom: vi.fn(async () => {}),
  };
}

describe("LibraryService", () => {
  it("list inoltra il filtro alla porta", async () => {
    const storage = fakeStorage([rec("1", "Tetris", "GB"), rec("2", "Metroid", "GBA")]);
    const svc = new LibraryService(storage);
    expect(await svc.list()).toHaveLength(2);
    expect(await svc.list({ platform: "GB" })).toHaveLength(1);
    expect(storage.listRoms).toHaveBeenCalledWith({ platform: "GB" });
  });

  it("remove delega alla porta", async () => {
    const storage = fakeStorage([]);
    await new LibraryService(storage).remove("42");
    expect(storage.removeRom).toHaveBeenCalledWith("42");
  });
});
