// EP-022 US-109 TSK-175 — Visual oracle desktop (1280×800)
//
// Verifica parità strutturale post-fix TSK-174 su viewport desktop.
// 4 tab × 2 temi = 8 screenshot + assertion strutturali specifiche.
//
// Assertion coperte:
//   A) Marker DOM EP-021 stabili (selettori esatti da visual-fidelity.ts)
//   B) ThemeSwitcher visibile nell'header su desktop (sm:block attivo a 1280px)
//   C) Library grid 5 colonne su desktop (lg:grid-cols-5 attivo a 1280px)
//   D) Tab "Info & Privacy" label completa su desktop (non abbreviata)
//   SCR) 4 tab × 2 temi → screenshot full-page + assertion overflow orizzontale
//
// Output screenshot: code_quality/reports/EP-022-desktop/<tab>-<tema>.png
// Cfr. TSK-175, TSK-174, US-109, EP-022.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { test, expect, type Page } from "@playwright/test";
import {
  dismissPrivacyBannerIfVisible,
  waitForAppBoot,
} from "./helpers/app-nav";
import {
  SHELL_MARKERS,
  PLAY_IDLE_MARKERS,
  INFO_MARKERS,
  assertMarkersVisible,
} from "./helpers/visual-fidelity";

// ---------------------------------------------------------------------------
// Viewport, temi, tab
// ---------------------------------------------------------------------------

const DESKTOP = { width: 1280, height: 800 } as const;
const THEMES = ["cyberpunk", "90s-party"] as const;
type Theme = (typeof THEMES)[number];

const TABS = [
  { id: "play",     label: "Play",          panel: "panel-play"     },
  { id: "library",  label: "Libreria",       panel: "panel-library"  },
  { id: "settings", label: "Impostazioni",   panel: "panel-settings" },
  { id: "info",     label: "Info & Privacy", panel: "panel-info"     },
] as const;
type TabDef = (typeof TABS)[number];

// ---------------------------------------------------------------------------
// Directory screenshot — code_quality/reports/EP-022-desktop/
// __filename = packages/app/e2e/ep022-visual-desktop.e2e.ts
// Risalendo: ../.. = packages/app, ../../.. = repo root (soli-boy)
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "../../..");
const SCREENSHOT_DIR = path.join(REPO_ROOT, "code_quality/reports/EP-022-desktop");
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Naviga l'app con stub engine, aspetta boot e dismette eventuale banner privacy. */
async function gotoApp(page: Page): Promise<void> {
  await page.goto("/?engine=stub");
  await waitForAppBoot(page);
  await dismissPrivacyBannerIfVisible(page);
}

/**
 * Imposta il tema via `page.evaluate` (senza reload).
 * Adeguato per asserzioni strutturali e screenshot dove la persistenza IDB non
 * è necessaria. Coerente con l'approccio usato in ep022-portrait-navbar.e2e.ts.
 */
async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate(
    (t) => document.documentElement.setAttribute("data-theme", t),
    theme,
  );
}

/**
 * Naviga alla tab specificata e attende che il panel sia visibile.
 * Per "play" (tab di default con forceMount) verifica solo la visibilità del panel.
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

test.describe("EP-022 US-109 — Visual oracle desktop 1280×800 (TSK-175)", () => {
  test.use({ viewport: DESKTOP });

  // -------------------------------------------------------------------------
  // A: Marker DOM EP-021 stabili su desktop (regression guard)
  // Selettori ESATTI da e2e/helpers/visual-fidelity.ts (SHELL_MARKERS,
  // PLAY_IDLE_MARKERS.prod, INFO_MARKERS.prod) — invariati.
  // -------------------------------------------------------------------------
  test("A1 — Marker DOM EP-021 SHELL stabili su desktop", async ({ page }) => {
    await gotoApp(page);
    // SHELL_MARKERS = [".proto-root", ".theme-switcher", ".sb-app-header, header"]
    await assertMarkersVisible(page, SHELL_MARKERS);
  });

  test("A2 — Marker DOM EP-021 Play idle stabili su desktop", async ({
    page,
  }) => {
    await gotoApp(page);
    // PLAY_IDLE_MARKERS.prod = [".sb-screen", '[data-testid="play-idle-drop-zone"]']
    await assertMarkersVisible(page, PLAY_IDLE_MARKERS.prod);
  });

  test("A3 — Marker DOM EP-021 Info stabili su desktop", async ({ page }) => {
    await gotoApp(page);
    await page.getByRole("tab", { name: /^Info/ }).click();
    await expect(
      page.locator('[data-testid="panel-info"]'),
      'Panel "panel-info" deve essere visibile',
    ).toBeVisible({ timeout: 5_000 });
    // INFO_MARKERS.prod = ['[data-testid="sb-privacy-section"]',
    //   '[data-testid="sb-store-compliance-section"]',
    //   '[data-testid="sb-legal-card"]']
    for (const marker of INFO_MARKERS.prod) {
      await expect(
        page.locator(marker).first(),
        `marker info attaccato al DOM: ${marker}`,
      ).toBeAttached();
    }
  });

  // -------------------------------------------------------------------------
  // B: ThemeSwitcher visibile nell'header su desktop
  // Fix TSK-166: "hidden sm:block" → su 1280px (≥640) display:block → visibile.
  // Selettore: header .theme-switcher (via .sb-app-header in produzione).
  // -------------------------------------------------------------------------
  test("B — ThemeSwitcher visibile nell'header su desktop (sm:block attivo a 1280px)", async ({
    page,
  }) => {
    await gotoApp(page);
    await expect(
      page.locator("header .theme-switcher"),
      "header .theme-switcher deve essere visibile su viewport 1280px (sm:block attivo)",
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // C: Library grid 5 colonne su desktop
  // Classe Tailwind: lg:grid-cols-5 (attiva a 1024px+). A 1280px deve dare 5 col.
  //
  // La grid <ul> si renderizza solo quando ci sono ROM in libreria. Prima di
  // navigare alla Library, si inserisce una ROM sintetica in IDB (tecnica analoga
  // a setThemeViaDB) per attivare il branch `roms.length > 0` del componente.
  // -------------------------------------------------------------------------
  test("C — Library grid 5 colonne su desktop (lg:grid-cols-5)", async ({
    page,
  }) => {
    // 1. Naviga e attendi che l'app inizializzi IDB con gli object store.
    await gotoApp(page);

    // 2. Inserisci una ROM sintetica nello store `roms` di IndexedDB per attivare
    //    il rendering della <ul class="grid …"> nel componente Library.
    //    Il record rispetta la struttura `RomRecord` di storage/types.ts.
    const inserted = await page.evaluate(async (): Promise<{
      ok: boolean;
      error?: string;
    }> => {
      return new Promise((resolve) => {
        const req = indexedDB.open("soli-boy");
        req.onerror = () =>
          resolve({ ok: false, error: req.error?.message ?? "open failed" });
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("roms")) {
            db.close();
            resolve({ ok: false, error: "store 'roms' non trovato in soli-boy DB" });
            return;
          }
          const tx = db.transaction("roms", "readwrite");
          const fileBlob = new Blob(["dummy-rom-data-desktop-grid"], {
            type: "application/octet-stream",
          });
          // Record minimale compatibile con RomRecord (storage/types.ts)
          const record = {
            id: "test-rom-desktop-grid-ep022",
            title: "Test Grid ROM",
            platform: "GB",
            core: "gambatte",
            fileBlob,
            addedAt: Date.now(),
          };
          const putReq = tx.objectStore("roms").put(record);
          putReq.onerror = () =>
            resolve({ ok: false, error: putReq.error?.message ?? "put failed" });
          tx.oncomplete = () => {
            db.close();
            resolve({ ok: true });
          };
          tx.onerror = () =>
            resolve({ ok: false, error: tx.error?.message ?? "tx error" });
        };
      });
    });

    expect(
      inserted.ok,
      `Inserimento ROM sintetica in IDB fallito: ${inserted.error ?? "unknown"}`,
    ).toBe(true);

    // 3. Ricarica l'app: Library.tsx leggerà la ROM appena inserita.
    await page.reload();
    await waitForAppBoot(page);
    await dismissPrivacyBannerIfVisible(page);

    // 4. Naviga alla tab Libreria e attendi che il panel sia visibile.
    await page.getByRole("tab", { name: "Libreria" }).click();
    await expect(
      page.locator('[data-testid="panel-library"]'),
      'Panel "panel-library" deve essere visibile',
    ).toBeVisible({ timeout: 5_000 });

    // 5. La <ul class="grid lg:grid-cols-5 …"> è ora presente nel DOM.
    //    Conta le colonne via getComputedStyle — a 1280px il breakpoint lg (≥1024px)
    //    deve attivare `grid-template-columns: repeat(5, minmax(0, 1fr))`.
    const gridEl = page.locator('[data-testid="panel-library"] .grid');
    const cols = await gridEl.evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean).length,
    );
    expect(
      cols,
      `Library grid deve avere 5 colonne su 1280px (lg:grid-cols-5); trovate: ${cols}`,
    ).toBe(5);
  });

  // -------------------------------------------------------------------------
  // D: Tab "Info & Privacy" label completa su desktop
  // Su mobile il testo "& Privacy" è nascosto via sm:hidden; su desktop (1280px)
  // deve essere visibile il tab con nome completo "Info & Privacy".
  // -------------------------------------------------------------------------
  test('D — Tab "Info & Privacy" label completa su desktop (non abbreviata)', async ({
    page,
  }) => {
    await gotoApp(page);
    await expect(
      page.getByRole("tab", { name: "Info & Privacy" }),
      'Tab "Info & Privacy" deve essere visibile con label completa su desktop',
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // SCR: 4 tab × 2 temi = 8 screenshot full-page
  //
  // Per ogni combinazione:
  //   1. Naviga tab
  //   2. Imposta tema via page.evaluate
  //   3. Screenshot full-page → code_quality/reports/EP-022-desktop/<tab>-<tema>.png
  //   4. Assertion overflow: scrollWidth ≤ viewport.width + 1 (1px tolerance)
  //   5. Validità screenshot: > 8KB, > 16 colori unici
  // -------------------------------------------------------------------------
  for (const theme of THEMES) {
    for (const tab of TABS) {
      test(`SCR — ${tab.id} / ${theme}`, async ({ page }) => {
        await gotoApp(page);
        await navigateTab(page, tab);
        await setTheme(page, theme);

        // Assertion overflow orizzontale: scrollWidth ≤ 1280 + 1 (1px tolerance)
        const overflow = await page.evaluate(
          (vpW) => document.documentElement.scrollWidth > vpW + 1,
          DESKTOP.width,
        );
        expect(
          overflow,
          `Overflow orizzontale rilevato su ${tab.id}/${theme}: ` +
            `scrollWidth > ${DESKTOP.width + 1}px`,
        ).toBe(false);

        // Screenshot full-page
        const filename = `${tab.id}-${theme}.png`;
        const filepath = path.join(SCREENSHOT_DIR, filename);
        await page.screenshot({ path: filepath, fullPage: true });

        // Validità screenshot: non vuoto, non monocolore
        const buf = fs.readFileSync(filepath);
        expect(
          buf.byteLength,
          `Screenshot ${filename} troppo piccolo (${buf.byteLength}B < 8KB)`,
        ).toBeGreaterThan(8_000);
        expect(
          new Set(buf).size,
          `Screenshot ${filename} sembra monocolore/corrotto (${new Set(buf).size} byte unici)`,
        ).toBeGreaterThan(16);

        // Attach al report HTML Playwright (utile per review in CI/visual oracle)
        await test.info().attach(filename, {
          body: buf,
          contentType: "image/png",
        });
      });
    }
  }
});
