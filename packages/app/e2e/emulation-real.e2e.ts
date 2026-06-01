// TSK-027 — e2e emulazione REALE con WasmBoyEngine (?engine=real) su ROM libera GB.
// WasmBoy è ESM bundlato (no CDN/decompressione core) → eseguibile anche in CI.
// Si attiva se è presente la ROM libera dmg-acid2.gb (MIT) in public/test-roms/.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const dir = path.dirname(fileURLToPath(import.meta.url));
const FREE_ROM = process.env.SOLIBOY_E2E_ROM ?? "dmg-acid2.gb";
const romPath = path.resolve(dir, "../public/test-roms", FREE_ROM);
const romTitle = FREE_ROM.replace(/\.[^.]+$/, "");

test.describe("emulazione reale (WasmBoyEngine, GB)", () => {
  test.skip(!existsSync(romPath), `ROM libera assente (${FREE_ROM}).`);

  test("carica ROM GB libera → WasmBoy rende il canvas", async ({ page }) => {
    test.slow();
    await page.goto("/?engine=real");
    await page.getByLabel("Carica ROM").setInputFiles(romPath);
    await expect(page.getByText(romTitle)).toBeVisible();
    await page.getByText(romTitle).click();
    await page.getByRole("button", { name: /avvia/i }).click();
    // WasmBoyEngine crea un <canvas> nel viewport e avvia l'emulazione.
    await expect(page.locator(".sb-screen canvas")).toBeVisible({ timeout: 30_000 });
  });
});
