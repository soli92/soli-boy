// Visual Oracle — TSK-169 (US-106 / EP-022)
// Matrice: mobile(375) × [cyberpunk, 90s-party] + desktop(1280) × [cyberpunk, 90s-party]
// Output: code_quality/reports/TSK-169-visual-iter-1/<viewport>-<theme>.png
// NB: usa data-theme sull'<html> (custom theme system), non prefers-color-scheme.

import path from "path";
import { fileURLToPath } from "url";
import { test, type Page } from "@playwright/test";
import {
  dismissPrivacyBannerIfVisible,
  waitForAppBoot,
} from "./helpers/app-nav";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "../../..");

const REPORT_DIR = path.resolve(
  REPO_ROOT,
  "code_quality/reports/TSK-169-visual-iter-1",
);

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

const THEMES = ["cyberpunk", "90s-party"] as const;
type Theme = (typeof THEMES)[number];

async function gotoApp(page: Page): Promise<void> {
  await page.goto("/?engine=stub");
  await waitForAppBoot(page);
  await dismissPrivacyBannerIfVisible(page);
}

async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate(
    (t) => document.documentElement.setAttribute("data-theme", t),
    theme,
  );
  // breve attesa per transizioni CSS
  await page.waitForTimeout(300);
}

test.describe("Visual Oracle TSK-169 — logo rendering", () => {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`${vp.name}-${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await gotoApp(page);
        await setTheme(page, theme);

        // Screenshot full header (cattura logo + tab bar)
        const header = page.locator("header").first();
        await header.screenshot({
          path: `${REPORT_DIR}/header-${vp.name}-${theme}.png`,
        });

        // Screenshot full page
        await page.screenshot({
          path: `${REPORT_DIR}/${vp.name}-${theme}.png`,
          fullPage: false,
        });
      });
    }
  }
});
