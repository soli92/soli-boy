// TSK-117 — axe-playwright scan post TSK-115 (headings) + TSK-116 (aria-live).
// Verifica 0 violation WCAG 2.2 AA su tab Impostazioni e Player idle.

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("EP-017 US-060 — run_a11y_scan (TSK-117)", () => {
  test("Settings tab: 0 axe violations (heading structure TSK-115)", async ({ page }) => {
    await page.goto("/?engine=stub");
    await page.getByRole("tab", { name: /impostazioni/i }).click();
    await expect(page.getByRole("heading", { name: /controlli — rimappatura/i })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();

    expect(
      results.violations,
      `TSK-117 Settings: ${results.violations.length} violation(s)\n` +
        JSON.stringify(results.violations, null, 2),
    ).toHaveLength(0);
  });

  test("Player idle: 0 axe violations (aria-live TSK-116)", async ({ page }) => {
    await page.goto("/?engine=stub");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();

    expect(
      results.violations,
      `TSK-117 Player idle: ${results.violations.length} violation(s)\n` +
        JSON.stringify(results.violations, null, 2),
    ).toHaveLength(0);
  });
});
