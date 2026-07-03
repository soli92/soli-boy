// EP-022 US-108 TSK-173 — Visual oracle tablet portrait (768×1024)
//
// Verifica visiva post-fix layout tablet su temi cyberpunk e 90s-party.
// Produce 8 screenshot di riferimento (4 tab × 2 temi):
//   code_quality/reports/EP-022-tablet/<tab>-<tema>-portrait.png
//
// Assertion strutturali post-TSK-172:
//   B — Library grid: 4 colonne (md:grid-cols-4 attivo a 768px, md=≥768px)
//   C — Navbar no-overlap: tablist.right ≤ 770px (768 + 2 sub-pixel tolerance)
//   D — ThemeSwitcher visibile nell'header (sm:block attivo a 768px > 640px)
//   E — Settings colonne: documentate senza failure (DoD 2-col fuori scope TSK-172)
//
// Nota Tailwind breakpoints:
//   sm=640px, md=768px (inclusive), lg=1024px.
//   A 768px: sm attivo (768≥640) E md attivo (768≥768).
//   → Library: md:grid-cols-4 → 4 colonne (NON 3 come pre-TSK-172).
//   → ThemeSwitcher: hidden sm:block → display:block (visibile).
//
// Cfr. TSK-173, TSK-172, US-108, EP-022.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { test, expect, type Page } from "@playwright/test";
import {
  dismissPrivacyBannerIfVisible,
  waitForAppBoot,
} from "./helpers/app-nav";

// ---------------------------------------------------------------------------
// Viewport
// ---------------------------------------------------------------------------

const TABLET_PORTRAIT = { width: 768, height: 1024 } as const;

// ---------------------------------------------------------------------------
// Temi
// ---------------------------------------------------------------------------

const THEMES = ["cyberpunk", "90s-party"] as const;
type Theme = (typeof THEMES)[number];

// ---------------------------------------------------------------------------
// Tab
// ---------------------------------------------------------------------------

type TabDef = {
  id: string;
  label: string | RegExp;
  panel: string;
};

const TABS: TabDef[] = [
  { id: "play",     label: "Play",          panel: "panel-play"     },
  { id: "library",  label: "Libreria",      panel: "panel-library"  },
  { id: "settings", label: "Impostazioni",  panel: "panel-settings" },
  // A 768px sm:hidden è attivo (768≥640): il testo "& Privacy" è nascosto.
  // Accessible name = "Info". Usiamo regex /^Info/ per coprire entrambi i casi.
  { id: "info",     label: /^Info/,         panel: "panel-info"     },
];

// ---------------------------------------------------------------------------
// Screenshot directory: code_quality/reports/EP-022-tablet/
// __filename = packages/app/e2e/ep022-visual-tablet.e2e.ts
// Tre livelli su: packages/app/e2e → packages/app → packages → repo-root
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "../../..");
const SCREENSHOT_DIR = path.join(REPO_ROOT, "code_quality/reports/EP-022-tablet");
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Naviga sull'app con stub engine e attende il boot completo. */
async function gotoApp(page: Page): Promise<void> {
  await page.goto("/?engine=stub");
  await waitForAppBoot(page);
  await dismissPrivacyBannerIfVisible(page);
}

/**
 * Imposta il tema su `<html data-theme>` senza reload.
 * Sufficiente per asserzioni strutturali e screenshot di layout/colore.
 */
async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate(
    (t) => document.documentElement.setAttribute("data-theme", t),
    theme,
  );
}

/**
 * Naviga alla tab specificata e attende che il panel sia visibile.
 * Per "play" (tab di default, panel sempre montato via forceMount) verifica
 * solo che il panel sia già visibile senza cliccare.
 */
async function navigateTab(page: Page, tab: TabDef): Promise<void> {
  if (tab.id === "play") {
    await expect(
      page.locator('[data-testid="panel-play"]'),
      'Panel "panel-play" deve essere visibile (tab di default)',
    ).toBeVisible({ timeout: 5_000 });
    return;
  }
  await page.getByRole("tab", { name: tab.label }).click();
  await expect(
    page.locator(`[data-testid="${tab.panel}"]`),
    `Panel "${tab.panel}" deve essere visibile`,
  ).toBeVisible({ timeout: 5_000 });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe("EP-022 US-108 TSK-173 — Tablet portrait visual oracle (768×1024)", () => {
  test.use({ viewport: TABLET_PORTRAIT });

  // -----------------------------------------------------------------------
  // A: Screenshot matrix — 4 tab × 2 temi = 8 screenshot
  //
  // Per ogni combinazione:
  //   1. gotoApp + boot + dismiss privacy
  //   2. navigateTab (click in-page, nessun reload → data-theme preservato)
  //   3. setTheme (page.evaluate, no reload)
  //   4. screenshot full-page
  //   5. assert overflow: scrollWidth ≤ 769 (768 + 1)
  // -----------------------------------------------------------------------
  for (const theme of THEMES) {
    for (const tab of TABS) {
      test(`A — SCR: ${tab.id} / ${theme} / portrait`, async ({ page }) => {
        await gotoApp(page);
        await navigateTab(page, tab);
        await setTheme(page, theme);

        const filename = `${tab.id}-${theme}-portrait.png`;
        const filepath = path.join(SCREENSHOT_DIR, filename);
        await page.screenshot({ path: filepath, fullPage: true });

        // Verifica screenshot non vuoto (>10KB, >16 byte unici)
        const buf = fs.readFileSync(filepath);
        expect(
          buf.byteLength,
          `Screenshot ${filename} troppo piccolo (${buf.byteLength}B < 10KB)`,
        ).toBeGreaterThan(10_000);
        expect(
          new Set(buf).size,
          `Screenshot ${filename} sembra monocolore/corrotto (${new Set(buf).size} byte unici)`,
        ).toBeGreaterThan(16);

        // Attach al report HTML Playwright
        await test.info().attach(filename, { body: buf, contentType: "image/png" });

        // Assertion overflow: scrollWidth ≤ 769 (768 + 1 per sub-pixel tolerance)
        const overflow = await page.evaluate((): {
          scrollWidth: number;
          overflows: boolean;
        } => ({
          scrollWidth: document.documentElement.scrollWidth,
          overflows: document.documentElement.scrollWidth > 769,
        }));

        expect(
          overflow.overflows,
          `Overflow orizzontale su ${tab.id}/${theme}: ` +
            `scrollWidth=${overflow.scrollWidth}px > 769px`,
        ).toBe(false);
      });
    }
  }

  // -----------------------------------------------------------------------
  // B: Library grid assertion — 4 colonne post-TSK-172
  //
  // TSK-172 ha aggiunto md:grid-cols-4. A 768px il breakpoint md è attivo
  // (768 ≥ 768), quindi la griglia deve avere 4 colonne, NON 3.
  //
  // La griglia <ul aria-label="Risultati libreria"> appare solo quando ci
  // sono ROM in libreria. Carichiamo più ROM fittizie via FileLoader
  // (Buffer.from, pattern già usato in app.e2e.ts) per triggerare il render.
  //
  // Selezione: filtriamo le colonne vuote con .filter(s=>s.trim()!=='')
  // per robustezza ai valori "repeat(N, …)" già calcolati dal browser.
  // -----------------------------------------------------------------------
  test("B — Library grid: 4 colonne a 768px (post-TSK-172 md:grid-cols-4)", async ({
    page,
  }) => {
    await gotoApp(page);
    await setTheme(page, "cyberpunk");

    // Naviga Libreria e aspetta panel + "Carica ROM" input
    await page.getByRole("tab", { name: "Libreria" }).click();
    await expect(
      page.locator('[data-testid="panel-library"]'),
      'Panel "panel-library" deve essere visibile',
    ).toBeVisible({ timeout: 5_000 });

    // Carica 5 ROM fittizie .gb (stesso pattern app.e2e.ts: Buffer fake accettato
    // da StubEngine. La piattaforma è dedotta dall'estensione dal FileLoader.)
    // 5 elementi: la griglia mostra almeno una riga completa su tutti i breakpoint.
    const romInput = page.getByLabel("Carica ROM");
    await expect(romInput).toBeAttached({ timeout: 5_000 });

    for (let i = 1; i <= 5; i++) {
      await romInput.setInputFiles({
        name: `rom${i}.gb`,
        mimeType: "application/octet-stream",
        buffer: Buffer.from(`ROMDATA-GB-${i}`),
      });
      // Aspetta che la ROM appaia come tile in libreria
      await expect(
        page.getByRole("button", { name: new RegExp(`rom${i}\\s+GB`, "i") }),
        `Tile rom${i} GB deve essere visibile`,
      ).toBeVisible({ timeout: 5_000 });
    }

    // Griglia renderizzata: <ul aria-label="Risultati libreria">
    const gridLocator = page.locator('[aria-label="Risultati libreria"]');
    await expect(gridLocator, 'ul[aria-label="Risultati libreria"] deve essere nel DOM').toBeAttached({ timeout: 5_000 });

    const colCount = await gridLocator.evaluate((el: Element): number => {
      const gts = getComputedStyle(el).gridTemplateColumns;
      return gts
        .split(" ")
        .filter((s: string) => s.trim() !== "")
        .length;
    });

    console.log(
      `[EP-022][tablet][B] Library grid columns a 768px: ${colCount} ` +
        `(atteso: 4 con md:grid-cols-4 post-TSK-172)`,
    );

    if (colCount !== 4) {
      console.warn(
        `[EP-022][tablet][B] ATTENZIONE: Library grid ha ${colCount} colonne (atteso 4). ` +
          `md:grid-cols-4 potrebbe non essere attivo. Verificare TSK-172.`,
      );
    }

    // Post-TSK-172: il breakpoint md (≥768px) è attivo su viewport 768px → 4 colonne.
    expect(
      colCount,
      `Library grid deve avere 4 colonne a 768px (md:grid-cols-4, md=≥768px). ` +
        `Trovate: ${colCount}. Nota: pre-TSK-172 erano 3 (sm:grid-cols-3).`,
    ).toBe(4);
  });

  // -----------------------------------------------------------------------
  // C: Navbar no-overlap — tablist.right ≤ 770px
  //
  // Il tablist deve stare nel viewport senza sforare a destra.
  // Tolleranza: 2px sub-pixel (768 + 2 = 770).
  // -----------------------------------------------------------------------
  test("C — Navbar no-overlap: tablist.right ≤ 770px (768 + 2 tolerance)", async ({
    page,
  }) => {
    await gotoApp(page);
    await setTheme(page, "cyberpunk");

    const tablist = page.getByRole("tablist", { name: "Sezioni app" });
    await expect(tablist, "tablist deve essere visibile").toBeVisible();

    const box = await tablist.boundingBox();
    expect(box, "tablist deve avere bounding box nel DOM").not.toBeNull();

    const rightEdge = box!.x + box!.width;
    console.log(
      `[EP-022][tablet][C] tablist bounding box: ` +
        `x=${box!.x.toFixed(1)} width=${box!.width.toFixed(1)} right=${rightEdge.toFixed(1)}px`,
    );

    expect(
      rightEdge,
      `tablist.right (${rightEdge.toFixed(1)}px) deve stare nel viewport ≤ 770px ` +
        `(768px + 2px sub-pixel tolerance)`,
    ).toBeLessThanOrEqual(770);
  });

  // -----------------------------------------------------------------------
  // D: ThemeSwitcher visibile nell'header su tablet (sm:block attivo a 768px)
  //
  // TSK-166 ha aggiunto `hidden sm:block` al ThemeSwitcher nell'header:
  //   - <640px (mobile): display:none
  //   - ≥640px (sm+): display:block
  // A 768px (sm attivo) → il ThemeSwitcher deve essere visibile nell'header.
  // -----------------------------------------------------------------------
  test("D — ThemeSwitcher visibile nell'header su tablet (sm:block attivo a 768px)", async ({
    page,
  }) => {
    await gotoApp(page);
    await setTheme(page, "cyberpunk");

    // Su 768px il breakpoint sm (≥640px) è attivo → hidden sm:block → display:block
    await expect(
      page.locator(".sb-app-header .theme-switcher"),
      "header .theme-switcher deve essere visibile a 768px (hidden sm:block → display:block al breakpoint sm)",
    ).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // E: Settings colonne — documentazione (no failure se 1 col)
  //
  // Il DoD "Settings 2 colonne su tablet" era nel corpo originale di TSK-172
  // ma è stato fuori scope. Non fallisce se il layout è 1 colonna.
  // Documentazione nel log per review manuale.
  // -----------------------------------------------------------------------
  test("E — Settings colonne: documentazione layout (no failure se 1 col)", async ({
    page,
  }) => {
    await gotoApp(page);
    await setTheme(page, "cyberpunk");

    await page.getByRole("tab", { name: "Impostazioni" }).click();
    await expect(
      page.locator('[data-testid="panel-settings"]'),
      'Panel "panel-settings" deve essere visibile',
    ).toBeVisible({ timeout: 5_000 });

    // Ispezione layout contenitore Settings (best-effort, non bloccante)
    const layoutInfo = await page.evaluate((): {
      found: boolean;
      display: string;
      gridTemplateColumns: string;
      estimatedCols: number;
    } => {
      const panel = document.querySelector('[data-testid="panel-settings"]');
      if (!panel) {
        return { found: false, display: "n/a", gridTemplateColumns: "n/a", estimatedCols: 0 };
      }

      // Cerca il primo container con display:grid nel panel
      const gridEl = panel.querySelector('.grid') ??
        [...panel.querySelectorAll('*')].find(
          (el) => getComputedStyle(el).display === 'grid',
        );

      if (gridEl) {
        const s = getComputedStyle(gridEl);
        const cols = s.gridTemplateColumns
          .split(' ')
          .filter((c) => c.trim() !== '').length;
        return {
          found: true,
          display: 'grid',
          gridTemplateColumns: s.gridTemplateColumns,
          estimatedCols: cols,
        };
      }

      // Nessun grid trovato: usa firstElementChild come proxy
      const child = panel.firstElementChild;
      if (!child) {
        return { found: false, display: "n/a", gridTemplateColumns: "n/a", estimatedCols: 0 };
      }
      const s = getComputedStyle(child);
      return {
        found: true,
        display: s.display,
        gridTemplateColumns: s.gridTemplateColumns || "n/a",
        estimatedCols: 1,
      };
    });

    console.log(
      `[EP-022][tablet][E] Settings layout a 768px: ` +
        `display=${layoutInfo.display}, ` +
        `estimatedCols=${layoutInfo.estimatedCols}, ` +
        `gridTemplateColumns="${layoutInfo.gridTemplateColumns}"`,
    );

    // Assertion minima non bloccante: il panel deve esistere nel DOM
    expect(
      layoutInfo.found,
      "panel-settings deve essere presente nel DOM",
    ).toBe(true);

    // Documentazione risultato (no failure se 1 colonna)
    if (layoutInfo.estimatedCols >= 2) {
      console.log("[EP-022][tablet][E] Settings: layout multi-colonna rilevato. DoD soddisfatto.");
    } else {
      console.warn(
        "[EP-022][tablet][E] NOTA: Settings a 768px mostra 1 colonna. " +
          "Il DoD '2 colonne su tablet' (TSK-172) era fuori scope — implementazione pendente. " +
          "Segnalare come gap se richiesto da US-108.",
      );
    }
  });
});
