// @vitest-environment node
// TSK-005 — test persistenza BIOS + policy (US-003).
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { requiresBios } from "../domain/bios-policy";
import { closeDB } from "./db";
import { getBios, hasBios, putBios } from "./bios";

beforeEach(async () => {
  await closeDB();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("soli-boy");
    req.onsuccess = () => resolve();
    req.onblocked = () => resolve();
    req.onerror = () => reject(req.error);
  });
});

describe("bios policy", () => {
  it("GBA richiede BIOS, GB/GBC/arcade no", () => {
    expect(requiresBios("GBA")).toBe(true);
    expect(requiresBios("GB")).toBe(false);
    expect(requiresBios("GBC")).toBe(false);
    expect(requiresBios("ARCADE")).toBe(false);
  });
});

describe("bios storage", () => {
  it("putBios persiste e getBios/hasBios recuperano per piattaforma", async () => {
    expect(await hasBios("GBA")).toBe(false);
    await putBios("GBA", new Blob(["bios-bytes"]));
    expect(await hasBios("GBA")).toBe(true);
    const b = await getBios("GBA");
    expect(b).toBeInstanceOf(Blob);
    // isolamento per piattaforma
    expect(await hasBios("GB")).toBe(false);
  });
});
