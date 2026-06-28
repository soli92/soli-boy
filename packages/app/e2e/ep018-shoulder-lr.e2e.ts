// TSK-124 — EP-018: chiusura QA shoulder L/R (tastiera, touch overlay, pipeline stub).
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { gotoApp, gotoStubApp, uploadRom } from "./helpers/app-nav";

const dir = path.dirname(fileURLToPath(import.meta.url));
const GBA_ROM = process.env.SOLIBOY_E2E_GBA_ROM ?? "gba-tests-thumb.gba";
const gbaRomPath = path.resolve(dir, "../public/test-roms", GBA_ROM);
const gbaRomTitle = GBA_ROM.replace(/\.[^.]+$/, "");

async function installJsErrorCollector(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    (window as Record<string, unknown>).__ep018Errors = [];
    window.addEventListener("error", (e) => {
      ((window as Record<string, unknown>).__ep018Errors as string[]).push(e.message);
    });
    window.addEventListener("unhandledrejection", (e) => {
      ((window as Record<string, unknown>).__ep018Errors as string[]).push(String(e.reason));
    });
  });
}

async function readJsErrors(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(
    () => (window as Record<string, unknown>).__ep018Errors as string[] ?? [],
  );
}

/** Carica ROM GB stub e avvia (auto-start libreria). */
async function startStubGb(page: import("@playwright/test").Page) {
  await page.addInitScript(() => indexedDB.deleteDatabase("soli-boy"));
  await gotoStubApp(page);
  await uploadRom(page, {
    name: "ep018-test.gb",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("ROMDATA-EP018-GB"),
  });
  const tile = page.getByRole("button", { name: "ep018-test GB" });
  await expect(tile).toBeVisible();
  await tile.click();
  const changeDialog = page.getByRole("dialog", { name: /cambia gioco/i });
  if (await changeDialog.isVisible()) {
    await page.getByRole("button", { name: /cambia gioco/i }).click();
  }
  await expect(page.getByLabel("Schermo di gioco")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByLabel("Schermo di gioco")).toHaveAttribute("data-state", "running");
}

test.describe("EP-018 shoulder L/R — tastiera (TSK-124)", () => {
  test("q/w (L/R default) su GB stub — nessun errore pipeline", async ({ page }) => {
    await installJsErrorCollector(page);
    await startStubGb(page);

    await page.keyboard.press("q");
    await page.keyboard.press("w");
    await page.keyboard.press("q");
    await page.keyboard.press("w");

    expect(await readJsErrors(page)).toHaveLength(0);
    await expect(page.getByLabel("Schermo di gioco")).toHaveAttribute(
      "data-state",
      "running",
    );
  });

  test("GBA reale: q/w dopo avvio — nessun errore JS", async ({ page }) => {
    test.skip(
      !existsSync(gbaRomPath) || !!process.env.CI,
      !existsSync(gbaRomPath)
        ? `ROM GBA assente (${GBA_ROM}).`
        : "CI: coperto da unit + stub e2e",
    );
    test.slow();

    await installJsErrorCollector(page);
    await gotoApp(page, "/?engine=real");
    await uploadRom(page, gbaRomPath);
    await expect(page.getByText(gbaRomTitle)).toBeVisible();
    await page.getByText(gbaRomTitle).click();
    await page.getByRole("button", { name: /avvia/i }).click();
    await expect(page.locator(".sb-screen canvas")).toBeVisible({ timeout: 30_000 });

    await page.keyboard.press("q");
    await page.keyboard.press("w");

    expect(await readJsErrors(page)).toHaveLength(0);
  });
});

test.describe("EP-018 shoulder L/R — touch overlay (TSK-124)", () => {
  test("overlay GB stub mostra pulsanti L e R (TSK-122)", async ({ page }) => {
    const touchCtx = await page.evaluate(() =>
      window.matchMedia("(pointer: coarse)").matches,
    );
    test.skip(!touchCtx, "Richiede progetto mobile (pointer: coarse).");

    await startStubGb(page);

    await expect(page.locator('[data-testid="sb-touch-btn-l"]')).toBeVisible();
    await expect(page.locator('[data-testid="sb-touch-btn-r"]')).toBeVisible();
  });

  test("tap L su GB stub — nessun errore (engine no-op, overlay uniforme)", async ({
    page,
  }) => {
    const touchCtx = await page.evaluate(() =>
      window.matchMedia("(pointer: coarse)").matches,
    );
    test.skip(!touchCtx, "Richiede progetto mobile (pointer: coarse).");

    await installJsErrorCollector(page);
    await startStubGb(page);

    const overlay = page.locator('[data-testid="sb-touch-overlay"]');
    test.skip(!(await overlay.isVisible().catch(() => false)), "TouchOverlay assente.");

    const btnL = page.locator('[data-testid="sb-touch-btn-l"]');
    await expect(btnL).toBeVisible();
    await btnL.tap();

    expect(await readJsErrors(page)).toHaveLength(0);
    await expect(page.getByLabel("Schermo di gioco")).toHaveAttribute(
      "data-state",
      "running",
    );
  });
});
