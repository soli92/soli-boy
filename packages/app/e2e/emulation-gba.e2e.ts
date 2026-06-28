// TSK-028 — e2e emulazione REALE GBA con MgbaEngine (?engine=real).
// Si attiva solo se presente una ROM GBA LIBERA (homebrew/free) in public/test-roms/.
// L'adapter mGBA non è ancora verificato a runtime: questo e2e lo validerà quando
// sarà disponibile una ROM GBA libera (vedi public/test-roms/README.md).
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const dir = path.dirname(fileURLToPath(import.meta.url));
const GBA_ROM = process.env.SOLIBOY_E2E_GBA_ROM ?? "gba-tests-thumb.gba";
const romPath = path.resolve(dir, "../public/test-roms", GBA_ROM);
const romTitle = GBA_ROM.replace(/\.[^.]+$/, "");

test.describe("emulazione reale (MgbaEngine, GBA)", () => {
  test.skip(
    !existsSync(romPath) || !!process.env.CI,
    !existsSync(romPath)
      ? `ROM GBA libera assente (${GBA_ROM}).`
      : "CI: coperto da emulation-gba-save.e2e.ts",
  );

  test.describe.configure({ mode: "serial" });

  test("carica ROM GBA libera → mGBA rende il canvas", async ({ page }) => {
    test.slow();
    await page.goto("/?engine=real");
    await page.getByLabel("Carica ROM").setInputFiles(romPath);
    // IA a 4 tab (increment 2): la tile ROM vive nella tab Libreria.
    await page.getByRole("tab", { name: "Libreria" }).click();
    await expect(page.getByText(romTitle)).toBeVisible();
    await page.getByText(romTitle).click();
    await page.getByRole("button", { name: /avvia/i }).click();
    await expect(page.locator(".sb-screen canvas")).toBeVisible({ timeout: 30_000 });
  });
});
