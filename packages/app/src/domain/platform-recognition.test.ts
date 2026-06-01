// TSK-010 — test unit del mapping PlatformRecognition (US-002).
import { describe, expect, it } from "vitest";
import { recognizePlatform } from "./platform-recognition";

describe("recognizePlatform", () => {
  it("riconosce GB → gambatte", () => {
    const r = recognizePlatform("super.gb");
    expect(r.supported).toBe(true);
    expect(r.platform).toBe("GB");
    expect(r.core).toBe("gambatte");
  });

  it("riconosce GBC → gambatte", () => {
    expect(recognizePlatform("zelda.gbc")).toMatchObject({
      platform: "GBC",
      core: "gambatte",
    });
  });

  it("riconosce GBA → mgba (per estensione)", () => {
    expect(recognizePlatform("metroid.gba")).toMatchObject({
      platform: "GBA",
      core: "mgba",
    });
  });

  it("riconosce arcade (.zip) → fbneo", () => {
    expect(recognizePlatform("sf2.zip")).toMatchObject({
      platform: "ARCADE",
      core: "fbneo",
    });
  });

  it("il contenuto (magic GBA 0x96 @0xB2) prevale su estensione ambigua", () => {
    const bytes = new Uint8Array(0x100);
    bytes[0xb2] = 0x96;
    const r = recognizePlatform("dump.bin", bytes);
    expect(r.platform).toBe("GBA");
    expect(r.core).toBe("mgba");
  });

  it("formato non supportato → not supported + reason", () => {
    const r = recognizePlatform("game.nes");
    expect(r.supported).toBe(false);
    expect(r.reason).toMatch(/non supportato|ambiguo/i);
  });

  it("nessuna estensione → not supported", () => {
    expect(recognizePlatform("noext").supported).toBe(false);
  });
});
