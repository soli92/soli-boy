// TSK-119 — Manual check R-04: axe scan TouchOverlayConfigPanel post TSK-114.
// Eseguito sul progetto `mobile` (pointer: coarse, hasTouch).

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function isTouchContext(page: import("@playwright/test").Page): Promise<boolean> {
  return page.evaluate(() => window.matchMedia("(pointer: coarse)").matches);
}

async function openTouchConfigPanel(page: import("@playwright/test").Page): Promise<void> {
  await page.addInitScript(() => indexedDB.deleteDatabase("soli-boy"));
  await page.goto("/?engine=stub");
  await page.getByRole("tab", { name: "Libreria" }).click();
  await page.getByLabel("Carica ROM").setInputFiles({
    name: "touch-config.gb",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("ROMDATA-GB"),
  });
  const tile = page.getByRole("button", { name: /touch-config GB/i });
  await expect(tile).toBeVisible();
  await tile.click();
  const changeDialog = page.getByRole("dialog", { name: /cambia gioco/i });
  if (await changeDialog.isVisible()) {
    await page.getByRole("button", { name: /cambia gioco/i }).click();
  }
  await expect(page.getByLabel("Schermo di gioco")).toBeVisible({ timeout: 10_000 });

  const overlay = page.locator('[data-testid="sb-touch-overlay"]');
  await expect(overlay).toBeVisible({ timeout: 5_000 });
  await page.getByTestId("sb-touch-config-toggle").click();
  await expect(page.getByTestId("sb-touch-config-panel")).toBeVisible();
}

test.describe("EP-017 US-061 — run_a11y_scan TouchOverlay config (TSK-119)", () => {
  test("config panel aperto: heading + slider annunciabili, 0 axe violation", async ({
    page,
  }) => {
    test.skip(
      !(await isTouchContext(page)),
      "Contesto non-touch: usa il progetto mobile (pointer: coarse).",
    );

    await openTouchConfigPanel(page);

    const panel = page.getByTestId("sb-touch-config-panel");
    await expect(panel).not.toHaveAttribute("aria-hidden", "true");
    await expect(
      page.getByRole("heading", { name: /configurazione overlay touch/i }),
    ).toBeVisible();

    const opacity = page.getByTestId("sb-touch-config-opacity");
    await expect(opacity).toHaveAttribute("aria-label", "Opacità overlay");

    const results = await new AxeBuilder({ page })
      .include('[data-testid="sb-touch-config-panel"]')
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();

    expect(
      results.violations,
      `TSK-119 config panel: ${results.violations.length} violation(s)\n` +
        JSON.stringify(results.violations, null, 2),
    ).toHaveLength(0);
  });
});
