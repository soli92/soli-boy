// TSK-073 — Anti-regressione blind-spot tema dark: verifica che screenshot dark
// ≠ light (md5/byte diff > 0).
//
// CONTESTO: il visual oracle v2.17 produceva screenshot light e dark byte-identici
// perché `page.emulateMedia({ colorScheme })` non commuta il tema in soli-boy
// (il tema è persistito in IndexedDB, non pilotato da prefers-color-scheme).
// Questo test rileva la regressione: se i due screenshot tornano identici, il
// blind-spot è rientrato.
//
// STRATEGIA:
//   1. Prima navigazione: imposta "dark" via IndexedDB (setThemeViaDB) → screenshot.
//   2. Rimuove il tema dal DB, imposta "90s-party" (light brand default) → screenshot.
//   3. Confronto md5: i due buffer devono differire. Se identici → FAIL-LOUD.
//
// Non usiamo `toMatchSnapshot` (richiede baseline committata); usiamo confronto
// diretto in-memory per garantire un test deterministico e autocontenuto.

import crypto from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  type UiTheme,
  clearThemeInDB,
  setThemeViaDB,
  setThemeViaSelector,
} from "./helpers/set-theme";
import { waitForAppBoot } from "./helpers/app-nav";

// Selettore usato per verificare che il render sia completato prima dello screenshot.
const ROOT_SELECTOR = "body";

test.describe("TSK-073 — tema dark ≠ light (anti-regressione blind-spot visual oracle)", () => {
  test.beforeEach(async ({ page }) => {
    // Naviga sulla pagina affinché il DB venga inizializzato, poi cancella
    // qualsiasi preferenza tema residua per garantire isolamento tra i test.
    await page.goto("/");
    await page.waitForSelector(ROOT_SELECTOR);
    await waitForAppBoot(page);
    await clearThemeInDB(page);
  });

  // ---------------------------------------------------------------------------
  // Test principale: screenshot dark ≠ light (via IndexedDB — strategia canonica)
  // ---------------------------------------------------------------------------
  test("screenshot dark e light differiscono (setThemeViaDB)", async ({ page }) => {
    // --- Screenshot "dark" ---
    // setThemeViaDB: scrive in IDB → reload → assertThemeApplied (fail-loud).
    await setThemeViaDB(page, "dark");
    await page.waitForSelector(ROOT_SELECTOR);
    // Attesa deterministica: avanza solo quando data-theme è stabile sul DOM.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const darkBuf = await page.screenshot({ fullPage: true });

    // --- Screenshot "90s-party" (brand default = variante light) ---
    await clearThemeInDB(page);
    await setThemeViaDB(page, "90s-party");
    await page.waitForSelector(ROOT_SELECTOR);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "90s-party");
    const lightBuf = await page.screenshot({ fullPage: true });

    // --- Confronto md5 ---
    const darkMd5 = md5(darkBuf);
    const lightMd5 = md5(lightBuf);

    expect(
      darkMd5,
      `FAIL-LOUD (TSK-073): screenshot dark e light sono byte-identici (md5=${darkMd5}). ` +
        `Il pilotaggio del tema via IndexedDB non funziona — la chiave canonica ` +
        `"ui-theme" nello store "config" del DB "soli-boy" non viene letta dall'app. ` +
        `Verificare set-theme.ts e theme-port.ts (TSK-044).`,
    ).not.toBe(lightMd5);
  });

  // ---------------------------------------------------------------------------
  // Test complementare: verifica setThemeViaSelector (strategia UI fallback)
  // ---------------------------------------------------------------------------
  test("screenshot dark e light differiscono (setThemeViaSelector)", async ({ page }) => {
    // Entrambi gli screenshot dalla stessa sessione pagina, tema cambiato via selector.

    // --- Screenshot "dark" via selector ---
    await setThemeViaSelector(page, "dark");
    // Attesa deterministica: avanza solo quando data-theme è stabile sul DOM.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const darkBuf = await page.screenshot({ fullPage: true });

    // --- Screenshot "90s-party" via selector ---
    await setThemeViaSelector(page, "90s-party");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "90s-party");
    const lightBuf = await page.screenshot({ fullPage: true });

    // --- Confronto md5 ---
    const darkMd5 = md5(darkBuf);
    const lightMd5 = md5(lightBuf);

    expect(
      darkMd5,
      `FAIL-LOUD (TSK-073): screenshot dark e light sono byte-identici (md5=${darkMd5}). ` +
        `Il pilotaggio del tema via ThemeSelector non commuta il render. ` +
        `Verificare ThemeSelector.tsx e useTheme.ts (TSK-044).`,
    ).not.toBe(lightMd5);
  });

  // ---------------------------------------------------------------------------
  // Test di correttezza helper: temi validi impostati correttamente via DB
  // ---------------------------------------------------------------------------
  test.describe("setThemeViaDB imposta data-theme correttamente", () => {
    test("tutti i temi validi → data-theme su <html>", async ({ page }) => {
      const themes: UiTheme[] = ["dark", "cyberpunk", "90s-party"];
      for (const theme of themes) {
        await clearThemeInDB(page);
        await setThemeViaDB(page, theme);
        const actual = await page.evaluate(
          (attr) => document.documentElement.getAttribute(attr),
          "data-theme",
        );
        expect(actual, `tema "${theme}"`).toBe(theme);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Test fail-loud: tema non valido deve lanciare immediatamente
  // ---------------------------------------------------------------------------
  test("setThemeViaDB lancia su tema non valido (fail-loud)", async ({ page }) => {
    await expect(
      // @ts-expect-error — test intenzionale con valore non valido
      setThemeViaDB(page, "non-esiste"),
    ).rejects.toThrow(/FAIL-LOUD.*non-esiste/);
  });
});

// ---- Utility -----------------------------------------------------------------

/** Calcola l'md5 esadecimale di un Buffer. */
function md5(buf: Buffer): string {
  return crypto.createHash("md5").update(buf).digest("hex");
}
