// EP-022 US-107 TSK-171 — Visual oracle mobile landscape.
//
// Script di audit Playwright per verificare il layout post-fix (TSK-170) su
// viewport 844×390 (iPhone 14 Pro landscape proxy).
//
// Copre 4 tab × 2 temi = 8 screenshot con assertion strutturali:
//   1. Nessun horizontal overflow (scrollWidth <= 844 + 1px tolerance).
//   2. Tablist visibile e non sovrapposta al Player (bounding-box check).
//   3. .sb-screen presente e non collassata a 0px (se Play + Player attivo).
//
// Assertion comportamentale aggiuntive:
//   - ThemeSwitcher IS visibile nell'header su landscape (844px > 640px → sm:block attivo).
//   - Tab "Info" mostra label "Info" (mobile) o "Info & Privacy" (desktop); match regex /^Info/.
//
// Output: code_quality/reports/EP-022-mobile-landscape/<tab>-<tema>.png
//
// Cfr. TSK-171, TSK-170 (fix landscape), US-107, EP-022.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { test, expect, type Page } from "@playwright/test";
import {
  dismissPrivacyBannerIfVisible,
  waitForAppBoot,
} from "./helpers/app-nav";

// ---------------------------------------------------------------------------
// Costanti
// ---------------------------------------------------------------------------

const LANDSCAPE = { width: 844, height: 390 } as const;
const THEMES = ["cyberpunk", "90s-party"] as const;
type Theme = (typeof THEMES)[number];

const TABS = [
  { id: "play",     label: "Play",        panel: "panel-play"     },
  { id: "library",  label: "Libreria",     panel: "panel-library"  },
  { id: "settings", label: "Impostazioni", panel: "panel-settings" },
  { id: "info",     label: /^Info/,        panel: "panel-info"     },
] as const;

type TabDef = (typeof TABS)[number];

// ---------------------------------------------------------------------------
// Directory screenshot: code_quality/reports/EP-022-mobile-landscape/
// __dirname = packages/app/e2e  →  ../../..  = repo root (soli-boy)
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "../../..");
const SCREENSHOT_DIR = path.join(
  REPO_ROOT,
  "code_quality/reports/EP-022-mobile-landscape",
);
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Naviga, aspetta boot, dismette eventuale banner privacy. */
async function gotoApp(page: Page): Promise<void> {
  await page.goto("/?engine=stub");
  await waitForAppBoot(page);
  await dismissPrivacyBannerIfVisible(page);
}

/**
 * Imposta il tema su `<html data-theme>` senza reload.
 * Adeguato per asserzioni strutturali dove la persistenza IDB non è necessaria.
 */
async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate(
    (t) => document.documentElement.setAttribute("data-theme", t),
    theme,
  );
}

/**
 * Naviga alla tab specificata e attende che il panel sia visibile.
 * Per "play" (tab di default) verifica solo che il panel sia già montato.
 */
async function navigateToTab(page: Page, tab: TabDef): Promise<void> {
  if (tab.id === "play") {
    await expect(
      page.locator('[data-testid="panel-play"]'),
      'Panel "panel-play" deve essere visibile (tab di default)',
    ).toBeVisible({ timeout: 5_000 });
    return;
  }
  // Il label può essere stringa o regex
  await page.getByRole("tab", { name: tab.label as string }).click();
  await expect(
    page.locator(`[data-testid="${tab.panel}"]`),
    `Panel "${tab.panel}" deve essere visibile`,
  ).toBeVisible({ timeout: 5_000 });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe("EP-022 US-107 — Mobile landscape visual oracle (TSK-171)", () => {
  test.use({ viewport: LANDSCAPE });

  // -----------------------------------------------------------------------
  // A1: ThemeSwitcher visibile nell'header su landscape (844px > 640px → sm:block)
  // -----------------------------------------------------------------------
  test("A1 — ThemeSwitcher IS visibile nell'header su landscape (sm:block attivo a 844px)", async ({
    page,
  }) => {
    await gotoApp(page);

    await expect(
      page.locator("header .theme-switcher"),
      "Su 844px (> 640px breakpoint sm:), .theme-switcher deve essere visibile nell'header (hidden sm:block → display:block)",
    ).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // A2: Header senza overflow orizzontale su landscape
  // -----------------------------------------------------------------------
  test("A2 — Header senza overflow orizzontale su 844×390", async ({ page }) => {
    await gotoApp(page);

    const res = await page.evaluate((): {
      found: boolean;
      overflow: boolean;
      headerW: number;
      vpW: number;
    } => {
      const h = document.querySelector(".sb-app-header") as HTMLElement | null;
      if (!h) return { found: false, overflow: false, headerW: 0, vpW: 0 };
      const r = h.getBoundingClientRect();
      return {
        found: true,
        overflow: r.right > window.innerWidth + 1,
        headerW: Math.round(r.width),
        vpW: window.innerWidth,
      };
    });

    expect(res.found, ".sb-app-header deve esistere nel DOM").toBe(true);
    expect(
      res.overflow,
      `Overflow header rilevato: headerWidth=${res.headerW}px > viewportWidth=${res.vpW}px`,
    ).toBe(false);
  });

  // -----------------------------------------------------------------------
  // A3: Tablist visibile su landscape
  // -----------------------------------------------------------------------
  test("A3 — Tablist visibile e non collassato su 844×390", async ({ page }) => {
    await gotoApp(page);

    const tablist = page.getByRole("tablist", { name: "Sezioni app" });
    await expect(tablist, 'tablist[aria-label="Sezioni app"] deve essere visibile').toBeVisible();

    const tablistBox = await tablist.boundingBox();
    expect(tablistBox, "tablist deve essere nel DOM").not.toBeNull();
    expect(
      tablistBox!.width,
      `tablist.width (${tablistBox!.width}px) deve essere > 100px su landscape`,
    ).toBeGreaterThan(100);
  });

  // -----------------------------------------------------------------------
  // A4: 4 tab visibili e raggiungibili su landscape
  // -----------------------------------------------------------------------
  test("A4 — 4 tab visibili su 844×390", async ({ page }) => {
    await gotoApp(page);

    await expect(page.getByRole("tab", { name: "Play" }), 'tab "Play" deve essere visibile').toBeVisible();
    await expect(page.getByRole("tab", { name: "Libreria" }), 'tab "Libreria" deve essere visibile').toBeVisible();
    await expect(page.getByRole("tab", { name: "Impostazioni" }), 'tab "Impostazioni" deve essere visibile').toBeVisible();
    await expect(page.getByRole("tab", { name: /^Info/ }), 'tab "Info" deve essere visibile').toBeVisible();
  });

  // -----------------------------------------------------------------------
  // SCR: Screenshot matrice (4 tab × 2 temi = 8 screenshot) + overflow assertion
  // -----------------------------------------------------------------------
  for (const theme of THEMES) {
    test.describe(`tema: ${theme}`, () => {
      for (const tab of TABS) {
        test(`SCR + overflow — ${tab.id} / ${theme}`, async ({ page }) => {
          await gotoApp(page);
          await setTheme(page, theme);
          await navigateToTab(page, tab);

          // --- Assertion overflow ---
          const overflowResult = await page.evaluate((): {
            scrollWidth: number;
            vpWidth: number;
            overflow: boolean;
          } => {
            const sw = document.documentElement.scrollWidth;
            const vw = window.innerWidth;
            return {
              scrollWidth: sw,
              vpWidth: vw,
              overflow: sw > vw + 1,
            };
          });

          expect(
            overflowResult.overflow,
            `[${tab.id}/${theme}] Horizontal overflow rilevato: scrollWidth=${overflowResult.scrollWidth}px > vpWidth=${overflowResult.vpWidth}px + 1`,
          ).toBe(false);

          // --- Assertion tablist non sovrapposta al Player ---
          const tablistBox = await page.getByRole("tablist", { name: "Sezioni app" }).boundingBox();
          expect(tablistBox, "tablist deve essere nel DOM").not.toBeNull();

          // Se la tab Play è attiva, controlla eventuale presenza .sb-screen
          if (tab.id === "play") {
            const sbScreenEl = page.locator(".sb-screen");
            const isAttached = await sbScreenEl.count().then((c) => c > 0);
            if (isAttached) {
              const sbScreenBox = await sbScreenEl.boundingBox();
              if (sbScreenBox) {
                // .sb-screen non deve collassare a 0px height (se presente e visibile)
                expect(
                  sbScreenBox.height,
                  ".sb-screen non deve collassare a 0px height",
                ).toBeGreaterThan(0);
                // Tablist non sovrapposto al Player: il tablist deve terminare
                // prima del bordo superiore dello screen, oppure il tablist deve essere
                // al di sopra (y inferiore). Su layout con nav in alto, tablistBox.y < sbScreenBox.y.
                // Verifica minima: non completa sovrapposizione.
                const tablistBottom = tablistBox!.y + tablistBox!.height;
                const screenTop = sbScreenBox.y;
                expect(
                  tablistBottom,
                  `Tablist bottom (${tablistBottom}px) non deve superare lo screen top (${screenTop}px) di più di 10px`,
                ).toBeLessThanOrEqual(screenTop + 10);
              }
            }
          }

          // --- Screenshot full-page ---
          const filename = `${tab.id}-${theme}.png`;
          const filepath = path.join(SCREENSHOT_DIR, filename);
          await page.screenshot({ path: filepath, fullPage: true });

          // Verifica screenshot non vuoto
          const buf = fs.readFileSync(filepath);
          expect(
            buf.byteLength,
            `Screenshot ${filename} troppo piccolo (${buf.byteLength}B < 10KB)`,
          ).toBeGreaterThan(10_000);
          expect(
            new Set(buf).size,
            `Screenshot ${filename} sembra monocolore/corrotto (${new Set(buf).size} byte unici)`,
          ).toBeGreaterThan(16);

          // Attach al report HTML di Playwright
          await test.info().attach(filename, {
            body: buf,
            contentType: "image/png",
          });
        });
      }
    });
  }
});
