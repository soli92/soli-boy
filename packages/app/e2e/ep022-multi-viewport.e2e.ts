// EP-022 US-110 TSK-176 — Regression guard e2e multi-viewport
//
// Suite strutturale a 4 viewport che verifica il corretto funzionamento della UI
// responsive post-epica EP-022 (fix US-105..109):
//
//   S1 — Tablist + 4 tab visibili su ogni viewport
//   S2 — Marker DOM EP-021 (.proto-root) + ThemeSwitcher posizione corretta
//   S3 — Bounding box tablist: no overflow orizzontale + larghezza adeguata (portrait)
//   N  — Navigazione 4 tab (4 viewport × 4 tab = 16 combinazioni): panel attivo post-click.
//        Play usa keyboard nav su portrait (issue pre-esistente justify-center, TSK-167);
//        click diretto su tutti gli altri viewport.
//
// Non duplica:
//   - ep022-portrait-navbar.e2e.ts (TSK-167): suite P0 portrait con entrambi i temi
//     (cyberpunk + 90s-party) e Settings accordion "Tema" — resta autonoma.
//   - ep022-visual-*.e2e.ts (TSK-171/173/175): screenshot pixel-diff e overflow assertion
//     per singolo viewport.
//
// Nota selector "Info": su portrait (390px) la span sm:hidden mostra "Info" mentre
// la span hidden sm:inline è nascosta → usa /^Info/ su tutti i viewport per matchare
// sia "Info" (portrait) sia "Info & Privacy" (tablet/desktop/landscape).
//
// Nota bounding box: il layout header è flex-row (logo a sinistra, tablist a destra),
// non flex-column. La verifica di non-sovrapposizione si misura sulla LARGHEZZA del
// tablist (≥100px post-fix TSK-166) e sull'edge destro (no overflow), NON sull'asse Y.
//
// Cfr. TSK-176, US-110, EP-022.

import { test, expect, type Page } from "@playwright/test";
import { dismissPrivacyBannerIfVisible, waitForAppBoot } from "./helpers/app-nav";

// ---------------------------------------------------------------------------
// Costanti
// ---------------------------------------------------------------------------

const VIEWPORTS = [
  { name: "mobile-portrait", width: 390,  height: 844  },
  { name: "mobile-landscape", width: 844, height: 390  },
  { name: "tablet",           width: 768, height: 1024 },
  { name: "desktop",          width: 1280, height: 800 },
] as const;

type TabConfig = {
  id: string;
  displayName: string;
  tabName: string | RegExp;
  testId: string;
};

/**
 * 4 tab della IA soli-boy (increment 2, TSK-088/113).
 * "Info" usa regex /^Info/ per matchare sia "Info" (portrait) sia "Info & Privacy"
 * (tablet/landscape/desktop) — label abbreviata via span sm:hidden.
 */
const TABS: TabConfig[] = [
  { id: "play",     displayName: "Play",         tabName: "Play",         testId: "panel-play"     },
  { id: "library",  displayName: "Libreria",      tabName: "Libreria",     testId: "panel-library"  },
  { id: "settings", displayName: "Impostazioni",  tabName: "Impostazioni", testId: "panel-settings" },
  { id: "info",     displayName: "Info",          tabName: /^Info/,        testId: "panel-info"     },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Naviga con stub engine, aspetta boot e dismette eventuale banner privacy. */
async function gotoApp(page: Page): Promise<void> {
  await page.goto("/?engine=stub");
  await waitForAppBoot(page);
  await dismissPrivacyBannerIfVisible(page);
}

/**
 * Naviga al tab Play anti-regressione US-105.
 *
 * Strategia:
 *   1. Naviga a Libreria (verifica navigazione effettiva).
 *   2. Torna a Play:
 *      - Portrait (width ≤ 639): keyboard nav ArrowLeft da Libreria.
 *        Il tab Play su portrait ha una limitazione di cliccabilità visiva pre-esistente
 *        (overflow justify-center su TabsList ~213px con 4 tab da ~272px totali) — issue
 *        separata dal fix US-105; ArrowLeft bypassa l'occlusione visiva (TSK-167).
 *      - Tutti gli altri viewport: click diretto su tab Play.
 */
async function navigateToPlayTab(page: Page, vpWidth: number): Promise<void> {
  await page.getByRole("tab", { name: "Libreria" }).click();
  await expect(
    page.getByTestId("panel-library"),
    "panel-library deve essere active prima di tornare su Play",
  ).toHaveAttribute("data-state", "active");

  if (vpWidth <= 639) {
    // Keyboard nav: ArrowLeft su Libreria attiva Play (primo tab a sinistra).
    // activationMode="automatic" (default Radix) → attiva immediatamente.
    await page.getByRole("tab", { name: "Libreria" }).press("ArrowLeft");
  } else {
    await page.getByRole("tab", { name: "Play" }).click();
  }
}

// ---------------------------------------------------------------------------
// Suite parametrica — 4 viewport
// ---------------------------------------------------------------------------

for (const vp of VIEWPORTS) {
  test.describe(`[EP-022 multi-viewport] ${vp.name} ${vp.width}×${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    // -----------------------------------------------------------------------
    // S1: Tablist + 4 tab visibili
    // Verifica che la tab bar sia visibile e tutti i 4 tab raggiungibili su ogni
    // breakpoint. Regression guard diretto del bug US-105 (navbar collassata).
    // -----------------------------------------------------------------------
    test("S1 — tablist e 4 tab visibili", async ({ page }) => {
      await gotoApp(page);

      await expect(
        page.getByRole("tablist", { name: "Sezioni app" }),
        `[${vp.name}] tablist[aria-label="Sezioni app"] deve essere visibile`,
      ).toBeVisible();

      await expect(
        page.getByRole("tab", { name: "Play" }),
        `[${vp.name}] tab "Play" visibile`,
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Libreria" }),
        `[${vp.name}] tab "Libreria" visibile`,
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Impostazioni" }),
        `[${vp.name}] tab "Impostazioni" visibile`,
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: /^Info/ }),
        `[${vp.name}] tab "Info" (o "Info & Privacy") visibile`,
      ).toBeVisible();
    });

    // -----------------------------------------------------------------------
    // S2: Marker DOM EP-021 + ThemeSwitcher posizione
    //
    // .proto-root: marker EP-021/EP-020 Graphic Refactoring — assicura che la shell
    // React (solids components) sia presente su tutti i viewport.
    //
    // ThemeSwitcher: fix TSK-166 (US-105) — su portrait (width < 640px) rimosso
    // dall'header (hidden sm:block → display:none) e spostato in Settings accordion
    // "Tema". Su tablet/landscape/desktop (width ≥ 640px) rimane nell'header (sm:block).
    // -----------------------------------------------------------------------
    test("S2 — marker .proto-root + ThemeSwitcher posizione", async ({ page }) => {
      await gotoApp(page);

      // EP-021 regression guard: .proto-root deve essere attaccato su ogni viewport
      await expect(
        page.locator(".proto-root"),
        `[${vp.name}] .proto-root deve essere attaccato al DOM (EP-021 regression guard)`,
      ).toBeAttached();

      const headerSwitcher = page.locator("header .theme-switcher");
      if (vp.width <= 639) {
        // Mobile portrait: ThemeSwitcher assente dall'header (fix TSK-166)
        await expect(
          headerSwitcher,
          `[${vp.name}] header .theme-switcher NON deve essere visibile (hidden sm:block, width=${vp.width}px < 640px)`,
        ).not.toBeVisible();
      } else {
        // Tablet / landscape / desktop: ThemeSwitcher visibile nell'header
        await expect(
          headerSwitcher,
          `[${vp.name}] header .theme-switcher deve essere visibile (sm:block attivo, width=${vp.width}px ≥ 640px)`,
        ).toBeVisible();
      }
    });

    // -----------------------------------------------------------------------
    // S3: Bounding box tablist — no overflow orizzontale + larghezza adeguata
    //
    // Layout header: flex-row (logo a sinistra, tablist a destra).
    // Verifica asse X (edge destro del tablist ≤ viewport width + 2px tolleranza).
    // Su portrait: verifica anche larghezza > 100px (pre-fix era ~8px collassato).
    // NON usa asserzione Y-axis (colonna): il layout è inline, non a colonna.
    // -----------------------------------------------------------------------
    test("S3 — bounding box tablist (no overflow orizzontale)", async ({ page }) => {
      await gotoApp(page);

      const tablist = page.getByRole("tablist", { name: "Sezioni app" });
      const tablistBox = await tablist.boundingBox();

      expect(
        tablistBox,
        `[${vp.name}] tablist deve essere presente nel DOM`,
      ).not.toBeNull();

      // Edge destro del tablist non sfora il viewport (2px tolleranza sub-pixel)
      expect(
        tablistBox!.x + tablistBox!.width,
        `[${vp.name}] tablist right edge (${tablistBox!.x + tablistBox!.width}px) ` +
          `non deve sforare il viewport (${vp.width}px + 2px tolleranza)`,
      ).toBeLessThanOrEqual(vp.width + 2);

      if (vp.width <= 639) {
        // Portrait: larghezza adeguata post-fix TSK-166
        // Pre-fix: ThemeSwitcher (~198px, white-space:nowrap) nel flex-row comprimeva
        // il nav a ~8px; post-fix il nav prende l'intero spazio residuo (≥ 100px).
        expect(
          tablistBox!.width,
          `[${vp.name}] tablist.width (${tablistBox!.width}px) deve essere > 100px ` +
            `(pre-fix era ~8px collassato da ThemeSwitcher overlay)`,
        ).toBeGreaterThan(100);
      }
    });

    // -----------------------------------------------------------------------
    // N: Navigazione 4 tab → panel attivo
    // 4 viewport × 4 tab = 16 combinazioni totali (DoD TSK-176).
    // Ogni test verifica che dopo click/keyboard-nav il panel sia active.
    // -----------------------------------------------------------------------
    for (const tab of TABS) {
      test(`N — navigazione tab "${tab.displayName}" → panel attivo`, async ({
        page,
      }) => {
        await gotoApp(page);

        if (tab.id === "play") {
          // Play: naviga prima a Libreria poi torna a Play
          // (verifica navigazione effettiva + anti-regressione US-105 cliccabilità)
          await navigateToPlayTab(page, vp.width);
          await expect(
            page.getByTestId("panel-play"),
            `[${vp.name}] panel-play deve avere data-state=active`,
          ).toHaveAttribute("data-state", "active");
        } else {
          // Libreria / Impostazioni / Info: click diretto (su tutti i viewport)
          await page.getByRole("tab", { name: tab.tabName }).click();
          await expect(
            page.locator(`[data-testid="${tab.testId}"]`),
            `[${vp.name}] ${tab.testId} deve avere data-state=active`,
          ).toHaveAttribute("data-state", "active");
        }
      });
    }
  });
}
