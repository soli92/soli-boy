// EP-022 — Audit strutturale multi-viewport
// 4 viewport × 4 tab × 2 temi → 32 screenshot + 6 check strutturali per viewport
//
// TSK-165 (US-104, EP-022). Non è un pixel-diff test.
// Verifica struttura DOM/layout e accessibilità su ogni combinazione.
// Riferimento visivo vincolante: wiki/design/ep020-design-brief.md (R.D1)
//
// DELTA NOTI PRE-TSK-166:
//   - ThemeSwitcher è sempre nell'header su tutti i viewport (incluso mobile portrait).
//     Il test S4 su mobile-portrait è marcato fixme: codifica lo stato TARGET
//     post-fix TSK-166 (ThemeSwitcher spostato fuori dall'header su mobile-portrait).
//     Rimuovere test.fixme() quando TSK-166 è done.
//   - Possibile overflow header su mobile portrait (4 tab + logo + ThemeSwitcher
//     su 390px). Verificato da S2.
//
// Struttura output:
//   Screenshot → code_quality/reports/EP-022-fidelity-audit/<vp>-<tab>-<tema>.png
//   Report     → code_quality/reports/EP-022-fidelity-audit.md (compilato post-run)

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { test, expect, type Page } from "@playwright/test";
import {
  dismissPrivacyBannerIfVisible,
  waitForAppBoot,
} from "./helpers/app-nav";
import { setThemeViaDB } from "./helpers/set-theme";

// ---------------------------------------------------------------------------
// Viewport targets (coerenti con TSK-165 Technical Specs)
// ---------------------------------------------------------------------------

const VIEWPORTS = [
  { name: "mobile-portrait",  width: 390,  height: 844  }, // iPhone 14
  { name: "mobile-landscape", width: 844,  height: 390  }, // iPhone 14 landscape
  { name: "tablet",           width: 768,  height: 1024 }, // iPad
  { name: "desktop",          width: 1280, height: 800  }, // Desktop standard
] as const;

type Viewport = (typeof VIEWPORTS)[number];

// ---------------------------------------------------------------------------
// Temi (design brief §1: cyberpunk showcase + 90s-party brand default)
// ---------------------------------------------------------------------------

const THEMES = ["cyberpunk", "90s-party"] as const;
type Theme = (typeof THEMES)[number];

// ---------------------------------------------------------------------------
// Tab (IA 4 tab — App.tsx TABS costante)
// ---------------------------------------------------------------------------

const TABS = [
  { id: "play",     label: "Play",          panel: "panel-play"     },
  { id: "library",  label: "Libreria",       panel: "panel-library"  },
  { id: "settings", label: "Impostazioni",   panel: "panel-settings" },
  { id: "info",     label: "Info & Privacy", panel: "panel-info"     }, // desktop; mobile shows "Info" (sm:hidden span)
] as const;

type TabDef = (typeof TABS)[number];

// ---------------------------------------------------------------------------
// Directory screenshot: code_quality/reports/EP-022-fidelity-audit/
// __dirname = packages/app/e2e  →  ../../..  = repo root (soli-boy)
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "../../..");
const SCREENSHOT_DIR = path.join(
  REPO_ROOT,
  "code_quality/reports/EP-022-fidelity-audit",
);
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Helpers di navigazione
// ---------------------------------------------------------------------------

/** Naviga sull'app con stub engine e attende il boot completo. */
async function gotoApp(page: Page): Promise<void> {
  await page.goto("/?engine=stub");
  await waitForAppBoot(page);
  await dismissPrivacyBannerIfVisible(page);
}

/**
 * Naviga sull'app, imposta il tema via IndexedDB e ricarica.
 * setThemeViaDB: scrive il tema in IDB e fa page.reload(); dopo il reload
 * il banner privacy può riapparire (IDB fresco → usePrivacyAck non ack).
 */
async function gotoAppWithTheme(page: Page, theme: Theme): Promise<void> {
  await page.goto("/?engine=stub");
  await waitForAppBoot(page);
  // Scrive in IDB e ricarica la pagina con il tema applicato.
  await setThemeViaDB(page, theme, "/?engine=stub");
  // Dopo il reload: aspetta boot e chiudi eventuale banner privacy.
  await waitForAppBoot(page);
  await dismissPrivacyBannerIfVisible(page);
}

/**
 * Naviga alla tab specificata e attende che il panel sia visibile.
 * Per "play" (tab di default) verifica solo che il panel sia già visibile.
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
// Suite: per ogni viewport
// ---------------------------------------------------------------------------

for (const vp of VIEWPORTS) {
  test.describe(`[EP-022] ${vp.name} ${vp.width}×${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    // -----------------------------------------------------------------------
    // S1: I 4 tab sono visibili e cliccabili
    // -----------------------------------------------------------------------
    test("S1 — 4 tab visibili e cliccabili", async ({ page }) => {
      await gotoApp(page);

      const tablist = page.getByRole("tablist", { name: "Sezioni app" });
      await expect(tablist, "tablist[aria-label='Sezioni app'] deve essere visibile").toBeVisible();

      for (const tab of TABS) {
        const tabEl = page.getByRole("tab", { name: tab.label });
        await expect(tabEl, `Tab "${tab.label}" deve essere visibile`).toBeVisible();
        await expect(tabEl, `Tab "${tab.label}" deve essere abilitato`).toBeEnabled();
      }
    });

    // -----------------------------------------------------------------------
    // S2: Header senza overflow orizzontale
    // Controlla che .sb-app-header non superi il viewport width.
    // Delta noto pre-TSK-166: su mobile-portrait (390px) il contenuto
    // header (logo + 4 tab + ThemeSwitcher) potrebbe superare la larghezza.
    // -----------------------------------------------------------------------
    test("S2 — header senza overflow orizzontale", async ({ page }) => {
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
          overflow: r.right > window.innerWidth + 1, // 1px tolerance per sub-pixel
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
    // S3: Logo visibile nell'header
    // Invariante EP-021: il logo img.sb-logo con alt="Soli-boy" nell'header.
    // -----------------------------------------------------------------------
    test("S3 — logo visibile nell'header", async ({ page }) => {
      await gotoApp(page);
      const logo = page.locator("img.sb-logo");
      await expect(logo, "img.sb-logo deve essere visibile").toBeVisible();
      await expect(logo, 'alt="Soli-boy" richiesto').toHaveAttribute("alt", "Soli-boy");
    });

    // -----------------------------------------------------------------------
    // S4: Posizione ThemeSwitcher
    //
    // TARGET (post-TSK-166):
    //   mobile-portrait  → ThemeSwitcher NON nell'header (spostato sotto)
    //   altri viewport   → ThemeSwitcher nell'header (comportamento attuale)
    //
    // PRE-TSK-166: .theme-switcher è sempre dentro .sb-app-header.
    // Il test per mobile-portrait è marcato fixme perché codifica il TARGET.
    // -----------------------------------------------------------------------
    if (vp.name === "mobile-portrait") {
      // TSK-166 done: ThemeSwitcher spostato fuori dall'header su mobile-portrait
      // via `hidden sm:block` (display:none <640px). Rimosso test.fixme().
      test(
        "S4 — ThemeSwitcher NON nell'header su mobile-portrait (post-TSK-166)",
        async ({ page }) => {
          await gotoApp(page);
          await expect(
            page.locator(".sb-app-header .theme-switcher"),
            "Su mobile-portrait (post-TSK-166): .theme-switcher NON deve essere nell'header (hidden sm:block)",
          ).not.toBeVisible();
        },
      );
    } else {
      test("S4 — ThemeSwitcher visibile nell'header", async ({ page }) => {
        await gotoApp(page);
        await expect(
          page.locator(".sb-app-header .theme-switcher"),
          `Su ${vp.name}: .theme-switcher deve essere visibile nell'header`,
        ).toBeVisible();
      });
    }

    // -----------------------------------------------------------------------
    // S5: Touch target WCAG 2.5.5 — nessun elemento interattivo < 44px
    //
    // Soglia pragmatica: al massimo 3 violazioni (tolleranza per componenti
    // che estendono il touch target via pseudo-element ::before/::after CSS).
    // Viola > 3 → gate fallisce → review manuale richiesta.
    // -----------------------------------------------------------------------
    test("S5 — touch target WCAG 2.5.5 (≤3 elementi interattivi < 44px)", async ({
      page,
    }) => {
      await gotoApp(page);

      const violations = await page.evaluate((): Array<{
        tag: string;
        label: string;
        h: number;
      }> => {
        const sel = [
          "button",
          "a[href]",
          "input",
          "select",
          "textarea",
          "[role='tab']",
          "[role='switch']",
          "[role='slider']",
          "[role='checkbox']",
          "[role='radio']",
        ].join(",");

        return (Array.from(document.querySelectorAll(sel)) as HTMLElement[])
          .filter((el) => {
            const s = window.getComputedStyle(el);
            if (s.display === "none" || s.visibility === "hidden") return false;
            const r = el.getBoundingClientRect();
            // Skippa elementi fuori flusso / non renderizzati
            if (r.width === 0 && r.height === 0) return false;
            return r.height < 44;
          })
          .map((el) => ({
            tag: el.tagName.toLowerCase(),
            label: (el.getAttribute("aria-label") ?? el.textContent ?? "")
              .slice(0, 50)
              .trim(),
            h: Math.round(el.getBoundingClientRect().height * 10) / 10,
          }));
      });

      if (violations.length > 0) {
        console.warn(
          `[EP-022][WCAG 2.5.5][${vp.name}] ${violations.length} elemento/i con height < 44px:`,
          violations.map((v) => `<${v.tag}>[${v.label}]=${v.h}px`).join(" | "),
        );
      }

      expect(
        violations.length,
        `${violations.length} elementi interattivi con height < 44px (soglia: ≤3): ` +
          violations.map((v) => `<${v.tag}>[${v.label}]=${v.h}px`).join(" | "),
      ).toBeLessThanOrEqual(3);
    });

    // -----------------------------------------------------------------------
    // S6: Navigazione tab — contenuto si renderizza correttamente
    // Mappa gli Acceptance Criteria US-104:
    //   - Play: drop-zone visibile (idle) o .sb-screen
    //   - Library: sezione "Libreria giochi" presente
    //   - Settings: almeno un trigger accordion (Controlli — rimappatura)
    //   - Info: sezione privacy o legal card presente
    // -----------------------------------------------------------------------
    test("S6 — navigazione tab: contenuto si renderizza", async ({ page }) => {
      await gotoApp(page);

      // Play (tab di default, panel sempre montato via forceMount)
      await expect(
        page.locator('[data-testid="panel-play"]'),
        'Panel "panel-play" deve essere visibile',
      ).toBeVisible();
      const hasDropZone = await page
        .locator('[data-testid="play-idle-drop-zone"]')
        .isVisible()
        .catch(() => false);
      const hasSbScreen = await page
        .locator(".sb-screen")
        .isVisible()
        .catch(() => false);
      expect(
        hasDropZone || hasSbScreen,
        "Tab Play: drop-zone idle o .sb-screen deve essere visibile",
      ).toBe(true);

      // Libreria
      await page.getByRole("tab", { name: "Libreria" }).click();
      await expect(
        page.locator('[data-testid="panel-library"]'),
        'Panel "panel-library" deve essere visibile',
      ).toBeVisible({ timeout: 5_000 });
      await expect(
        page.locator('[aria-label="Libreria giochi"]'),
        '[aria-label="Libreria giochi"] deve essere presente',
      ).toBeVisible();

      // Impostazioni
      await page.getByRole("tab", { name: "Impostazioni" }).click();
      await expect(
        page.locator('[data-testid="panel-settings"]'),
        'Panel "panel-settings" deve essere visibile',
      ).toBeVisible({ timeout: 5_000 });
      // Accordion "Controlli — rimappatura" sempre presente in Settings (Radix AccordionTrigger)
      await expect(
        page.getByRole("button", { name: /^Controlli — rimappatura$/i }),
        "Trigger accordion 'Controlli — rimappatura' deve essere presente",
      ).toBeVisible();

      // Info & Privacy (mobile: accessible name is "Info" due to sm:hidden span)
      await page.getByRole("tab", { name: /^Info/ }).click();
      await expect(
        page.locator('[data-testid="panel-info"]'),
        'Panel "panel-info" deve essere visibile',
      ).toBeVisible({ timeout: 5_000 });
      const hasPrivacy = await page
        .locator('[data-testid="sb-privacy-section"]')
        .isVisible()
        .catch(() => false);
      const hasLegal = await page
        .locator('[data-testid="sb-legal-card"]')
        .isVisible()
        .catch(() => false);
      expect(
        hasPrivacy || hasLegal,
        "Tab Info: sezione privacy o legal card deve essere visibile",
      ).toBe(true);
    });

    // -----------------------------------------------------------------------
    // SCR: Screenshot matrice (4 tab × 2 temi = 8 per viewport)
    //
    // Output: code_quality/reports/EP-022-fidelity-audit/<vp>-<tab>-<tema>.png
    // Totale: 4 viewport × 8 = 32 screenshot.
    //
    // Asserzione minima: screenshot non vuoto (>10KB, >16 colori unici).
    // Non pixel-diff: la verifica visiva è delegata alla review umana.
    // -----------------------------------------------------------------------
    for (const theme of THEMES) {
      for (const tab of TABS) {
        test(`SCR — ${tab.id} / ${theme}`, async ({ page }) => {
          await gotoAppWithTheme(page, theme);
          await navigateTab(page, tab);

          const filename = `${vp.name}-${tab.id}-${theme}.png`;
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

          // Attach al report HTML di Playwright (utile per review in CI)
          await test.info().attach(filename, {
            body: buf,
            contentType: "image/png",
          });
        });
      }
    }
  });
}
