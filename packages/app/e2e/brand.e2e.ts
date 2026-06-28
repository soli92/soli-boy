// TSK-048 — E2e smoke test brand: favicon, manifest, logo header (US-037/038/039).
// Verifica che gli artefatti brand introdotti da TSK-043, TSK-045 e TSK-046
// siano presenti e raggiungibili a runtime in Chromium.
// Engine: StubEngine (default, nessun parametro ?engine=real necessario).
import { expect, test } from "@playwright/test";
import { waitForAppBoot } from "./helpers/app-nav";

test("favicon dichiarata in head", async ({ page }) => {
  await page.goto("/");
  await waitForAppBoot(page);
  const faviconHref = await page.locator('link[rel="icon"]').first().getAttribute("href");
  expect(faviconHref).toBeTruthy();
});

test("manifest.webmanifest raggiungibile", async ({ page }) => {
  await page.goto("/");
  await waitForAppBoot(page);
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBeTruthy();
  // Verifica HTTP 200 e contenuto JSON del manifest.
  const resp = await page.request.get(manifestHref!);
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.name).toBe("Soli-boy");
  expect(body.icons?.length).toBeGreaterThanOrEqual(2);
});

test("logo Soli-boy visibile nella Library", async ({ page }) => {
  await page.goto("/");
  await waitForAppBoot(page);
  // IA a 4 tab (increment 2): l'header con logo è dentro la tab Libreria.
  await page.getByRole("tab", { name: "Libreria" }).click();
  // TSK-046 rende il logo come <img alt="Soli-boy"> (non un form control):
  // getByAltText è il locator corretto; getByLabel è riservato ai form control.
  // TSK-103 fix: il logo appare sia nell'app header (<h1>) sia nell'header della
  // Library (TSK-046). Disambiguiamo cercando il logo dentro la sezione Library
  // ([aria-label="Libreria giochi"]) che è la posizione canonica introdotta da
  // TSK-046. Entrambe le istanze sono tecnicamente "nella Library" quando la tab
  // Libreria è aperta, ma questo selettore è più preciso sul componente Library.
  await expect(
    page.locator('[aria-label="Libreria giochi"]').getByAltText("Soli-boy")
  ).toBeVisible();
});
